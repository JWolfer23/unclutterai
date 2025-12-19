import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { 
  ONBOARDING_MISSIONS, 
  type MissionId, 
  type Mission,
} from '@/lib/onboardingMissions';

interface MissionProgress {
  id: string;
  mission_id: MissionId;
  completed_at: string | null;
  uct_awarded: number;
}

interface UseOnboardingMissionsReturn {
  missions: Array<Mission & { completed: boolean; completedAt: string | null }>;
  completedCount: number;
  totalCount: number;
  totalUctEarned: number;
  totalUctAvailable: number;
  isLoading: boolean;
  completeMission: (missionId: MissionId) => Promise<boolean>;
  isCompleting: boolean;
  checkAndCompleteMission: (missionId: MissionId) => Promise<void>;
}

export function useOnboardingMissions(): UseOnboardingMissionsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch mission progress
  const { data: progress = [], isLoading } = useQuery({
    queryKey: ['onboarding-missions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('onboarding_missions')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as MissionProgress[];
    },
    enabled: !!user?.id,
  });

  // Complete mission mutation
  const completeMutation = useMutation({
    mutationFn: async (missionId: MissionId) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const mission = ONBOARDING_MISSIONS.find(m => m.id === missionId);
      if (!mission) throw new Error('Invalid mission');
      
      // Call the database function to complete mission and award UCT
      const { data, error } = await supabase.rpc('complete_onboarding_mission', {
        p_user_id: user.id,
        p_mission_id: missionId,
        p_uct_reward: mission.reward,
      });
      
      if (error) throw error;
      return data as { success: boolean; uct_awarded?: number; reason?: string };
    },
    onSuccess: (result, missionId) => {
      if (result.success) {
        const mission = ONBOARDING_MISSIONS.find(m => m.id === missionId);
        toast({
          title: 'Mission Complete',
          description: `+${result.uct_awarded} UCT earned for "${mission?.title}"`,
        });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['onboarding-missions'] });
        queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      }
    },
    onError: (error) => {
      console.error('Failed to complete mission:', error);
    },
  });

  // Check if mission is already completed
  const isMissionCompleted = useCallback((missionId: MissionId): boolean => {
    return progress.some(p => p.mission_id === missionId && p.completed_at);
  }, [progress]);

  // Complete a mission (if not already done)
  const completeMission = useCallback(async (missionId: MissionId): Promise<boolean> => {
    if (isMissionCompleted(missionId)) {
      return false;
    }
    
    try {
      const result = await completeMutation.mutateAsync(missionId);
      return result.success;
    } catch {
      return false;
    }
  }, [completeMutation, isMissionCompleted]);

  // Check and complete a mission (for use by other hooks)
  const checkAndCompleteMission = useCallback(async (missionId: MissionId): Promise<void> => {
    if (!isMissionCompleted(missionId)) {
      await completeMission(missionId);
    }
  }, [completeMission, isMissionCompleted]);

  // Build missions with completion status
  const missions = ONBOARDING_MISSIONS.map(mission => {
    const progressEntry = progress.find(p => p.mission_id === mission.id);
    return {
      ...mission,
      completed: !!progressEntry?.completed_at,
      completedAt: progressEntry?.completed_at || null,
    };
  });

  const completedCount = missions.filter(m => m.completed).length;
  const totalUctEarned = progress.reduce((sum, p) => sum + (p.uct_awarded || 0), 0);
  const totalUctAvailable = ONBOARDING_MISSIONS.reduce((sum, m) => sum + m.reward, 0);

  return {
    missions,
    completedCount,
    totalCount: ONBOARDING_MISSIONS.length,
    totalUctEarned,
    totalUctAvailable,
    isLoading,
    completeMission,
    isCompleting: completeMutation.isPending,
    checkAndCompleteMission,
  };
}
