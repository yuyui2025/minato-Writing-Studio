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
  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = getAdminClient();
  } catch {
    // Service role key not configured — skip rate limiting
    console.warn("Rate limit check skipped: admin client unavailable");
    return;
  }
  const windowStart = new Date();
  windowStart.setSeconds(0, 0);
  windowStart.setMinutes(Math.floor(windowStart.getMinutes() / WINDOW_MINUTES) * WINDOW_MINUTES);
  const windowKey = windowStart.toISOString();

  // アトミックなインクリメント＋取得（race condition 対策）
  // INSERT ... ON CONFLICT DO UPDATE により、チェックとインクリメントを1回のDB操作で実施
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("increment_rate_limit", {
    p_user_id: userId,
    p_ip_address: ipAddress,
    p_window_start: windowKey,
  });

  if (error) {
    // DBエラー（マイグレーション未適用など）はサービス継続優先でスルー
    console.warn("Rate limit check skipped:", error.message);
    return;
  }

  if ((data as number) > MAX_REQUESTS) {
    throw Object.assign(new Error("Rate limit exceeded"), { status: 429 });
  }
}
