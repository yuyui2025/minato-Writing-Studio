import { createClient } from "@supabase/supabase-js";

// 1分あたり最大20リクエスト（user_id + IP 単位）
const WINDOW_MINUTES = 1;
const MAX_REQUESTS = 20;

let _adminClient: ReturnType<typeof createClient> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    _adminClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return _adminClient;
}

export async function checkRateLimit(userId: string, ipAddress: string): Promise<void> {
  const supabase = getAdminClient();
  const windowStart = new Date();
  windowStart.setSeconds(0, 0);
  windowStart.setMinutes(Math.floor(windowStart.getMinutes() / WINDOW_MINUTES) * WINDOW_MINUTES);
  const windowKey = windowStart.toISOString();

  const { data, error } = await supabase
    .from("api_rate_limits")
    .select("request_count")
    .eq("user_id", userId)
    .eq("ip_address", ipAddress)
    .eq("window_start", windowKey)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found。それ以外は無視してリクエストを通す
    return;
  }

  const count = data?.request_count ?? 0;
  if (count >= MAX_REQUESTS) {
    throw Object.assign(new Error("Rate limit exceeded"), { status: 429 });
  }

  // カウントインクリメント（upsert）
  await supabase.from("api_rate_limits").upsert(
    { user_id: userId, ip_address: ipAddress, window_start: windowKey, request_count: count + 1 },
    { onConflict: "user_id,ip_address,window_start" }
  );
}
