import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useFocusStreaks } from "./useFocusStreaks";
import { useFocusRewards } from "./useFocusRewards";
import { useOnboardingMissions } from "./useOnboardingMissions";

interface FocusSession {
  id: string;
  user_id: string | null;
  start_time: string;
  end_time: string | null;
  planned_minutes: number;
  actual_minutes: number | null;
  interruptions: number | null;
  focus_score: number | null;
  mode: string | null;
  goal: string | null;
  notes: string | null;
  uct_reward: number | null;
  is_completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useFocusSessions = () => {
  const queryClient = useQueryClient();
  const { updateStreak } = useFocusStreaks();
  const { completeSessionWithRewardsAsync } = useFocusRewards();
  const { checkAndCompleteMission } = useOnboardingMissions();

  // Fetch user's focus sessions
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['focus_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as FocusSession[];
    },
  });

  // Start a new focus session with mode and goal
  const startSession = useMutation({
    mutationFn: async ({ 
      plannedMinutes, 
      mode, 
      goal 
    }: { 
      plannedMinutes: number; 
      mode: string; 
      goal: string; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          planned_minutes: plannedMinutes,
          mode,
          goal,
          interruptions: 0,
          uct_reward: 0,
          is_completed: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      toast({
        title: "🎯 Focus Session Started",
        description: `${data.planned_minutes} minute session is now active`,
      });
      // Trigger first focus mission completion
      checkAndCompleteMission('first_focus');
    },
  });

  // Complete a focus session (Task Completed) - awards tokens with full reward engine
  const completeSession = useMutation({
    mutationFn: async ({ 
      sessionId, 
      actualMinutes,
      interruptions = 0,
    }: { 
      sessionId: string; 
      actualMinutes: number;
      interruptions?: number;
    }) => {
      // Get the session's mode
      const session = sessions.find(s => s.id === sessionId);
      const mode = session?.mode || 'focus';

      // Use the new reward engine which handles:
      // - Tiered reward calculation
      // - Streak updates
      // - Wallet updates
      // - Reward history recording
      const result = await completeSessionWithRewardsAsync({
        sessionId,
        actualMinutes,
        mode,
        interruptions,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus_stats'] });
      queryClient.invalidateQueries({ queryKey: ['focus_analytics'] });
      // Toast is already shown by the reward engine
    },
    onError: (error) => {
      console.error('Failed to complete session:', error);
      toast({
        title: "Error completing session",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Break/interrupt a session (no reward)
  const breakSession = useMutation({
    mutationFn: async ({ 
      sessionId, 
      actualMinutes,
      interruptions = 0,
    }: { 
      sessionId: string; 
      actualMinutes: number;
      interruptions?: number;
    }) => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          end_time: new Date().toISOString(),
          actual_minutes: actualMinutes,
          interruptions,
          uct_reward: 0,
          is_completed: false,
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus_stats'] });
      toast({
        title: "Session Ended",
        description: "No UCT reward for interrupted session.",
      });
    },
  });

  // Save notes to an existing session
  const saveSessionNotes = useMutation({
    mutationFn: async ({ 
      sessionId, 
      notes 
    }: { 
      sessionId: string; 
      notes: string; 
    }) => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({ notes })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
    },
  });

  // Legacy endSession for backward compatibility
  const endSession = useMutation({
    mutationFn: async ({ 
      sessionId, 
      actualMinutes, 
      interruptions = 0 
    }: { 
      sessionId: string; 
      actualMinutes: number; 
      interruptions?: number; 
    }) => {
      const plannedMinutes = sessions.find(s => s.id === sessionId)?.planned_minutes || actualMinutes;
      const focusScore = Math.max(
        Math.min((actualMinutes / plannedMinutes) * 100, 100) - (interruptions * 5),
        0
      );

      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          end_time: new Date().toISOString(),
          actual_minutes: actualMinutes,
          interruptions,
          focus_score: Math.round(focusScore),
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
    },
  });

  // Add interruption to current session
  const addInterruption = useMutation({
    mutationFn: async (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          interruptions: (session.interruptions || 0) + 1,
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
    },
  });

  // Calculate focus score for display
  const calculateFocusScore = () => {
    const recentSessions = sessions.slice(0, 5);
    if (recentSessions.length === 0) return 0;
    
    const averageScore = recentSessions.reduce((sum, session) => {
      return sum + (session.focus_score || 0);
    }, 0) / recentSessions.length;
    
    return Math.round(averageScore);
  };

  // Get active session
  const activeSession = sessions.find(s => !s.end_time);

  return {
    sessions,
    activeSession,
    focusScore: calculateFocusScore(),
    isLoading,
    error,
    startSession: startSession.mutate,
    completeSession: completeSession,
    breakSession: breakSession.mutate,
    saveSessionNotes: saveSessionNotes.mutate,
    endSession: endSession.mutate,
    addInterruption: addInterruption.mutate,
    isStarting: startSession.isPending,
    isEnding: endSession.isPending,
    isCompleting: completeSession.isPending,
  };
};
