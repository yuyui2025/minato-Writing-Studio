import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") return res.status(405).end();

  let userId: string;
  try {
    userId = await verifyToken(req.headers["authorization"]);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { error } = await supabase.from("user_byok_keys").delete().eq("user_id", userId);
  if (error) {
    console.error("BYOK delete error for user:", userId);
    return res.status(500).json({ error: "Failed to delete key" });
  }

  res.status(200).json({ ok: true });
}
