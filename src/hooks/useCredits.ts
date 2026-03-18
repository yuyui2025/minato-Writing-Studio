import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { UserCredits } from "../types";
import { useStudio } from "../contexts/StudioContext";

export function useCredits() {
  const { user } = useStudio();

  const query = useQuery<UserCredits | null>({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_credits")
        .select("daily_used, daily_limit, monthly_used, monthly_limit")
        .eq("user_id", user.id)
        .single();
      if (!data) return null;
      return {
        dailyUsed: data.daily_used,
        dailyLimit: data.daily_limit,
        monthlyUsed: data.monthly_used,
        monthlyLimit: data.monthly_limit,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  return query.data ?? null;
}
