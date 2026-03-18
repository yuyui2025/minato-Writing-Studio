export type UserPlan = "free" | "pro" | "byok";

export const PLAN_LIMITS: Record<UserPlan, { dailyLimit: number; monthlyLimit: number }> = {
  free: { dailyLimit: 10, monthlyLimit: 100 },
  pro: { dailyLimit: 100, monthlyLimit: 2000 },
  byok: { dailyLimit: Infinity, monthlyLimit: Infinity },
};
