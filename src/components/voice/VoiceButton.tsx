import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';
  isSupported: boolean;
  onPress: () => void;
  onRelease: () => void;
}

export const VoiceButton = ({ status, isSupported, onPress, onRelease }: VoiceButtonProps) => {
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';

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
        
        {/* Button */}
        <button
          onMouseDown={onPress}
          onMouseUp={onRelease}
          onTouchStart={onPress}
          onTouchEnd={onRelease}
          disabled={isProcessing || isSpeaking}
          className={cn(
            "relative w-32 h-32 rounded-full flex items-center justify-center",
            "transition-all duration-300 select-none",
            "border-2",
            isListening 
              ? "bg-gradient-to-br from-purple-600 to-blue-600 border-purple-400 shadow-[0_0_40px_rgba(147,51,234,0.5)]"
              : isProcessing || isSpeaking
              ? "bg-white/10 border-white/20"
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
          ) : (
            <Mic className={cn(
              "h-12 w-12 transition-colors",
              isListening ? "text-white" : "text-white/60"
            )} />
          )}
        </button>
      </div>

      {/* Status text */}
      <p className={cn(
        "text-sm font-medium transition-colors",
        isListening ? "text-purple-400" : "text-white/50"
      )}>
        {isListening ? "Listening..." : 
         isProcessing ? "Processing..." :
         isSpeaking ? "Speaking..." :
         "Hold to speak"}
      </p>
    </div>
  );
};
