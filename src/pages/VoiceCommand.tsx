import { useState } from "react";
import { ArrowLeft, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { 
  VoiceButton, 
  TranscriptDisplay, 
  ConfirmationDialog, 
  QuickCommands 
} from "@/components/voice";
import { DriverModeHUD } from "@/components/voice/driver-mode";

const VoiceCommand = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'standard' | 'driver'>('standard');
  
  const {
    status,
    transcript,
    lastResponse,
    transcriptionError,
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

  // Driver Mode - Minimal HUD
  if (mode === 'driver') {
    return <DriverModeHUD onExit={() => setMode('standard')} />;
  }

  // Standard Mode
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
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Home</span>
            </button>

            {/* Driver Mode Toggle */}
            <button
              onClick={() => setMode('driver')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
            >
              <Car className="h-4 w-4" />
              <span>Driver Mode</span>
            </button>
          </div>

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
            transcriptionError={transcriptionError}
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
