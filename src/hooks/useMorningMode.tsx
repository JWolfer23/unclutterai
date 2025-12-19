import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const MORNING_MODE_COMPLETED_KEY = 'morning_mode_completed_date';
const MAX_PRIORITIES = 3;

export interface MorningPriority {
  id: string;
  title: string;
  reason: string;
  source: 'task' | 'email' | 'calendar';
}

export interface MorningModeState {
  isActive: boolean;
  wasCompletedToday: boolean;
  focusStreak: number;
  priorities: MorningPriority[];
  isLoading: boolean;
}

// Get today's date as string for comparison
const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Check if morning mode was completed today
const wasCompletedToday = (): boolean => {
  try {
    const completedDate = localStorage.getItem(MORNING_MODE_COMPLETED_KEY);
    return completedDate === getTodayKey();
  } catch {
    return false;
  }
};

// Mark morning mode as completed for today
const markCompleted = (): void => {
  try {
    localStorage.setItem(MORNING_MODE_COMPLETED_KEY, getTodayKey());
  } catch {
    console.warn('[MorningMode] Failed to persist completion state');
  }
};

export function useMorningMode() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

  // Fetch focus streak
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['morning-mode-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return { current_streak: 0 };
      
      const { data, error } = await supabase
        .from('focus_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // No streak record yet
        if (error.code === 'PGRST116') {
          return { current_streak: 0 };
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch top priorities (max 3)
  const { data: prioritiesData, isLoading: prioritiesLoading } = useQuery({
    queryKey: ['morning-mode-priorities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get top 3 high-priority tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, priority, urgency, importance')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(MAX_PRIORITIES);
      
      if (tasksError) {
        console.error('[MorningMode] Failed to fetch tasks:', tasksError);
        return [];
      }

      // Map to MorningPriority format
      const priorities: MorningPriority[] = (tasks || []).map((task) => ({
        id: task.id,
        title: task.title,
        reason: task.urgency === 'high' 
          ? 'Time-sensitive' 
          : task.importance === 'high' 
            ? 'High impact' 
            : 'Scheduled',
        source: 'task' as const,
      }));

      return priorities.slice(0, MAX_PRIORITIES);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Check on first app open if morning mode should trigger
  useEffect(() => {
    if (!user || hasCheckedToday) return;

    // Only check once per session
    setHasCheckedToday(true);

    // Check if already completed today
    if (wasCompletedToday()) {
      setIsActive(false);
      return;
    }

    // Auto-trigger on first open of the day
    setIsActive(true);
  }, [user, hasCheckedToday]);

  // Complete morning mode
  const completeMorningMode = useCallback(() => {
    markCompleted();
    setIsActive(false);
  }, []);

  // Dismiss without completing (user can re-trigger)
  const dismissMorningMode = useCallback(() => {
    setIsActive(false);
  }, []);

  // Force show morning mode (for manual trigger)
  const showMorningMode = useCallback(() => {
    if (!wasCompletedToday()) {
      setIsActive(true);
    }
  }, []);

  // Reset for testing (clears today's completion)
  const resetForToday = useCallback(() => {
    try {
      localStorage.removeItem(MORNING_MODE_COMPLETED_KEY);
      setHasCheckedToday(false);
    } catch {
      // Ignore
    }
  }, []);

  const isLoading = streakLoading || prioritiesLoading;
  const focusStreak = streakData?.current_streak || 0;
  const priorities = prioritiesData || [];

  return {
    // State
    isActive,
    wasCompletedToday: wasCompletedToday(),
    focusStreak,
    priorities,
    isLoading,
    
    // Actions
    completeMorningMode,
    dismissMorningMode,
    showMorningMode,
    resetForToday,
  };
}
