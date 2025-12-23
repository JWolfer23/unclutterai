import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { DriverCommandButton } from './DriverCommandButton';
import { useDriverMode } from '@/hooks/useDriverMode';
import { useGlobalPriority } from '@/contexts/GlobalPriorityContext';
import { useEyesFreeVoice } from '@/hooks/useEyesFreeVoice';
import { useNavigate } from 'react-router-dom';
import { 
  DRIVER_COMMANDS, 
  DRIVER_MODE_GREETING,
  DRIVER_CONFIRMATIONS,
  type DriverCommandId,
} from '@/lib/driverModeCommands';
import { getMessageSummary, NBA_NOTHING } from '@/lib/driverModeVoice';
import { useMessages } from '@/hooks/useMessages';

interface DriverModeHUDProps {
  onExit: () => void;
}

/**
 * Driver Mode - Eyes-Free Command Center
 * 
 * STRICT RULES:
 * - No chat interface
 * - No text input
 * - No menus
 * - No branching questions
 * - Always surface ONE action verbally
 * - If no action needed: "Nothing urgent needs your attention."
 */
export const DriverModeHUD: React.FC<DriverModeHUDProps> = ({ onExit }) => {
  const navigate = useNavigate();
  const { activate, deactivate } = useDriverMode();
  const { output } = useGlobalPriority();
  const { messages, updateMessage } = useMessages();
  const { 
    speakRecommendation, 
    speakConfirmation, 
    isSpeaking,
    stop: stopSpeaking,
  } = useEyesFreeVoice();

  const [activeCommand, setActiveCommand] = useState<DriverCommandId | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const hasSpokenGreeting = useRef(false);

  // Activate driver mode on mount
  useEffect(() => {
    activate();
    return () => deactivate();
  }, [activate, deactivate]);

  // STRICT: On open, speak greeting + ONE action (or reassurance)
  useEffect(() => {
    if (hasSpokenGreeting.current || isMuted) return;
    hasSpokenGreeting.current = true;

    const speakSingleAction = async () => {
      // Speak greeting: "I'll handle prioritization."
      await speakRecommendation(DRIVER_MODE_GREETING);
      
      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Speak exactly ONE action or reassurance
      if (!output.recommendation) {
        await speakRecommendation(NBA_NOTHING);
      } else {
        // Single action from Global Priority Engine - use the title
        await speakRecommendation(output.recommendation.title);
      }
    };

    speakSingleAction();
  }, [speakRecommendation, output.recommendation, isMuted]);

  // Command handlers - STRICT: Always ONE action, never ask questions
  const handleWhatsNext = useCallback(async () => {
    setActiveCommand('whats_next');
    
    if (!output.recommendation) {
      if (!isMuted) {
        await speakRecommendation(NBA_NOTHING);
      }
      setActiveCommand(null);
      return;
    }
    
    // Speak the single recommendation
    if (!isMuted) {
      await speakRecommendation(output.recommendation.title);
    }
    
    // Navigate to action if available
    if (output.recommendation.href) {
      setTimeout(() => {
        navigate(output.recommendation!.href!);
        onExit();
      }, 1200);
    }
    
    setActiveCommand(null);
  }, [output.recommendation, speakRecommendation, navigate, onExit, isMuted]);

  const handleSummarizeMessages = useCallback(async () => {
    setActiveCommand('summarize_messages');
    const unreadMessages = messages?.filter(m => !m.is_read) || [];
    const count = unreadMessages.length;
    
    if (count === 0) {
      if (!isMuted) {
        await speakRecommendation(DRIVER_CONFIRMATIONS.noMessages);
      }
    } else {
      // Brief confirmation then summary
      if (!isMuted) {
        await speakRecommendation(DRIVER_CONFIRMATIONS.summarizing);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const senders = [...new Set(unreadMessages.map(m => m.sender_name))];
        const summary = getMessageSummary(count, senders);
        await speakRecommendation(summary);
      }
    }
    setActiveCommand(null);
  }, [messages, speakRecommendation, isMuted]);

  const handleClearUnread = useCallback(async () => {
    setActiveCommand('clear_unread');
    const unreadMessages = messages?.filter(m => !m.is_read) || [];
    
    if (unreadMessages.length === 0) {
      if (!isMuted) {
        await speakRecommendation(DRIVER_CONFIRMATIONS.cannotClear);
      }
    } else {
      // Execute action
      for (const msg of unreadMessages) {
        updateMessage({ id: msg.id, updates: { is_read: true } });
      }
      
      // Confirm completion
      if (!isMuted) {
        await speakConfirmation(DRIVER_CONFIRMATIONS.allClear);
      }
    }
    setActiveCommand(null);
  }, [messages, updateMessage, speakRecommendation, speakConfirmation, isMuted]);

  const handleStartFocus = useCallback(async () => {
    setActiveCommand('start_focus');
    
    if (!isMuted) {
      await speakConfirmation(DRIVER_CONFIRMATIONS.startingFocus);
    }
    
    setTimeout(() => {
      navigate('/focus');
      onExit();
    }, 600);
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
      {/* Minimal ambient glow - calm, not distracting */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isSpeaking 
            ? 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 60%)'
            : 'radial-gradient(circle at 50% 80%, rgba(6,182,212,0.05) 0%, transparent 40%)',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Header: Exit + Mute only - no status text, no queued count */}
      <div className="absolute top-6 right-6 flex gap-3">
        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white/40" />
          ) : (
            <Volume2 className="w-6 h-6 text-white/60" />
          )}
        </button>
        
        {/* Exit button */}
        <button
          onClick={handleExit}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Exit Driver Mode"
        >
          <X className="w-6 h-6 text-white/40" />
        </button>
      </div>

      {/* Main content - centered, minimal */}
      <div className="h-full flex flex-col items-center justify-center px-6 pb-8">
        {/* Voice activity indicator - replaces all status text */}
        <div className="mb-16 h-20 flex items-center justify-center">
          {isSpeaking && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="flex gap-1.5">
                <span className="w-2 h-8 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-12 bg-primary/80 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                <span className="w-2 h-6 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-10 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                <span className="w-2 h-4 bg-primary/50 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Command buttons - 2x2 grid, large tap targets, no labels during speech */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-5">
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

        {/* Minimal bottom hint - only visible when not speaking */}
        {!isSpeaking && (
          <p className="mt-12 text-xs text-white/15 text-center animate-fade-in">
            Tap a command
          </p>
        )}
      </div>
    </div>
  );
};
