import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { UserProfile } from "../types";
import { useStudio } from "../contexts/StudioContext";

export function useUserProfile() {
  const { user } = useStudio();

  const query = useQuery<UserProfile | null>({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_profiles")
        .select("plan")
        .eq("user_id", user.id)
        .single();
      if (!data) return { plan: "free" };
      return { plan: data.plan as UserProfile["plan"] };
    },
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  return query.data ?? null;
}
