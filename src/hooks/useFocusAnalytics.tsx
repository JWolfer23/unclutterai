import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailyFocusData {
  day: string;
  total_minutes: number;
}

export interface ModeUsageData {
  mode: string;
  session_count: number;
  total_minutes: number;
}

export interface WeeklyTierData {
  tier: string;
  bonus_percent: number;
  sessions_count: number;
}

export const useFocusAnalytics = () => {
  // Get focus minutes today
  const { data: todayMinutes, isLoading: isLoadingToday } = useQuery({
    queryKey: ['focus_analytics', 'today_minutes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_focus_minutes_today', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return data || 0;
    },
  });

  // Get focus minutes this week
  const { data: weeklyMinutes, isLoading: isLoadingWeek } = useQuery({
    queryKey: ['focus_analytics', 'weekly_minutes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_focus_minutes_week', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return data || 0;
    },
  });

  // Get UCT earned this week
  const { data: weeklyUCT, isLoading: isLoadingWeeklyUCT } = useQuery({
    queryKey: ['focus_analytics', 'weekly_uct'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_uct_earned_week', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return Number(data) || 0;
    },
  });

  // Get UCT earned this month
  const { data: monthlyUCT, isLoading: isLoadingMonthlyUCT } = useQuery({
    queryKey: ['focus_analytics', 'monthly_uct'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_uct_earned_month', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return Number(data) || 0;
    },
  });

  // Get lifetime UCT earned
  const { data: lifetimeUCT, isLoading: isLoadingLifetimeUCT } = useQuery({
    queryKey: ['focus_analytics', 'lifetime_uct'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_lifetime_uct', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return Number(data) || 0;
    },
  });

  // Get sessions this week count
  const { data: sessionsThisWeek, isLoading: isLoadingSessionsWeek } = useQuery({
    queryKey: ['focus_analytics', 'sessions_this_week'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_sessions_this_week', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return data || 0;
    },
  });

  // Get focus minutes by day (last 30 days)
  const { data: dailyMinutes, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['focus_analytics', 'daily_minutes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_focus_minutes_by_day', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return (data || []) as DailyFocusData[];
    },
  });

  // Get mode usage breakdown
  const { data: modeBreakdown, isLoading: isLoadingModes } = useQuery({
    queryKey: ['focus_analytics', 'mode_breakdown'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_mode_usage_breakdown', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return (data || []) as ModeUsageData[];
    },
  });

  // Get weekly tier info
  const { data: weeklyTier, isLoading: isLoadingTier } = useQuery({
    queryKey: ['focus_analytics', 'weekly_tier'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { tier: 'none', bonus_percent: 0, sessions_count: 0 };

      const { data, error } = await supabase.rpc('get_weekly_tier', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      return (data?.[0] || { tier: 'none', bonus_percent: 0, sessions_count: 0 }) as WeeklyTierData;
    },
  });

  // Get last 10 sessions
  const { data: recentSessions, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['focus_analytics', 'recent_sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get total completed sessions count
  const { data: totalSessions, isLoading: isLoadingTotal } = useQuery({
    queryKey: ['focus_analytics', 'total_sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const isLoading = 
    isLoadingToday || 
    isLoadingWeek || 
    isLoadingWeeklyUCT || 
    isLoadingMonthlyUCT ||
    isLoadingLifetimeUCT ||
    isLoadingSessionsWeek ||
    isLoadingDaily || 
    isLoadingModes || 
    isLoadingTier ||
    isLoadingRecent ||
    isLoadingTotal;

  return {
    // Time metrics
    todayMinutes: todayMinutes || 0,
    weeklyMinutes: weeklyMinutes || 0,
    
    // UCT metrics
    weeklyUCT: weeklyUCT || 0,
    monthlyUCT: monthlyUCT || 0,
    lifetimeUCT: lifetimeUCT || 0,
    
    // Session metrics
    sessionsThisWeek: sessionsThisWeek || 0,
    totalSessions: totalSessions || 0,
    recentSessions: recentSessions || [],
    
    // Analytics data
    dailyMinutes: dailyMinutes || [],
    modeBreakdown: modeBreakdown || [],
    weeklyTier: weeklyTier || { tier: 'none', bonus_percent: 0, sessions_count: 0 },
    
    // Loading state
    isLoading,
  };
};
