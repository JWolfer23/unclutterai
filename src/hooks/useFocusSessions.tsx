import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { useTokens } from "./useTokens";
import { useFocusStreaks } from "./useFocusStreaks";

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];
type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert'];

export const useFocusSessions = () => {
  const queryClient = useQueryClient();
  const { awardFocusTokens } = useTokens();
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
      return data;
    },
  });

  // Start a new focus session
  const startSession = useMutation({
    mutationFn: async (plannedMinutes: number) => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          start_time: new Date().toISOString(),
          planned_minutes: plannedMinutes,
          interruptions: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      toast({
        title: "🎯 Focus Session Started",
        description: `${data.planned_minutes} minute session is now active`,
      });
    },
  });

  // End a focus session
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      
      // Award tokens for focus time
      if (data.actual_minutes) {
        awardFocusTokens(data.actual_minutes);
      }
      
      // Update streak
      updateStreak();
      
      toast({
        title: "✅ Focus Session Complete",
        description: `Score: ${data.focus_score}% • Earned tokens for ${data.actual_minutes} minutes`,
      });
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
      return data;
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
    endSession: endSession.mutate,
    addInterruption: addInterruption.mutate,
    isStarting: startSession.isPending,
    isEnding: endSession.isPending,
  };
};