import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_lib/auth";
import { encryptByokKey } from "./_lib/encrypt";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  let userId: string;
  try {
    userId = await verifyToken(req.headers["authorization"]);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { apiKey } = req.body as { apiKey?: unknown };
  if (typeof apiKey !== "string" || !apiKey.startsWith("sk-ant-")) {
    return res.status(400).json({ error: "Invalid API key format" });
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { encryptedKey, iv } = encryptByokKey(apiKey);
  const keyHint = "..." + apiKey.slice(-4);

  const { error } = await supabase.from("user_byok_keys").upsert({
    user_id: userId,
    encrypted_key: encryptedKey,
    iv,
    key_hint: keyHint,
    last_verified_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("BYOK save error for user:", userId);
    return res.status(500).json({ error: "Failed to save key" });
  }

  res.status(200).json({ keyHint });
}
