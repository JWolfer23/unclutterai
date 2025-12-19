import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface TranscriptDisplayProps {
  transcript: string;
  lastResponse: string;
  transcriptionError?: string | null;
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';
}

export const TranscriptDisplay = ({ 
  transcript, 
  lastResponse, 
  transcriptionError,
  status 
}: TranscriptDisplayProps) => {
  // Show transcript during listening, processing, and speaking (until execution completes)
  const showTranscript = transcript && (
    status === 'listening' || 
    status === 'processing' || 
    status === 'speaking'
  );
  
  // Show response after processing completes
  const showResponse = lastResponse && (status === 'speaking' || status === 'idle');
  const showError = transcriptionError && status === 'idle' && !lastResponse;

  return (
    <div className="min-h-[120px] flex flex-col items-center justify-center text-center px-4 gap-4">
      {/* Listening indicator */}
      {status === 'listening' && !transcript && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-sm text-white/70">Listening...</p>
          </div>
        </div>
      )}

      {/* Show transcript - stays visible during processing and speaking */}
      {showTranscript && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <p className="text-xs text-white/40 uppercase tracking-wider">You said</p>
          <p className={cn(
            "text-lg text-white font-medium transition-opacity",
            (status === 'processing' || status === 'speaking') && "opacity-80"
          )}>
            "{transcript}"
          </p>
        </div>
      )}

      {/* Show processing state */}
      {status === 'processing' && (
        <div className="flex items-center gap-2 animate-in fade-in duration-200">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
          <p className="text-sm text-white/50">Processing...</p>
        </div>
      )}

      {/* Show transcription error visibly */}
      {showError && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{transcriptionError}</p>
          </div>
          <p className="text-xs text-white/40">
            Try speaking louder or holding longer
          </p>
        </div>
      )}

      {/* Show response after processing - with success indicator */}
      {showResponse && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-emerald-400/80 uppercase tracking-wider">Response</p>
          </div>
          <p className="text-lg text-white/90 leading-relaxed max-w-sm">
            {lastResponse}
          </p>
        </div>
      )}

      {/* Initial idle state */}
      {status === 'idle' && !lastResponse && !showError && (
        <p className="text-white/30 text-sm">
          Press and hold to give a command
        </p>
      )}
    </div>
  );
};
