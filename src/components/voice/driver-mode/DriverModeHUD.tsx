import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { DriverCommandButton } from './DriverCommandButton';
import { useDriverMode } from '@/hooks/useDriverMode';
import { useNextBestAction } from '@/hooks/useNextBestAction';
import { useEyesFreeVoice } from '@/hooks/useEyesFreeVoice';
import { useNavigate } from 'react-router-dom';
import { 
  DRIVER_COMMANDS, 
  DRIVER_MODE_GREETING,
  DRIVER_CONFIRMATIONS,
  getNextBestActionSpeech,
  type DriverCommandId,
} from '@/lib/driverModeCommands';
import { useMessages } from '@/hooks/useMessages';

interface DriverModeHUDProps {
  onExit: () => void;
}

export const DriverModeHUD: React.FC<DriverModeHUDProps> = ({ onExit }) => {
  const navigate = useNavigate();
  const { queuedItems, activate, deactivate } = useDriverMode();
  const { nextBestAction, openLoopsCount, urgentCount } = useNextBestAction();
  const { messages, updateMessage } = useMessages();
  const { 
    speakRecommendation, 
    speakConfirmation, 
    isSpeaking,
    stop: stopSpeaking,
  } = useEyesFreeVoice();

  const [activeCommand, setActiveCommand] = useState<DriverCommandId | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const hasSpokenGreeting = useRef(false);

  // Activate driver mode on mount
  useEffect(() => {
    activate();
    return () => deactivate();
  }, [activate, deactivate]);

  // STRICT DRIVER MODE RULE: Always speak exactly ONE action or "nothing urgent"
  // Never present multiple options. Never ask questions.
  useEffect(() => {
    if (hasSpokenGreeting.current || isMuted) return;
    hasSpokenGreeting.current = true;

    const speakSingleAction = async () => {
      // Speak greeting first
      await speakRecommendation(DRIVER_MODE_GREETING);
      
      // Small pause then speak the ONE Next Best Action
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Determine single action or "nothing urgent"
      const hasUrgentAction = openLoopsCount > 0 || urgentCount > 0;
      
      if (!hasUrgentAction) {
        // Nothing urgent - speak reassurance, not options
        const speech = DRIVER_CONFIRMATIONS.nothingUrgent;
        setStatusText(speech);
        await speakRecommendation(speech);
      } else {
        // ONE action only - never multiple
        const nbaCount = nextBestAction.type === 'CLOSE_LOOPS' ? openLoopsCount :
                         nextBestAction.type === 'URGENT_REPLIES' ? urgentCount : 0;
        const nbaSpeech = getNextBestActionSpeech(nextBestAction.type, nbaCount);
        
        setStatusText(nbaSpeech);
        await speakRecommendation(nbaSpeech);
      }
    };

    speakSingleAction();
  }, [speakRecommendation, nextBestAction, openLoopsCount, urgentCount, isMuted]);

  // Command handlers - STRICT: Always ONE action, never ask questions
  const handleWhatsNext = useCallback(async () => {
    setActiveCommand('whats_next');
    
    // Check if there's anything actionable
    const hasUrgentAction = openLoopsCount > 0 || urgentCount > 0;
    
    if (!hasUrgentAction) {
      // Nothing urgent - speak reassurance, not options
      setStatusText(DRIVER_CONFIRMATIONS.nothingUrgent);
      if (!isMuted) {
        await speakRecommendation(DRIVER_CONFIRMATIONS.nothingUrgent);
      }
      setActiveCommand(null);
      return;
    }
    
    // ONE action only
    const nbaCount = nextBestAction.type === 'CLOSE_LOOPS' ? openLoopsCount :
                     nextBestAction.type === 'URGENT_REPLIES' ? urgentCount : 0;
    const speech = getNextBestActionSpeech(nextBestAction.type, nbaCount);
    setStatusText(speech);
    
    if (!isMuted) {
      await speakRecommendation(speech);
    }
    
    // Navigate to the relevant screen after speaking
    setTimeout(() => {
      navigate(nextBestAction.href);
      onExit();
    }, 1500);
  }, [nextBestAction, openLoopsCount, urgentCount, speakRecommendation, navigate, onExit, isMuted]);

  const handleSummarizeMessages = useCallback(async () => {
    setActiveCommand('summarize_messages');
    const unreadMessages = messages?.filter(m => !m.is_read) || [];
    const count = unreadMessages.length;
    
    if (count === 0) {
      // Cannot proceed - explain calmly
      setStatusText(DRIVER_CONFIRMATIONS.noMessages);
      if (!isMuted) {
        await speakRecommendation(DRIVER_CONFIRMATIONS.noMessages);
      }
    } else {
      // Confirm execution - no UI narration
      setStatusText(DRIVER_CONFIRMATIONS.summarizing);
      if (!isMuted) {
        await speakRecommendation(DRIVER_CONFIRMATIONS.summarizing);
      }
      
      // Brief pause then deliver summary
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let summary: string;
      if (count === 1) {
        summary = `One message from ${unreadMessages[0].sender_name}.`;
      } else {
        const senders = [...new Set(unreadMessages.map(m => m.sender_name))];
        summary = senders.length <= 2 
          ? `${count} messages from ${senders.join(' and ')}.`
          : `${count} messages from ${senders.length} people.`;
      }
      
      setStatusText(summary);
      if (!isMuted) {
        await speakRecommendation(summary);
      }
    }
    setActiveCommand(null);
  }, [messages, speakRecommendation, isMuted]);

  const handleClearUnread = useCallback(async () => {
    setActiveCommand('clear_unread');
    const unreadMessages = messages?.filter(m => !m.is_read) || [];
    
    if (unreadMessages.length === 0) {
      // Cannot proceed - explain calmly
      setStatusText(DRIVER_CONFIRMATIONS.cannotClear);
      if (!isMuted) {
        await speakRecommendation(DRIVER_CONFIRMATIONS.cannotClear);
      }
    } else {
      // Confirm execution with guide phrase for multi-item action
      const confirmSpeech = unreadMessages.length > 3 
        ? DRIVER_CONFIRMATIONS.guidingInbox 
        : DRIVER_CONFIRMATIONS.clearingInbox;
      
      setStatusText(confirmSpeech);
      if (!isMuted) {
        await speakRecommendation(confirmSpeech);
      }
      
      // Execute action
      for (const msg of unreadMessages) {
        updateMessage({ id: msg.id, updates: { is_read: true } });
      }
      
      // Brief pause then confirm completion
      await new Promise(resolve => setTimeout(resolve, 300));
      setStatusText(DRIVER_CONFIRMATIONS.allClear);
      if (!isMuted) {
        await speakConfirmation(DRIVER_CONFIRMATIONS.allClear);
      }
    }
    setActiveCommand(null);
  }, [messages, updateMessage, speakRecommendation, speakConfirmation, isMuted]);

  const handleStartFocus = useCallback(async () => {
    setActiveCommand('start_focus');
    
    // Confirm execution - no mechanics explanation
    setStatusText(DRIVER_CONFIRMATIONS.startingFocus);
    if (!isMuted) {
      await speakConfirmation(DRIVER_CONFIRMATIONS.startingFocus);
    }
    
    // Navigate to focus mode
    setTimeout(() => {
      navigate('/focus');
      onExit();
    }, 800);
  }, [speakConfirmation, navigate, onExit, isMuted]);

  // Map command IDs to handlers
  const commandHandlers: Record<DriverCommandId, () => Promise<void>> = {
    whats_next: handleWhatsNext,
    summarize_messages: handleSummarizeMessages,
    clear_unread: handleClearUnread,
    start_focus: handleStartFocus,
  };

  const handleExit = () => {
    stopSpeaking();
    onExit();
  };

  const toggleMute = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Subtle ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 80%, rgba(6,182,212,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Header: Exit + Mute */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
        {/* Queued items indicator */}
        <div className="text-sm text-white/30">
          {queuedItems > 0 ? `${queuedItems} queued` : ''}
        </div>
        
        <div className="flex gap-3">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white/40" />
            ) : (
              <Volume2 className="w-5 h-5 text-white/40" />
            )}
          </button>
          
          {/* Exit button */}
          <button
            onClick={handleExit}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Exit Driver Mode"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="h-full flex flex-col items-center justify-center px-6 pb-8">
        {/* Status text - single line, no questions */}
        <div className="mb-12 h-16 flex items-center justify-center">
          {statusText && (
            <p className="text-xl text-white/80 text-center font-medium animate-fade-in">
              {statusText}
            </p>
          )}
          {isSpeaking && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>

        {/* Command buttons - 2x2 grid, large tap targets */}
        <div className="w-full max-w-md grid grid-cols-2 gap-4">
          {DRIVER_COMMANDS.map((cmd) => (
            <DriverCommandButton
              key={cmd.id}
              id={cmd.id}
              label={cmd.label}
              icon={cmd.icon}
              isActive={activeCommand === cmd.id}
              disabled={isSpeaking && activeCommand !== cmd.id}
              onPress={() => commandHandlers[cmd.id]()}
            />
          ))}
        </div>

        {/* Bottom hint - minimal */}
        <p className="mt-12 text-xs text-white/20 text-center">
          Tap a command. No typing needed.
        </p>
      </div>
    </div>
  );
};
