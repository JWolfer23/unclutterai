import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWhisperTranscription } from './useWhisperTranscription';
import { useVoiceTTS } from './useVoiceTTS';
import { useMessages } from './useMessages';
import { useTasks } from './useTasks';
import { useNavigate } from 'react-router-dom';
import { 
  ParsedCommand, 
  CommandResult, 
  RESPONSE_TEMPLATES,
  SUGGESTION_RESPONSE,
} from '@/lib/voiceCommands';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';

interface ConfirmationState {
  command: ParsedCommand;
  message: string;
}

interface UseVoiceCommandReturn {
  status: VoiceStatus;
  transcript: string;
  lastResponse: string;
  transcriptionError: string | null;
  confirmation: ConfirmationState | null;
  isSupported: boolean;
  audioLevel: number;
  hasAudioInput: boolean;
  startListening: () => void;
  stopListening: () => void;
  executeCommand: (text: string) => Promise<void>;
  confirmAction: () => Promise<void>;
  cancelAction: () => void;
}

export const useVoiceCommand = (): UseVoiceCommandReturn => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null);
  
  // Track if we're in the middle of processing to prevent state conflicts
  const isProcessingRef = useRef(false);

  const { messages, updateMessage } = useMessages();
  const { createTask } = useTasks();
  const { speak, isSpeaking, stop: stopTTS } = useVoiceTTS();
  
  // Use Whisper transcription (OpenAI STT)
  const { 
    isRecording,
    isTranscribing,
    isSupported,
    transcript: whisperTranscript,
    error: whisperError,
    audioLevel,
    hasAudioInput,
    startRecording,
    stopRecording,
    cancelRecording,
    resetTranscript 
  } = useWhisperTranscription();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
      stopTTS();
    };
  }, [cancelRecording, stopTTS]);

  // Sync transcript from Whisper to local state
  useEffect(() => {
    if (whisperTranscript) {
      setTranscript(whisperTranscript);
    }
  }, [whisperTranscript]);

  const parseCommand = async (text: string): Promise<ParsedCommand> => {
    try {
      const { data, error } = await supabase.functions.invoke('voice-command', {
        body: { text }
      });

      if (error) throw error;
      return data as ParsedCommand;
    } catch (error) {
      console.error('Failed to parse command:', error);
      return {
        action: 'unknown',
        category: 'unknown',
        requiresConfirmation: false,
      };
    }
  };

  const executeAction = async (command: ParsedCommand): Promise<CommandResult> => {
    const { action, context } = command;

    try {
      switch (action) {
        case 'summarize_messages': {
          const unreadMessages = messages?.filter(m => !m.is_read) || [];
          const count = unreadMessages.length;
          if (count > 0) {
            const senders = unreadMessages.slice(0, 3).map(m => m.sender_name).join(', ');
            return {
              success: true,
              response: `You have ${count} unread message${count > 1 ? 's' : ''} from ${senders}${count > 3 ? ' and others' : ''}.`,
              data: { count }
            };
          }
          return { success: true, response: "No urgent items detected. Your inbox is clear." };
        }

        case 'read_priority': {
          const priorityMessages = messages?.filter(m => m.priority === 'high' && !m.is_read) || [];
          if (priorityMessages.length > 0) {
            const first = priorityMessages[0];
            return {
              success: true,
              response: `Priority message from ${first.sender_name}: ${first.subject}`,
              data: first
            };
          }
          return { success: true, response: "No urgent items detected. Nothing requires immediate attention." };
        }

        case 'archive': {
          const unreadMessages = messages?.filter(m => !m.is_read && !m.is_archived) || [];
          for (const msg of unreadMessages.slice(0, 10)) {
            updateMessage({ id: msg.id, updates: { is_archived: true, is_read: true } });
          }
          return {
            success: true,
            response: `Archived ${Math.min(unreadMessages.length, 10)} messages.`,
          };
        }

        case 'create_task': {
          if (context) {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              createTask({
                title: context,
                user_id: userData.user.id,
                status: 'pending',
              });
              return { success: true, response: `Task created: ${context}` };
            }
          }
          return { success: false, response: "Couldn't create task." };
        }

        case 'whats_next': {
          navigate('/');
          return { success: true, response: "Here's what to focus on." };
        }

        case 'run_morning_brief': {
          navigate('/morning-brief');
          return { success: true, response: "Starting your morning brief." };
        }

        case 'start_focus': {
          navigate('/focus');
          return { success: true, response: "Starting focus mode." };
        }

        case 'clear_unread': {
          const unreadMessages = messages?.filter(m => !m.is_read) || [];
          for (const msg of unreadMessages.slice(0, 20)) {
            updateMessage({ id: msg.id, updates: { is_read: true } });
          }
          return {
            success: true,
            response: `Marked ${Math.min(unreadMessages.length, 20)} messages as read.`,
          };
        }

        case 'whats_unresolved': {
          navigate('/clear-open-loops');
          return { success: true, response: "Showing unresolved items." };
        }

        case 'whats_important_today': {
          navigate('/morning-brief');
          return { success: true, response: "Here's what matters today." };
        }

        default:
          return {
            success: false,
            response: RESPONSE_TEMPLATES.unknown(),
          };
      }
    } catch (error) {
      console.error('Command execution error:', error);
      return { success: false, response: "Command failed." };
    }
  };

  const executeCommand = useCallback(async (text: string) => {
    // Guard: only execute if we have a valid transcript
    if (!text || !text.trim()) {
      console.log('[VoiceCommand] Empty text, providing feedback');
      const noTranscriptResponse = "I didn't catch that. Try again.";
      setLastResponse(noTranscriptResponse);
      setStatus('speaking');
      await speak(noTranscriptResponse);
      setStatus('idle');
      return;
    }
    
    console.log('[VoiceCommand] Executing command:', text);
    isProcessingRef.current = true;
    setStatus('processing');

    try {
      const command = await parseCommand(text);
      
      // Dev mode logging: transcript + parsed intent
      if (import.meta.env.DEV) {
        console.log('[VoiceCommand] Transcript:', text);
        console.log('[VoiceCommand] Parsed Intent:', {
          action: command.action,
          category: command.category,
          context: command.context,
          requiresConfirmation: command.requiresConfirmation,
        });
      }

      if (command.requiresConfirmation) {
        const confirmMsg = command.confirmationReason === 'bulk_delete'
          ? `Confirm archiving ${command.bulkCount || 'multiple'} messages?`
          : command.confirmationReason === 'external_send'
          ? `Confirm sending this message?`
          : `Confirm this action?`;
        
        setConfirmation({ command, message: confirmMsg });
        setPendingCommand(command);
        setStatus('confirming');
        await speak(confirmMsg);
        isProcessingRef.current = false;
        return;
      }

      const result = await executeAction(command);
      setLastResponse(result.response);
      
      // Speak response
      setStatus('speaking');
      await speak(result.response);
      
      // Return to idle after speaking
      setStatus('idle');
    } catch (error) {
      console.error('[VoiceCommand] Execution error:', error);
      const errorResponse = SUGGESTION_RESPONSE;
      setLastResponse(errorResponse);
      
      // Always speak feedback before returning to idle
      setStatus('speaking');
      await speak(errorResponse);
      setStatus('idle');
    } finally {
      isProcessingRef.current = false;
    }
  }, [speak, messages, createTask, navigate, updateMessage]);

  const confirmAction = async () => {
    if (!pendingCommand) return;

    setConfirmation(null);
    isProcessingRef.current = true;
    setStatus('processing');
    
    try {
      const result = await executeAction(pendingCommand);
      setLastResponse(result.response);
      setPendingCommand(null);
      
      setStatus('speaking');
      await speak(result.response);
      setStatus('idle');
    } catch (error) {
      console.error('[VoiceCommand] Confirm action error:', error);
      const errorResponse = "Something went wrong. Try again.";
      setLastResponse(errorResponse);
      setStatus('speaking');
      await speak(errorResponse);
      setStatus('idle');
    } finally {
      isProcessingRef.current = false;
    }
  };

  const cancelAction = async () => {
    setConfirmation(null);
    setPendingCommand(null);
    setLastResponse("Cancelled.");
    setStatus('speaking');
    await speak("Cancelled.");
    setStatus('idle');
  };

  // Start listening - called on press
  const startListening = useCallback(async () => {
    // Don't start if already processing or listening
    if (isProcessingRef.current || isRecording || isTranscribing) {
      console.log('[VoiceCommand] Ignoring start - already busy');
      return;
    }
    
    // Stop any TTS playback before recording
    if (isSpeaking) {
      stopTTS();
    }
    
    console.log('[VoiceCommand] Starting to listen');
    resetTranscript();
    setTranscript('');
    setLastResponse('');
    setStatus('listening');
    
    await startRecording();
  }, [isRecording, isTranscribing, isSpeaking, stopTTS, resetTranscript, startRecording]);

  // Stop listening - called on release
  const stopListening = useCallback(async () => {
    // Only stop if we're actually recording
    if (!isRecording) {
      console.log('[VoiceCommand] Ignoring stop - not recording');
      return;
    }
    
    console.log('[VoiceCommand] Stopping listening, transitioning to processing');
    setStatus('processing');
    
    // Stop recording and get the transcript
    const finalTranscript = await stopRecording();
    
    // Dev mode logging
    if (import.meta.env.DEV) {
      console.log('[VoiceCommand] STT Result:', finalTranscript || '(empty)');
    }
    
    // Only execute if we have a valid transcript
    if (finalTranscript && finalTranscript.trim()) {
      setTranscript(finalTranscript);
      console.log('[VoiceCommand] Processing transcript:', finalTranscript);
      // Execute the command with the final transcript
      await executeCommand(finalTranscript);
    } else {
      // No transcript OR STT failed - show "I didn't catch that"
      console.log('[VoiceCommand] No transcript received, showing error');
      const didntCatchResponse = "I didn't catch that. Try again.";
      setLastResponse(didntCatchResponse);
      
      // Speak the response then return to idle
      setStatus('speaking');
      await speak(didntCatchResponse);
      setStatus('idle');
    }
  }, [isRecording, stopRecording, executeCommand, speak]);

  // Derive effective status - account for transcribing state
  const effectiveStatus: VoiceStatus = 
    isRecording ? 'listening' :
    isTranscribing ? 'processing' :
    isSpeaking ? 'speaking' :
    status;

  return {
    status: effectiveStatus,
    transcript,
    lastResponse,
    transcriptionError: whisperError,
    confirmation,
    isSupported,
    audioLevel,
    hasAudioInput,
    startListening,
    stopListening,
    executeCommand,
    confirmAction,
    cancelAction,
  };
};
