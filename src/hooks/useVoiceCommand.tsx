import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceInput } from './useVoiceInput';
import { useVoiceTTS } from './useVoiceTTS';
import { useMessages } from './useMessages';
import { useTasks } from './useTasks';
import { useNavigate } from 'react-router-dom';
import { 
  ParsedCommand, 
  CommandResult, 
  RESPONSE_TEMPLATES,
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
  confirmation: ConfirmationState | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  executeCommand: (text: string) => Promise<void>;
  confirmAction: () => Promise<void>;
  cancelAction: () => void;
}

export const useVoiceCommand = (): UseVoiceCommandReturn => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [lastResponse, setLastResponse] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null);

  const { messages, updateMessage } = useMessages();
  const { createTask } = useTasks();
  const { speak, isSpeaking } = useVoiceTTS();

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
          return {
            success: true,
            response: count > 0 
              ? `You have ${count} unread messages. ${unreadMessages.slice(0, 3).map(m => m.sender_name).join(', ')} and others.`
              : "No unread messages.",
            data: { count }
          };
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
          return { success: true, response: "No priority messages." };
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
          return { success: true, response: "Showing what's next." };
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

  const executeCommand = async (text: string) => {
    setStatus('processing');

    const command = await parseCommand(text);

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
      return;
    }

    const result = await executeAction(command);
    setLastResponse(result.response);
    setStatus('speaking');
    await speak(result.response);
    setStatus('idle');
  };

  const confirmAction = async () => {
    if (!pendingCommand) return;

    setConfirmation(null);
    setStatus('processing');
    
    const result = await executeAction(pendingCommand);
    setLastResponse(result.response);
    setPendingCommand(null);
    
    setStatus('speaking');
    await speak(result.response);
    setStatus('idle');
  };

  const cancelAction = () => {
    setConfirmation(null);
    setPendingCommand(null);
    setStatus('idle');
    speak("Cancelled.");
  };

  const handleTranscript = useCallback(async (transcript: string, isFinal: boolean) => {
    if (isFinal && transcript.trim()) {
      await executeCommand(transcript);
    }
  }, []);

  const { 
    isSupported, 
    transcript,
    startListening: startVoiceInput,
    stopListening: stopVoiceInput,
  } = useVoiceInput({ onTranscript: handleTranscript });

  const startListening = useCallback(() => {
    setStatus('listening');
    startVoiceInput();
  }, [startVoiceInput]);

  const stopListening = useCallback(() => {
    stopVoiceInput();
    if (!transcript) {
      setStatus('idle');
    }
  }, [stopVoiceInput, transcript]);

  return {
    status: isSpeaking ? 'speaking' : status,
    transcript,
    lastResponse,
    confirmation,
    isSupported,
    startListening,
    stopListening,
    executeCommand,
    confirmAction,
    cancelAction,
  };
};
