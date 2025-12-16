import { useState, useCallback, useRef } from 'react';

interface UseVoiceTTSReturn {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export const useVoiceTTS = (): UseVoiceTTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (text: string) => {
    // Stop any current speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    setIsSpeaking(true);

    // Use browser Speech Synthesis (no API key needed)
    if ('speechSynthesis' in window) {
      return new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find a calm, professional voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.includes('Daniel') || 
          v.name.includes('Google UK English Male') ||
          v.name.includes('Microsoft Mark')
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    }
    
    setIsSpeaking(false);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
  };
};
