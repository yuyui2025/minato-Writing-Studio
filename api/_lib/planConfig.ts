export type UserPlan = "free" | "pro" | "byok";

const PG_INT4_MAX = 2_147_483_647;

function parsePlanLimit(envVar: string | undefined, defaultValue: number): number {
  if (envVar === undefined || envVar === "") return defaultValue;
  const parsed = parseInt(envVar, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return defaultValue;
  return Math.min(parsed, PG_INT4_MAX);
}

export const PLAN_LIMITS: Record<UserPlan, { dailyLimit: number; monthlyLimit: number }> = {
  free: {
    dailyLimit:   parsePlanLimit(process.env.PLAN_FREE_DAILY_LIMIT,    10),
    monthlyLimit: parsePlanLimit(process.env.PLAN_FREE_MONTHLY_LIMIT, 100),
  },
  pro: {
    dailyLimit:   parsePlanLimit(process.env.PLAN_PRO_DAILY_LIMIT,    100),
    monthlyLimit: parsePlanLimit(process.env.PLAN_PRO_MONTHLY_LIMIT, 2000),
  },
  byok: { dailyLimit: Infinity, monthlyLimit: Infinity },
};
