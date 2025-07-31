import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserDashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get data from various tables to build dashboard summary
      const today = new Date().toDateString();
      
      // Get daily AI usage count
      const { data: aiUsage } = await supabase
        .from("ai_usage")
        .select("*")
        .eq("user_id", user.id)
        .gte("used_at", new Date(today).toISOString());

      // Get tasks count  
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      // Get token balance
      const { data: tokens } = await supabase
        .from("tokens")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      // Get focus streak
      const { data: streak } = await supabase
        .from("focus_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      return {
        daily_summaries: aiUsage?.filter(usage => usage.type === 'summary').length || 0,
        tasks_generated: tasks?.length || 0,
        tokens_earned: tokens?.balance || 0,
        focus_streak: streak?.current_streak || 0,
      };
    },
  });

  return {
    dashboardData,
    isLoading,
    error,
  };
};