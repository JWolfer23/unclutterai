import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { 
  VoiceButton, 
  TranscriptDisplay, 
  ConfirmationDialog, 
  QuickCommands 
} from "@/components/voice";

const VoiceCommand = () => {
  const navigate = useNavigate();
  const {
    status,
    transcript,
    lastResponse,
    confirmation,
    isSupported,
    startListening,
    stopListening,
    executeCommand,
    confirmAction,
    cancelAction,
  } = useVoiceCommand();

  const handleQuickCommand = (command: string) => {
    executeCommand(command);
  };

  const isProcessing = status === 'processing' || status === 'speaking';

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white px-6 py-8">
      {/* Confirmation Dialog */}
      {confirmation && (
        <ConfirmationDialog
          message={confirmation.message}
          onConfirm={confirmAction}
          onCancel={cancelAction}
        />
      )}

      <div className="max-w-lg mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Voice Command</h1>
            <p className="text-white/50 text-sm">
              The assistant does not chat. It executes.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* Transcript / Response Display */}
          <TranscriptDisplay
            transcript={transcript}
            lastResponse={lastResponse}
            status={status}
          />

          {/* Voice Button */}
          <VoiceButton
            status={status}
            isSupported={isSupported}
            onPress={startListening}
            onRelease={stopListening}
          />

          {/* Quick Commands */}
          <div className="w-full mt-8">
            <QuickCommands 
              onSelect={handleQuickCommand} 
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Footer hint */}
        <div className="text-center py-4">
          <p className="text-xs text-white/30">
            Try: "What's next?" • "Run morning brief" • "Create task: [description]"
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommand;
