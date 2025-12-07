import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserDashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Use the secure RPC function that filters by auth.uid()
      const { data, error } = await supabase.rpc('get_user_ai_dashboard');
      
      if (error) {
        console.error('Error fetching dashboard:', error);
        return null;
      }

      // The function returns an array, get first row
      const dashboard = data?.[0];
      
      return {
        daily_summaries: dashboard?.daily_summaries || 0,
        tasks_generated: dashboard?.tasks_generated || 0,
        tokens_earned: dashboard?.tokens_earned || 0,
        focus_streak: dashboard?.focus_streak || 0,
      };
    },
  });

  return {
    dashboardData,
    isLoading,
    error,
  };
};