import { cn } from "@/lib/utils";

interface TranscriptDisplayProps {
  transcript: string;
  lastResponse: string;
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';
}

export const TranscriptDisplay = ({ transcript, lastResponse, status }: TranscriptDisplayProps) => {
  const showTranscript = status === 'listening' || status === 'processing';
  const showResponse = status === 'speaking' || (status === 'idle' && lastResponse);

  return (
    <div className="min-h-[80px] flex flex-col items-center justify-center text-center px-4">
      {showTranscript && transcript && (
        <div className="space-y-2">
          <p className="text-xs text-white/40 uppercase tracking-wider">You said</p>
          <p className={cn(
            "text-lg text-white font-medium transition-opacity",
            status === 'processing' && "opacity-60"
          )}>
            "{transcript}"
          </p>
        </div>
      )}

      {showResponse && lastResponse && (
        <div className="space-y-2">
          <p className="text-xs text-purple-400/60 uppercase tracking-wider">Response</p>
          <p className="text-lg text-white/80">
            {lastResponse}
          </p>
        </div>
      )}

      {status === 'idle' && !lastResponse && (
        <p className="text-white/30 text-sm">
          Press and hold to give a command
        </p>
      )}
    </div>
  );
};
