import { useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnclutter } from "@/hooks/useUnclutter";
import {
  UnclutterStart,
  UnclutterScanning,
  LoopScreen,
  UnclutterClosure,
  ReplyModal,
  ScheduleModal
} from "@/components/unclutter";

const UnclutterMode = () => {
  const navigate = useNavigate();
  const {
    phase,
    currentLoop,
    loopsResolved,
    isLoading,
    aiDraft,
    isGeneratingDraft,
    uctData,
    startScan,
    resolve,
    generateDraft,
    createTaskFromLoop,
    needsConfirmation,
    reset
  } = useUnclutter();

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Handle reply action
  const handleReply = async () => {
    await generateDraft();
    setShowReplyModal(true);
  };

  // Handle send reply
  const handleSendReply = async (finalDraft: string) => {
    setIsSending(true);
    await new Promise(r => setTimeout(r, 500)); // Simulate send
    setShowReplyModal(false);
    setIsSending(false);
    await resolve('reply');
  };

  // Handle schedule
  const handleSchedule = async (date: Date) => {
    await createTaskFromLoop(date);
    setShowScheduleModal(false);
    await resolve('schedule');
  };

  // Handle exit - only allowed in idle or complete phases
  const handleExit = () => {
    reset();
    navigate("/");
  };

  // Block navigation during resolution - user must complete current item
  const canExit = phase === 'idle' || phase === 'complete';

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - only show back button when not resolving */}
        <div className="flex items-center justify-between mb-8">
          {canExit ? (
            <button
              onClick={handleExit}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Home</span>
            </button>
          ) : (
            <div className="text-white/30 text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin-slow" />
              <span>Resolve to continue</span>
            </div>
          )}

          {phase !== 'idle' && phase !== 'scanning' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-300/70 via-teal-200/50 to-cyan-100/30 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Unclutter Mode</h1>
                <p className="text-white/50 text-xs">One at a time</p>
              </div>
            </div>
          )}
        </div>

        {/* Phase-based rendering */}
        {phase === 'idle' && (
          <UnclutterStart onStart={startScan} isLoading={isLoading} />
        )}

        {phase === 'scanning' && (
          <UnclutterScanning />
        )}

        {phase === 'resolving' && currentLoop && (
          <LoopScreen
            loop={currentLoop}
            loopsResolved={loopsResolved}
            onReply={handleReply}
            onSchedule={() => setShowScheduleModal(true)}
            onArchive={() => resolve('archive')}
            onIgnore={() => resolve('ignore')}
            isGeneratingDraft={isGeneratingDraft}
            uctData={uctData}
          />
        )}

        {phase === 'complete' && (
          <UnclutterClosure
            loopsResolved={loopsResolved}
            onExit={handleExit}
          />
        )}

        {/* Reply Modal */}
        {showReplyModal && aiDraft && (
          <ReplyModal
            draft={aiDraft}
            onSend={handleSendReply}
            onClose={() => setShowReplyModal(false)}
            isSending={isSending}
            requiresConfirmation={needsConfirmation('reply')}
          />
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <ScheduleModal
            onSchedule={handleSchedule}
            onClose={() => setShowScheduleModal(false)}
            requiresConfirmation={needsConfirmation('schedule')}
          />
        )}
      </div>
    </div>
  );
};

export default UnclutterMode;
