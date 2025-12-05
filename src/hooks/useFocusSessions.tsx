import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useFocusStreaks } from "./useFocusStreaks";

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
    },
  });

  // Complete a focus session (Task Completed) - awards tokens
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
      // Calculate UCT reward: duration_minutes * 0.1
      const uctReward = Math.round(actualMinutes * 0.1 * 100) / 100;
      
      // Calculate focus score
      const session = sessions.find(s => s.id === sessionId);
      const plannedMinutes = session?.planned_minutes || actualMinutes;
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
          uct_reward: uctReward,
          is_completed: true,
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return { session: data as FocusSession, uctReward };
    },
    onSuccess: async ({ session, uctReward }) => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus_stats'] });
      
      // Award tokens to wallet
      if (uctReward > 0) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Get current balance
            const { data: tokenData } = await supabase
              .from('tokens')
              .select('balance')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (tokenData) {
              // Update existing balance
              const newBalance = (tokenData.balance || 0) + uctReward;
              await supabase
                .from('tokens')
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
            } else {
              // Create new wallet
              await supabase
                .from('tokens')
                .insert({ user_id: user.id, balance: uctReward });
            }
            queryClient.invalidateQueries({ queryKey: ['tokens'] });
          }
        } catch (e) {
          console.error('Error awarding tokens:', e);
        }
      }
      
      // Update streak
      updateStreak();
      
      toast({
        title: "✅ Focus Session Complete",
        description: `Score: ${session.focus_score}% • Earned ${uctReward} UCT tokens`,
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
    completeSession: completeSession.mutate,
    breakSession: breakSession.mutate,
    saveSessionNotes: saveSessionNotes.mutate,
    endSession: endSession.mutate,
    addInterruption: addInterruption.mutate,
    isStarting: startSession.isPending,
    isEnding: endSession.isPending,
    isCompleting: completeSession.isPending,
  };
};
