import { useCallback, useRef, useState } from 'react';
import { useVoiceTTS } from './useVoiceTTS';
import { useFocusProtection } from './useFocusProtection';
import {
  validateVoiceOutput,
  sanitizeVoiceOutput,
  formatRecommendation,
  formatConfirmation,
  formatReassurance,
  formatSilence,
  selectPrimaryAction,
  shouldBeSilent,
  type EyesFreeOutput,
  type VoiceOutputType,
  EYES_FREE_PHRASES,
} from '@/lib/eyesFreeMode';
import { BETA_VOICE, getSpokenError } from '@/lib/betaMessaging';

export interface UseEyesFreeVoiceReturn {
  // Core speak functions that enforce rules
  speakRecommendation: (action: string, uiContext?: string) => Promise<void>;
  speakConfirmation: (action: string) => Promise<void>;
  speakReassurance: (type?: keyof typeof EYES_FREE_PHRASES.reassurance) => Promise<void>;
  
  // Smart speak - validates and sanitizes before speaking
  speak: (text: string) => Promise<void>;
  
  // Choose and speak single action from multiple
  speakPrimaryAction: <T extends { id: string; label: string; priority?: number; urgency?: 'critical' | 'high' | 'medium' | 'low' }>(
    actions: T[],
    formatAction: (action: T) => string
  ) => Promise<{ spoken: T | null; alternatives: T[] }>;
  
  
  // Beta-friendly error handling (never blames user)
  speakError: (technicalError?: string) => Promise<void>;
  
  // Silent acknowledgment (UI only, no voice)
  acknowledgeSilently: (uiContext: string) => void;
  
  // State
  isSpeaking: boolean;
  isLoading: boolean;
  lastOutput: EyesFreeOutput | null;
  
  // Control
  stop: () => void;
}

/**
 * Hook that enforces Eyes-Free Mode rules for all voice output.
 * 
 * Rules enforced:
 * - Never presents multiple options via voice
 * - Never asks open-ended questions
 * - Always concludes with recommendation, confirmation, or reassurance
 * - Chooses ONE action when multiple exist
 * - Prefers silence over unnecessary speech
 */
export function useEyesFreeVoice(): UseEyesFreeVoiceReturn {
  const { speak: ttsSpeak, stop, isSpeaking, isLoading } = useVoiceTTS();
  const { isInFocus } = useFocusProtection();
  
  const [lastOutput, setLastOutput] = useState<EyesFreeOutput | null>(null);
  const lastSpokenRef = useRef<number>(0);

  /**
   * Core speak function that validates and sanitizes output
   */
  const speak = useCallback(async (text: string) => {
    // Check if we should be silent
    if (shouldBeSilent({
      hasUrgentItems: false,
      hasUserRequest: true, // If speak is called, assume user requested
      isInFocusMode: isInFocus,
      lastSpokenMs: lastSpokenRef.current,
    })) {
      console.log('[EyesFree] Suppressing speech - silence preferred');
      return;
    }

    // Validate the output
    const validation = validateVoiceOutput(text);
    
    let finalText = text;
    if (!validation.isValid) {
      console.warn('[EyesFree] Voice output violations:', validation.violations);
      // Attempt to sanitize
      finalText = sanitizeVoiceOutput(text);
      
      // Re-validate
      const revalidation = validateVoiceOutput(finalText);
      if (!revalidation.isValid) {
        console.error('[EyesFree] Could not sanitize voice output, falling back to silence');
        return;
      }
    }

    lastSpokenRef.current = Date.now();
    setLastOutput({
      type: 'recommendation',
      spokenText: finalText,
    });
    
    await ttsSpeak(finalText);
  }, [ttsSpeak, isInFocus]);

  /**
   * Speak a single recommendation
   */
  const speakRecommendation = useCallback(async (action: string, uiContext?: string) => {
    if (shouldBeSilent({
      hasUrgentItems: false,
      hasUserRequest: true,
      isInFocusMode: isInFocus,
      lastSpokenMs: lastSpokenRef.current,
    })) {
      setLastOutput(formatSilence(uiContext));
      return;
    }

    const output = formatRecommendation(action, uiContext);
    setLastOutput(output);
    
    if (output.spokenText) {
      lastSpokenRef.current = Date.now();
      await ttsSpeak(output.spokenText);
    }
  }, [ttsSpeak, isInFocus]);

  /**
   * Speak a confirmation
   */
  const speakConfirmation = useCallback(async (action: string) => {
    const output = formatConfirmation(action);
    setLastOutput(output);
    
    if (output.spokenText) {
      lastSpokenRef.current = Date.now();
      await ttsSpeak(output.spokenText);
    }
  }, [ttsSpeak]);

  /**
   * Speak a reassurance
   */
  const speakReassurance = useCallback(async (
    type: keyof typeof EYES_FREE_PHRASES.reassurance = 'nothingUrgent'
  ) => {
    const output = formatReassurance(type);
    setLastOutput(output);
    
    if (output.spokenText) {
      lastSpokenRef.current = Date.now();
      await ttsSpeak(output.spokenText);
    }
  }, [ttsSpeak]);

  /**
   * Select and speak the primary action from multiple options
   * UI can show alternatives, but voice only speaks one
   */
  const speakPrimaryAction = useCallback(async <T extends { 
    id: string; 
    label: string; 
    priority?: number; 
    urgency?: 'critical' | 'high' | 'medium' | 'low';
  }>(
    actions: T[],
    formatAction: (action: T) => string
  ): Promise<{ spoken: T | null; alternatives: T[] }> => {
    const { primary, alternatives } = selectPrimaryAction(actions);

    if (!primary) {
      // No actions - speak reassurance
      await speakReassurance('nothingUrgent');
      return { spoken: null, alternatives: [] };
    }

    const spokenText = formatAction(primary);
    
    setLastOutput({
      type: 'recommendation',
      spokenText,
      selectedAction: { id: primary.id, label: primary.label },
      alternativeActions: alternatives.map(a => ({ id: a.id, label: a.label })),
    });

    if (!shouldBeSilent({
      hasUrgentItems: primary.urgency === 'critical',
      hasUserRequest: true,
      isInFocusMode: isInFocus,
      lastSpokenMs: lastSpokenRef.current,
    })) {
      lastSpokenRef.current = Date.now();
      await ttsSpeak(spokenText);
    }

    return { spoken: primary, alternatives };
  }, [ttsSpeak, speakReassurance, isInFocus]);

  /**
   * Beta-friendly error speaking - never blames user, never says "failed"
   */
  const speakError = useCallback(async (technicalError?: string) => {
    const friendlyError = getSpokenError(technicalError);
    
    setLastOutput({
      type: 'reassurance',
      spokenText: friendlyError,
    });
    
    lastSpokenRef.current = Date.now();
    await ttsSpeak(friendlyError);
  }, [ttsSpeak]);

  /**
   * Silent acknowledgment - updates UI context without speaking
   */
  const acknowledgeSilently = useCallback((uiContext: string) => {
    setLastOutput(formatSilence(uiContext));
  }, []);

  return {
    speakRecommendation,
    speakConfirmation,
    speakReassurance,
    speak,
    speakPrimaryAction,
    speakError,
    acknowledgeSilently,
    isSpeaking,
    isLoading,
    lastOutput,
    stop,
  };
}
