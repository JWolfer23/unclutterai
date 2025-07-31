import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AI_USAGE_LIMITS = {
  summary: 25,
  task_generation: 15,
  scoring: 15,
};

export const useAIUsage = () => {
  const { data: usage, isLoading, refetch } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get usage from last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from("ai_usage")
        .select("type")
        .eq("user_id", user.id)
        .gte("used_at", twentyFourHoursAgo.toISOString());

      if (error) throw error;

      // Count usage by type
      const usageCounts = {
        summary: data?.filter(item => item.type === 'summary').length || 0,
        task_generation: data?.filter(item => item.type === 'task_generation').length || 0,
        scoring: data?.filter(item => item.type === 'scoring').length || 0,
      };

      return usageCounts;
    },
  });

  const getUsageText = (type: keyof typeof AI_USAGE_LIMITS) => {
    if (!usage) return "Loading...";
    const used = usage[type];
    const limit = AI_USAGE_LIMITS[type];
    return `${used} / ${limit} used today`;
  };

  const isLimitReached = (type: keyof typeof AI_USAGE_LIMITS) => {
    if (!usage) return false;
    return usage[type] >= AI_USAGE_LIMITS[type];
  };

  return {
    usage,
    isLoading,
    refetch,
    getUsageText,
    isLimitReached,
  };
};