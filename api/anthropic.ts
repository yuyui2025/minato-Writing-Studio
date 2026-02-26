import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_MODELS = ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];
const MAX_TOKENS_LIMIT = 2000;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  model?: unknown;
  max_tokens?: unknown;
  messages?: unknown;
}

interface AnthropicErrorResponse {
  error?: { message?: string };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { model, max_tokens, messages } = (req.body ?? {}) as RequestBody;

  if (typeof model !== "string" || !(ALLOWED_MODELS as readonly string[]).includes(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }
  if (typeof max_tokens !== "number" || max_tokens < 1 || max_tokens > MAX_TOKENS_LIMIT) {
    return res.status(400).json({ error: "Invalid max_tokens" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid messages: must be a non-empty array" });
  }

  // Validate each message
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY environment variable");
    return res.status(500).json({ error: "Server configuration error: Missing API Key" });
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
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({
        error: data.error?.message ?? "Anthropic API returned an error",
        details: data.error,
      });
    }

    res.status(200).json(data);
  } catch (e) {
    console.error("Internal Server Error:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
