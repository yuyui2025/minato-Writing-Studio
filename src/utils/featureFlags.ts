export const featureFlags = {
  byokLocal: import.meta.env.VITE_ENABLE_BYOK_LOCAL === "true",
  byokCloud: import.meta.env.VITE_ENABLE_BYOK_CLOUD === "true",
} as const;
