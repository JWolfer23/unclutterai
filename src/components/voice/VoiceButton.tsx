import { Mic, MicOff, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';
  isSupported: boolean;
  onToggle: () => void;
}

export const VoiceButton = ({ status, isSupported, onToggle }: VoiceButtonProps) => {
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';
  const isDisabled = isProcessing || isSpeaking;

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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Outer glow ring */}
      <div className={cn(
        "relative transition-all duration-300",
        isListening && "animate-pulse"
      )}>
        {/* Ambient glow */}
        {isListening && (
          <div className="absolute -inset-6 rounded-full bg-purple-500/30 blur-2xl animate-pulse" />
        )}
        
        {/* Button - Tap to toggle */}
        <button
          onClick={onToggle}
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
            <Square className="h-10 w-10 text-white fill-white" />
          ) : (
            <Mic className="h-12 w-12 text-white/60" />
          )}
        </button>
      </div>

      {/* Status text */}
      <p className={cn(
        "text-sm font-medium transition-colors",
        isListening ? "text-red-400" : "text-white/50"
      )}>
        {isListening ? "Tap to stop" : 
         isProcessing ? "Processing..." :
         isSpeaking ? "Speaking..." :
         "Tap to speak"}
      </p>
    </div>
  );
};
