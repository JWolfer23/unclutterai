import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

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
  const showTranscript = status === 'listening' || (status === 'processing' && transcript);
  const showResponse = status === 'speaking' || (status === 'idle' && lastResponse);
  const showError = transcriptionError && status === 'idle' && !lastResponse;

  return (
    <div className="min-h-[100px] flex flex-col items-center justify-center text-center px-4">
      {/* Listening indicator */}
      {status === 'listening' && !transcript && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-sm text-white/70">Listening...</p>
          </div>
        </div>
      )}

      {/* Show transcript while listening or processing */}
      {showTranscript && transcript && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <p className="text-xs text-white/40 uppercase tracking-wider">You said</p>
          <p className={cn(
            "text-lg text-white font-medium transition-opacity",
            status === 'processing' && "opacity-60"
          )}>
            "{transcript}"
          </p>
        </div>
      )}

      {/* Show processing state without transcript */}
      {status === 'processing' && !transcript && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            <p className="text-sm text-white/50">Processing...</p>
          </div>
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

      {/* Show response after processing */}
      {showResponse && lastResponse && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <p className="text-xs text-purple-400/60 uppercase tracking-wider">Response</p>
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
