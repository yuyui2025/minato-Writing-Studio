import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_lib/auth";
import { getDecryptedByokKey } from "./_lib/encrypt";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  let userId: string;
  try {
    userId = await verifyToken(req.headers["authorization"]);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("user_byok_keys")
    .select("encrypted_key, iv")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "BYOK cloud key not found" });
  }

  let apiKey: string;
  try {
    apiKey = getDecryptedByokKey(data.encrypted_key, data.iv);
  } catch {
    return res.status(500).json({ error: "Failed to decrypt key" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });

    if (!response.ok) {
      return res.status(400).json({ error: "API key validation failed" });
    }

    // 接続確認成功: last_verified_at を更新
    await supabase.from("user_byok_keys")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("user_id", userId);

    res.status(200).json({ ok: true });
  } catch {
    console.error("BYOK test connection error for user:", userId);
    res.status(500).json({ error: "Connection test failed" });
  }
}
