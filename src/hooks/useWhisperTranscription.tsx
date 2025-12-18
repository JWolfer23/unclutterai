import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWhisperTranscriptionReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
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

  // Check if MediaRecorder is supported
  const isSupported = typeof window !== 'undefined' && 
    'MediaRecorder' in window && 
    'mediaDevices' in navigator;

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording not supported');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });
      
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('[Whisper] Recording started with format:', mimeType);

    } catch (err) {
      console.error('[Whisper] Failed to start recording:', err);
      setError('Could not access microphone');
    }
  }, [isSupported]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
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
  }, [isRecording]);

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
    resetTranscript,
  };
};
