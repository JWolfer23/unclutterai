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

  // Get supported MIME type - prefer webm, fallback to mp4 for Safari/iOS
  const getSupportedMimeType = useCallback((): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/aac',
      'audio/mpeg',
      '' // Empty string = browser default
    ];
    
    for (const type of types) {
      if (type === '' || MediaRecorder.isTypeSupported(type)) {
        console.log('[Whisper] Using MIME type:', type || 'browser default');
        return type;
      }
    }
    return '';
  }, []);

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

      // Get best supported MIME type for this browser
      const mimeType = getSupportedMimeType();
      
      // Create MediaRecorder with explicit options
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('[Whisper] MediaRecorder created with mimeType:', mediaRecorder.mimeType);

      // Accumulate audio chunks
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        console.log('[Whisper] Data available, size:', event.data.size);
        if (event.data && event.data.size > 0 && !isCancelledRef.current) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[Whisper] MediaRecorder error:', event);
        cleanup();
        setError("Didn't catch that");
      };

      // Start recording - request data every 250ms for reliable chunk collection
      mediaRecorder.start(250);
      setIsRecording(true);
      console.log('[Whisper] Recording started, state:', mediaRecorder.state);

    } catch (err) {
      console.error('[Whisper] Failed to start recording:', err);
      cleanup();
      setError('Could not access microphone');
    }
  }, [isSupported, isRecording, isTranscribing, cleanup, getSupportedMimeType]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      console.log('[Whisper] Stop called but no active recording');
      return null;
    }

    // Check if already cancelled
    if (isCancelledRef.current) {
      cleanup();
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      // Request final data before stopping (important for Safari)
      if (mediaRecorder.state === 'recording') {
        try {
          mediaRecorder.requestData();
        } catch (e) {
          console.log('[Whisper] requestData not supported, continuing...');
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('[Whisper] MediaRecorder stopped, chunks collected:', audioChunksRef.current.length);
        
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
          console.log('[Whisper] No audio chunks captured');
          setError("Didn't catch that");
          resolve(null);
          return;
        }

        // Combine all audio chunks into a single Blob
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const blobSize = audioBlob.size;
        
        console.log('[Whisper] Final audio blob size:', blobSize, 'bytes, type:', mimeType);

        // Validate minimum size (10KB threshold as per requirements)
        if (blobSize < 10000) {
          console.log('[Whisper] Audio blob too small (<10KB), treating as invalid');
          setError("Didn't catch that");
          resolve(null);
          return;
        }

        setIsTranscribing(true);

        try {
          // Convert blob to base64
          const base64Audio = await new Promise<string>((resolveBase64, rejectBase64) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                const base64 = reader.result.split(',')[1];
                resolveBase64(base64);
              } else {
                rejectBase64(new Error('FileReader result is not a string'));
              }
            };
            reader.onerror = () => rejectBase64(reader.error);
            reader.readAsDataURL(audioBlob);
          });

          // Check if cancelled during transcription
          if (isCancelledRef.current) {
            setIsTranscribing(false);
            resolve(null);
            return;
          }

          console.log('[Whisper] Sending to transcription API, base64 length:', base64Audio.length);
          
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
