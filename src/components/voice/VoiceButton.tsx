import { Mic, MicOff, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useCallback } from "react";

interface VoiceButtonProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  audioLevel?: number; // 0-1 normalized
  hasAudioInput?: boolean;
}

export const VoiceButton = ({ 
  status, 
  isSupported, 
  onStart,
  onStop,
  audioLevel = 0,
  hasAudioInput = true
}: VoiceButtonProps) => {
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';
  const isDisabled = isProcessing || isSpeaking;
  
  // Track if we're currently holding
  const isHoldingRef = useRef(false);

  // Handle press start (mouse or touch)
  const handlePressStart = useCallback(() => {
    if (isDisabled || isListening) return;
    isHoldingRef.current = true;
    onStart();
  }, [isDisabled, isListening, onStart]);

  // Handle press end - immediately triggers transcription
  const handlePressEnd = useCallback(() => {
    if (!isHoldingRef.current || !isListening) return;
    isHoldingRef.current = false;
    // Immediately send to transcription on release
    onStop();
  }, [isListening, onStop]);

  // Prevent context menu on long press (mobile)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <MicOff className="h-12 w-12 text-white/30" />
        </div>
        <p className="text-white/40 text-sm">Voice not supported in this browser</p>
      </div>
    );
  }

  // Generate waveform bars based on audio level
  const waveformBars = [0.6, 1, 0.7, 0.9, 0.5];
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Outer glow ring */}
      <div className={cn(
        "relative transition-all duration-300",
        isListening && audioLevel > 0.1 && "animate-pulse"
      )}>
        {/* Ambient glow - intensity based on audio level */}
        {isListening && (
          <div 
            className="absolute -inset-6 rounded-full bg-red-500/30 blur-2xl transition-opacity duration-100"
            style={{ opacity: 0.3 + audioLevel * 0.7 }}
          />
        )}
        
        {/* Button - Hold to speak, release to execute */}
        <button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          onContextMenu={handleContextMenu}
          disabled={isDisabled}
          className={cn(
            "relative w-32 h-32 rounded-full flex items-center justify-center",
            "transition-all duration-300 select-none touch-manipulation",
            "border-2",
            isListening 
              ? "bg-gradient-to-br from-red-600 to-orange-600 border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.5)]"
              : isProcessing || isSpeaking
              ? "bg-white/10 border-white/20 cursor-wait"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          ) : isSpeaking ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-2 bg-white rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 20}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          ) : isListening ? (
            // Waveform visualization responding to audio level
            <div className="flex items-center gap-1">
              {waveformBars.map((multiplier, i) => (
                <div
                  key={i}
                  className="w-2 bg-white rounded-full transition-all duration-75"
                  style={{
                    height: `${12 + (audioLevel * 28 * multiplier)}px`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Mic className="h-12 w-12 text-white/60" />
          )}
        </button>
      </div>

      {/* Status text with no-audio warning */}
      <div className="flex flex-col items-center gap-1">
        {isListening && !hasAudioInput ? (
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm font-medium">No sound detected</p>
          </div>
        ) : (
          <p className={cn(
            "text-sm font-medium transition-colors",
            isListening ? "text-red-400" : "text-white/50"
          )}>
            {isListening ? "Release to send" : 
             isProcessing ? "Transcribing..." :
             isSpeaking ? "Speaking..." :
             "Hold to speak"}
          </p>
        )}
        
        {/* Debug: Show audio level when listening */}
        {isListening && import.meta.env.DEV && (
          <p className="text-xs text-white/30">
            Level: {Math.round(audioLevel * 100)}%
          </p>
        )}
      </div>
    </div>
  );
};
