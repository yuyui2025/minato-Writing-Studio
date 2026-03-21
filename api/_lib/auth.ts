import { createClient } from "@supabase/supabase-js";

let _adminClient: ReturnType<typeof createClient> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    // Service role key for admin ops; anon key is sufficient for auth.getUser() JWT verification
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      ?? process.env.SUPABASE_ANON_KEY
      ?? process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw Object.assign(new Error("Missing Supabase env vars"), { status: 401 });
    _adminClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return _adminClient;
}

export async function verifyToken(authHeader: string | undefined): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const token = authHeader.slice(7);
  const { data, error } = await getAdminClient().auth.getUser(token);
  if (error || !data.user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return data.user.id;
}
