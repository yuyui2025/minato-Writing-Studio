import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS, type UserPlan } from "./planConfig";

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

export async function checkAndConsumeCredit(userId: string): Promise<void> {
  const supabase = getAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7) + "-01";

  // プラン取得
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const plan: UserPlan = (profile?.plan as UserPlan) ?? "free";
  const limits = PLAN_LIMITS[plan];

  // byok プランはクレジット不要
  if (plan === "byok") return;

  // アトミックな上限チェック＋インクリメント（race condition 排除）
  const { data: result, error } = await supabase.rpc("check_and_consume_credit", {
    p_user_id: userId,
    p_daily_limit: limits.dailyLimit,
    p_monthly_limit: limits.monthlyLimit,
    p_today: today,
    p_this_month: thisMonth,
  });

  if (error) {
    // DBエラー（マイグレーション未適用など）はサービス継続優先でスルー
    console.warn("Credit check skipped:", error.message);
    return;
  }

  if (result === "daily_limit") {
    throw Object.assign(new Error("1日のAI利用上限に達しました。BYOKモードへの切り替えをご検討ください。"), { status: 429 });
  }
  if (result === "monthly_limit") {
    throw Object.assign(new Error("今月のAI利用上限に達しました。BYOKモードへの切り替えをご検討ください。"), { status: 429 });
  }
}
