import { useEffect, useCallback, useRef } from 'react';
import { useOnboardingMissions } from './useOnboardingMissions';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { MissionId } from '@/lib/onboardingMissions';

/**
 * Hook that monitors app events and triggers mission completion
 * 
 * Integrates with:
 * - Assistant profile setup
 * - Gmail connection
 * - Unclutter session completion
 * - Focus session start
 */
export function useMissionTriggers() {
  const { user } = useAuth();
  const { checkAndCompleteMission, missions } = useOnboardingMissions();
  const hasCheckedInitial = useRef(false);

  // Check mission status on mount
  const checkInitialMissions = useCallback(async () => {
    if (!user?.id || hasCheckedInitial.current) return;
    hasCheckedInitial.current = true;

    // Check if assistant profile exists (assistant_setup mission)
    const { data: profileData } = await supabase
      .from('assistant_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileData) {
      await checkAndCompleteMission('assistant_setup');
    }

    // Check if Gmail is connected (connect_gmail mission)
    const { data: credentialData } = await supabase
      .from('email_credentials')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .maybeSingle();
    
    if (credentialData) {
      await checkAndCompleteMission('connect_gmail');
    }

    // Check if any unclutter session was completed (first_unclutter mission)
    const { data: unclutterData } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', user.id)
      .not('metadata->unclutter_outcome', 'is', null)
      .limit(1);
    
    if (unclutterData && unclutterData.length > 0) {
      await checkAndCompleteMission('first_unclutter');
    }

    // Check if any focus session exists (first_focus mission)
    const { data: focusData } = await supabase
      .from('focus_sessions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (focusData && focusData.length > 0) {
      await checkAndCompleteMission('first_focus');
    }
  }, [user?.id, checkAndCompleteMission]);

  // Run initial check on mount
  useEffect(() => {
    checkInitialMissions();
  }, [checkInitialMissions]);

  // Trigger functions to be called by other hooks/components
  const triggerAssistantSetup = useCallback(async () => {
    await checkAndCompleteMission('assistant_setup');
  }, [checkAndCompleteMission]);

  const triggerGmailConnected = useCallback(async () => {
    await checkAndCompleteMission('connect_gmail');
  }, [checkAndCompleteMission]);

  const triggerFirstUnclutter = useCallback(async () => {
    await checkAndCompleteMission('first_unclutter');
  }, [checkAndCompleteMission]);

  const triggerFirstFocus = useCallback(async () => {
    await checkAndCompleteMission('first_focus');
  }, [checkAndCompleteMission]);

  return {
    triggerAssistantSetup,
    triggerGmailConnected,
    triggerFirstUnclutter,
    triggerFirstFocus,
    missions,
  };
}
