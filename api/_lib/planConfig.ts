export type UserPlan = "free" | "pro" | "byok";

export const PLAN_LIMITS: Record<UserPlan, { dailyLimit: number; monthlyLimit: number }> = {
  free: {
    dailyLimit:   parseInt(process.env.PLAN_FREE_DAILY_LIMIT   ?? "10",   10),
    monthlyLimit: parseInt(process.env.PLAN_FREE_MONTHLY_LIMIT ?? "100",  10),
  },
  pro: {
    dailyLimit:   parseInt(process.env.PLAN_PRO_DAILY_LIMIT    ?? "100",  10),
    monthlyLimit: parseInt(process.env.PLAN_PRO_MONTHLY_LIMIT  ?? "2000", 10),
  },
  byok: { dailyLimit: Infinity, monthlyLimit: Infinity },
};
