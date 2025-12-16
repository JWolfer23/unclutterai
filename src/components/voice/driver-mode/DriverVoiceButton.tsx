import React from 'react';
import { Mic, Loader2 } from 'lucide-react';

type DriverStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';

interface DriverVoiceButtonProps {
  status: DriverStatus;
  isSupported: boolean;
  onPress: () => void;
  onRelease: () => void;
}

export const DriverVoiceButton: React.FC<DriverVoiceButtonProps> = ({
  status,
  isSupported,
  onPress,
  onRelease,
}) => {
  // Haptic feedback on press
  const handlePress = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onPress();
  };

  const handleRelease = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
    onRelease();
  };

  if (!isSupported) {
    return (
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
        <div className="w-44 h-44 rounded-full bg-black/80 border-2 border-white/10 flex items-center justify-center">
          <span className="text-white/40 text-sm text-center px-4">
            Voice not supported
          </span>
        </div>
      </div>
    );
  }

  const isActive = status === 'listening';
  const isProcessing = status === 'processing';

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
      {/* Ambient glow behind button */}
      {isActive && (
        <div className="absolute inset-0 w-44 h-44 rounded-full bg-cyan-500/30 blur-2xl animate-pulse" />
      )}
      
      {/* Main button - no labels, just icon */}
      <button
        className={`
          relative w-44 h-44 rounded-full 
          bg-black/80 backdrop-blur-sm
          border-2 transition-all duration-300
          flex items-center justify-center
          active:scale-95
          ${isActive 
            ? 'border-cyan-400/60 shadow-[0_0_40px_rgba(6,182,212,0.4)]' 
            : 'border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
          }
          ${isProcessing ? 'animate-pulse' : ''}
        `}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
        ) : (
          <Mic 
            className={`w-16 h-16 transition-colors duration-300 ${
              isActive ? 'text-cyan-300' : 'text-cyan-400'
            }`} 
          />
        )}
      </button>
    </div>
  );
};
