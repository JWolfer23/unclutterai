import React from 'react';
import { X } from 'lucide-react';
import { WaveformIndicator } from './WaveformIndicator';
import { ContextualCard } from './ContextualCard';
import { DriverVoiceButton } from './DriverVoiceButton';
import { useDriverMode } from '@/hooks/useDriverMode';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';

interface DriverModeHUDProps {
  onExit: () => void;
}

export const DriverModeHUD: React.FC<DriverModeHUDProps> = ({ onExit }) => {
  const { contextCard, dismissCard, queuedItems } = useDriverMode();
  const { 
    status, 
    isSupported, 
    startListening, 
    stopListening,
    transcript,
  } = useVoiceCommand();

  const isListening = status === 'listening';

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Subtle ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 80%, rgba(6,182,212,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Exit button - minimal, top right */}
      <button
        onClick={onExit}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      >
        <X className="w-5 h-5 text-white/40" />
      </button>

      {/* Queued items indicator - subtle, top left */}
      {queuedItems > 0 && !isListening && (
        <div className="absolute top-6 left-6 text-sm text-white/30">
          {queuedItems} queued
        </div>
      )}

      {/* THREE-ZONE LAYOUT */}
      <div className="h-full flex flex-col items-center justify-between py-20">
        
        {/* TOP: Listening indicator */}
        <div className="h-20 flex items-center">
          <WaveformIndicator isListening={isListening} />
        </div>

        {/* CENTER: Contextual card OR transcript */}
        <div className="flex-1 flex items-center justify-center px-6 w-full">
          {transcript && isListening ? (
            <p className="text-lg text-white/70 text-center max-w-sm">
              "{transcript}"
            </p>
          ) : (
            <ContextualCard card={contextCard} onDismiss={dismissCard} />
          )}
        </div>

        {/* BOTTOM: Large voice button - thumb reachable */}
        <div className="h-56">
          <DriverVoiceButton
            status={status}
            isSupported={isSupported}
            onPress={startListening}
            onRelease={stopListening}
          />
        </div>
      </div>
    </div>
  );
};
