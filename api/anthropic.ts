import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import { checkRateLimit } from "./_lib/rateLimit";
import { checkAndConsumeCredit } from "./_lib/credits";

const ALLOWED_MODELS = ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];
const MAX_TOKENS_LIMIT = 2000;
const MAX_BODY_BYTES = 64 * 1024; // 64KB

type AiMode = "standard" | "byok_local" | "byok_cloud";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  model?: unknown;
  max_tokens?: unknown;
  messages?: unknown;
  ai_mode?: unknown;
}

interface AnthropicErrorResponse {
  error?: { message?: string };
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function validateMode(mode: unknown): AiMode {
  if (mode === "byok_local" && process.env.ALLOW_BYOK_LOCAL !== "true") {
    throw Object.assign(new Error("BYOK local mode is not enabled"), { status: 403 });
  }
  if (mode === "byok_cloud" && process.env.ALLOW_BYOK_CLOUD !== "true") {
    throw Object.assign(new Error("BYOK cloud mode is not enabled"), { status: 403 });
  }
  if (mode !== "standard" && mode !== "byok_local" && mode !== "byok_cloud") {
    return "standard";
  }
  return mode as AiMode;
}

async function resolveApiKey(mode: AiMode, req: VercelRequest, userId: string): Promise<string> {
  if (mode === "byok_local") {
    const byokKey = req.headers["x-byok-key"];
    if (typeof byokKey !== "string" || !byokKey.startsWith("sk-ant-")) {
      throw Object.assign(new Error("Invalid BYOK key format"), { status: 400 });
    }
    return byokKey;
  }

  if (mode === "byok_cloud") {
    const { getDecryptedByokKey } = await import("./_lib/encrypt");
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("user_byok_keys")
      .select("encrypted_key, iv")
      .eq("user_id", userId)
      .single();
    if (error || !data) {
      throw Object.assign(new Error("BYOK cloud key not found"), { status: 400 });
    }
    return getDecryptedByokKey(data.encrypted_key, data.iv);
  }

  // standard mode: use server's API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    throw Object.assign(new Error("Server configuration error"), { status: 500 });
  }
  return apiKey;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await _handler(req, res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal Server Error";
    console.error("Unhandled error in handler:", e);
    try { res.status(500).json({ error: msg }); } catch { /* response already sent */ }
  }
}

async function _handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Body size check
  const contentLength = parseInt(req.headers["content-length"] ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Request body too large" });
  }

  // JWT 認証
  let userId: string;
  try {
    userId = await verifyToken(req.headers["authorization"]);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return res.status(err.status ?? 401).json({ error: "Unauthorized" });
  }

  const { model, max_tokens, messages, ai_mode } = (req.body ?? {}) as RequestBody;

  // モード検証
  let mode: AiMode;
  try {
    mode = validateMode(ai_mode);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return res.status(err.status ?? 403).json({ error: err.message ?? "Forbidden" });
  }

  // レート制限（standard モードのみ）
  if (mode === "standard") {
    try {
      await checkRateLimit(userId, getClientIp(req));
    } catch (e) {
      const err = e as { status?: number };
      return res.status(err.status ?? 429).json({ error: "Too many requests" });
    }
  }

  // リクエストバリデーション（既存）
  if (typeof model !== "string" || !(ALLOWED_MODELS as readonly string[]).includes(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }
  if (typeof max_tokens !== "number" || max_tokens < 1 || max_tokens > MAX_TOKENS_LIMIT) {
    return res.status(400).json({ error: "Invalid max_tokens" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid messages: must be a non-empty array" });
  }
  for (const msg of messages as unknown[]) {
    if (typeof msg !== "object" || msg === null) {
      return res.status(400).json({ error: "Invalid messages: each message must be an object" });
    }
    const m = msg as Record<string, unknown>;
    if (!["user", "assistant"].includes(m.role as string)) {
      return res.status(400).json({ error: "Invalid messages: role must be 'user' or 'assistant'" });
    }
    if (typeof m.content !== "string" || m.content.trim().length === 0) {
      return res.status(400).json({ error: "Invalid messages: content must be a non-empty string" });
    }
  }

  // クレジット確認（standard モードのみ）
  if (mode === "standard") {
    try {
      await checkAndConsumeCredit(userId);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      return res.status(err.status ?? 429).json({ error: err.message ?? "Credit limit exceeded" });
    }
  }

  // APIキー解決
  let apiKey: string;
  try {
    apiKey = await resolveApiKey(mode, req, userId);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return res.status(err.status ?? 500).json({ error: err.message ?? "Internal Server Error" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ model: model as AllowedModel, max_tokens, messages: messages as Message[] }),
    });

    const data = await response.json() as AnthropicErrorResponse;
    if (!response.ok) {
      console.error("Anthropic API error for user:", userId, "status:", response.status);
      return res.status(response.status).json({
        error: data.error?.message ?? "Anthropic API returned an error",
        details: data.error,
      });
    }

    res.status(200).json(data);
  } catch (e) {
    console.error("Internal Server Error for user:", userId);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
