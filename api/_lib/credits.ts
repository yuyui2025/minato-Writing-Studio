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

  // クレジット取得
  const { data: credits } = await supabase
    .from("user_credits")
    .select("daily_used, daily_limit, monthly_used, monthly_limit, daily_reset_at, monthly_reset_at")
    .eq("user_id", userId)
    .single();

  // 初回ユーザー: レコードがない場合は作成
  if (!credits) {
    await supabase.from("user_credits").insert({
      user_id: userId,
      daily_used: 1,
      daily_limit: limits.dailyLimit,
      monthly_used: 1,
      monthly_limit: limits.monthlyLimit,
      daily_reset_at: today,
      monthly_reset_at: thisMonth,
    });
    return;
  }

  // 遅延リセット方式: 日次・月次リセット
  let dailyUsed = credits.daily_used;
  let monthlyUsed = credits.monthly_used;

  if (credits.daily_reset_at < today) {
    dailyUsed = 0;
  }
  if (credits.monthly_reset_at < thisMonth) {
    monthlyUsed = 0;
  }

  // 上限チェック
  if (dailyUsed >= limits.dailyLimit) {
    throw Object.assign(new Error("1日のAI利用上限に達しました。BYOKモードへの切り替えをご検討ください。"), { status: 429 });
  }
  if (monthlyUsed >= limits.monthlyLimit) {
    throw Object.assign(new Error("今月のAI利用上限に達しました。BYOKモードへの切り替えをご検討ください。"), { status: 429 });
  }

  // カウントインクリメント
  await supabase.from("user_credits").update({
    daily_used: dailyUsed + 1,
    monthly_used: monthlyUsed + 1,
    daily_limit: limits.dailyLimit,
    monthly_limit: limits.monthlyLimit,
    daily_reset_at: today,
    monthly_reset_at: thisMonth,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
}
