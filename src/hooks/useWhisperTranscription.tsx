import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWhisperTranscriptionReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
  resetTranscript: () => void;
}

export const useWhisperTranscription = (): UseWhisperTranscriptionReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef(false);

  // Check if MediaRecorder is supported
  const isSupported = typeof window !== 'undefined' && 
    'MediaRecorder' in window && 
    'mediaDevices' in navigator;

  // Cleanup function for safe teardown
  const cleanup = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {
      // Ignore stop errors
    }
    mediaRecorderRef.current = null;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    
    audioChunksRef.current = [];
    setIsRecording(false);
  }, []);

  // Cancel recording without transcribing (for navigation/interruption)
  const cancelRecording = useCallback(() => {
    console.log('[Whisper] Recording cancelled');
    isCancelledRef.current = true;
    cleanup();
    setIsTranscribing(false);
    setError(null);
  }, [cleanup]);

  // Cleanup on unmount (navigation away)
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Cancel on visibility change (tab switch, navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRecording) {
        console.log('[Whisper] Page hidden, cancelling recording');
        cancelRecording();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRecording, cancelRecording]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording not supported');
      return;
    }

    // Prevent overlapping recordings
    if (isRecording || isTranscribing) {
      console.log('[Whisper] Already recording or transcribing, ignoring start');
      return;
    }

    try {
      isCancelledRef.current = false;
      setError(null);
      setTranscript('');
      audioChunksRef.current = [];

      // Request microphone access with timeout to prevent UI blocking
      const micPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });

      // 5 second timeout for microphone access
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Microphone access timeout')), 5000);
      });

      const stream = await Promise.race([micPromise, timeoutPromise]);
      
      // Check if cancelled while waiting for mic
      if (isCancelledRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      streamRef.current = stream;

      // Determine best available format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && !isCancelledRef.current) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        console.error('[Whisper] MediaRecorder error');
        cleanup();
        setError("Didn't catch that");
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('[Whisper] Recording started with format:', mimeType);

    } catch (err) {
      console.error('[Whisper] Failed to start recording:', err);
      cleanup();
      setError('Could not access microphone');
    }
  }, [isSupported, isRecording, isTranscribing, cleanup]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }

    // Check if already cancelled
    if (isCancelledRef.current) {
      cleanup();
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        
        // Check if cancelled during recording
        if (isCancelledRef.current) {
          resolve(null);
          return;
        }
        
        // Check if we have audio data
        if (audioChunksRef.current.length === 0) {
          console.log('[Whisper] No audio data captured');
          setError("Didn't catch that");
          resolve(null);
          return;
        }

        // Combine audio chunks
        const mimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('[Whisper] Audio blob size:', audioBlob.size, 'bytes');

        // Check minimum size (very short recordings may fail)
        if (audioBlob.size < 1000) {
          console.log('[Whisper] Audio too short');
          setError("Didn't catch that");
          resolve(null);
          return;
        }

        setIsTranscribing(true);

        try {
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            // Check if cancelled during transcription
            if (isCancelledRef.current) {
              setIsTranscribing(false);
              resolve(null);
              return;
            }

            const base64Audio = (reader.result as string).split(',')[1];
            
            console.log('[Whisper] Sending to transcription API...');
            
            // Send to edge function
            const { data, error: fnError } = await supabase.functions.invoke('speech-to-text', {
              body: { 
                audio: base64Audio,
                mimeType: mimeType 
              }
            });

            setIsTranscribing(false);

            // Check if cancelled while waiting for API
            if (isCancelledRef.current) {
              resolve(null);
              return;
            }

            if (fnError || data?.error) {
              console.error('[Whisper] Transcription error:', fnError || data?.error);
              setError("Didn't catch that");
              resolve(null);
              return;
            }

            const transcribedText = data?.text?.trim();
            
            if (!transcribedText) {
              console.log('[Whisper] Empty transcription result');
              setError("Didn't catch that");
              resolve(null);
              return;
            }

            console.log('[Whisper] Transcription result:', transcribedText);
            setTranscript(transcribedText);
            setError(null);
            resolve(transcribedText);
          };

          reader.onerror = () => {
            console.error('[Whisper] FileReader error');
            setIsTranscribing(false);
            setError("Didn't catch that");
            resolve(null);
          };

          reader.readAsDataURL(audioBlob);
          
        } catch (err) {
          console.error('[Whisper] Transcription failed:', err);
          setIsTranscribing(false);
          setError("Didn't catch that");
          resolve(null);
        }
      };

      mediaRecorder.stop();
    });
  }, [isRecording, cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    isSupported,
    transcript,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    resetTranscript,
  };
};
