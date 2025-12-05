import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DailyStats {
  minutes: number;
  uct: number;
  sessions: number;
}

export const useFocusStats = () => {
  // Total focus minutes today
  const { data: todayMinutes = 0, isLoading: isLoadingToday } = useQuery({
    queryKey: ['focus_stats', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('actual_minutes')
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`);
      
      if (error) throw error;
      return data?.reduce((sum, s) => sum + (s.actual_minutes || 0), 0) || 0;
    },
  });

  // Total focus minutes this week
  const { data: weekMinutes = 0, isLoading: isLoadingWeek } = useQuery({
    queryKey: ['focus_stats', 'week'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('actual_minutes')
        .gte('start_time', weekAgo);
      
      if (error) throw error;
      return data?.reduce((sum, s) => sum + (s.actual_minutes || 0), 0) || 0;
    },
  });

  // Total UCT earned this week
  const { data: weekUCT = 0, isLoading: isLoadingWeekUCT } = useQuery({
    queryKey: ['focus_stats', 'week_uct'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('uct_reward')
        .gte('start_time', weekAgo);
      
      if (error) throw error;
      return data?.reduce((sum, s) => sum + (Number(s.uct_reward) || 0), 0) || 0;
    },
  });

  // Total UCT earned this month
  const { data: monthUCT = 0, isLoading: isLoadingMonthUCT } = useQuery({
    queryKey: ['focus_stats', 'month_uct'],
    queryFn: async () => {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('uct_reward')
        .gte('start_time', monthAgo);
      
      if (error) throw error;
      return data?.reduce((sum, s) => sum + (Number(s.uct_reward) || 0), 0) || 0;
    },
  });

  // Last 7 sessions for history
  const { data: recentSessions = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ['focus_stats', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(7);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Sessions grouped by day (for charts)
  const { data: dailySessions = {}, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['focus_stats', 'daily'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('start_time, actual_minutes, uct_reward')
        .gte('start_time', weekAgo)
        .order('start_time');
      
      if (error) throw error;
      
      // Group by day
      const grouped = data?.reduce((acc, session) => {
        const day = session.start_time.split('T')[0];
        if (!acc[day]) {
          acc[day] = { minutes: 0, uct: 0, sessions: 0 };
        }
        acc[day].minutes += session.actual_minutes || 0;
        acc[day].uct += Number(session.uct_reward) || 0;
        acc[day].sessions += 1;
        return acc;
      }, {} as Record<string, DailyStats>);
      
      return grouped || {};
    },
  });

  // Completed sessions count
  const { data: completedCount = 0 } = useQuery({
    queryKey: ['focus_stats', 'completed'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  return {
    todayMinutes,
    weekMinutes,
    weekUCT,
    monthUCT,
    recentSessions,
    dailySessions,
    completedCount,
    isLoading: isLoadingToday || isLoadingWeek || isLoadingWeekUCT || isLoadingMonthUCT || isLoadingRecent || isLoadingDaily,
  };
};
