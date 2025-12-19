import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceTTSReturn {
  isSpeaking: boolean;
  isLoading: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export const useVoiceTTS = (): UseVoiceTTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    // Abort any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop and cleanup audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
      } catch {
        // Ignore cleanup errors
      }
      audioRef.current = null;
    }
    
    // Revoke object URL
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch {
        // Ignore revoke errors
      }
      objectUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount (navigation away)
  useEffect(() => {
    return () => {
      cleanup();
      setIsSpeaking(false);
      setIsLoading(false);
    };
  }, [cleanup]);

  // Cancel playback on visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && (isSpeaking || isLoading)) {
        console.log('[TTS] Page hidden, stopping playback');
        cleanup();
        setIsSpeaking(false);
        setIsLoading(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSpeaking, isLoading, cleanup]);

  const speak = useCallback(async (text: string) => {
    // Stop any current speech first - prevents overlapping
    cleanup();
    setIsSpeaking(false);
    
    if (!text.trim()) return;

    setIsLoading(true);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Call the text-to-speech edge function with timeout
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
          signal: abortControllerRef.current.signal,
        }
      );

      // Check if aborted while waiting
      if (abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      // Get audio as blob
      const audioBlob = await response.blob();
      
      // Check if aborted while getting blob
      if (abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
        return;
      }
      
      // Check if we got valid audio data
      if (audioBlob.size === 0) {
        throw new Error('Empty audio response');
      }

      // Create object URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      objectUrlRef.current = audioUrl;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        cleanup();
      };

      audio.onerror = () => {
        console.error('[TTS] Audio playback error');
        setIsSpeaking(false);
        cleanup();
      };

      setIsLoading(false);
      setIsSpeaking(true);
      await audio.play();
    } catch (error) {
      // Don't log abort errors as they're intentional
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[TTS] Error:', error);
      }
      setIsLoading(false);
      setIsSpeaking(false);
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanup]);

  return {
    isSpeaking,
    isLoading,
    speak,
    stop,
  };
};
