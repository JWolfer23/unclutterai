import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOpenLoops } from "@/hooks/useOpenLoops";
import {
  ScanningScreen,
  LoopGroupSelector,
  LoopCard,
  ReplyDraftModal,
  ScheduleModal,
  ClosureScreen
} from "@/components/open-loops";

const ClearOpenLoops = () => {
  const navigate = useNavigate();
  const {
    phase,
    inventory,
    currentLoop,
    currentGroup,
    currentLoopIndex,
    currentLoops,
    isLoading,
    aiDraft,
    isGeneratingDraft,
    startScan,
    selectGroup,
    resolveLoop,
    convertToTask,
    generateReplyDraft,
    getSessionStats,
    reset
  } = useOpenLoops();

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Handle reply action
  const handleReply = async () => {
    await generateReplyDraft();
    setShowReplyModal(true);
  };

  // Handle sending reply
  const handleSendReply = async () => {
    setShowReplyModal(false);
    await resolveLoop('done');
  };

  // Handle schedule
  const handleSchedule = (date: Date) => {
    setShowScheduleModal(false);
    resolveLoop('scheduled');
  };

  // Render based on phase
  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-300/70 via-teal-200/50 to-cyan-100/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Clear Open Loops</h1>
              <p className="text-white/50 text-sm">Close what's unfinished</p>
            </div>
          </div>

          {/* Start Card */}
          <div className="rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-400/60" />
            </div>
            
            <h2 className="text-xl font-medium mb-3">Ready to Unclutter?</h2>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-8">
              We'll scan your unread messages, pending tasks, and drafts. 
              Then guide you through closing each one — no scrolling, just resolving.
            </p>

            <Button
              onClick={startScan}
              disabled={isLoading}
              className="h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-lg"
            >
              Begin Scan →
            </Button>

            <p className="text-white/30 text-xs mt-6">
              Every loop ends in: Done • Scheduled • Delegated • Archived • Ignored
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'scanning' || phase === 'compressing' || phase === 'grouping') {
    return <ScanningScreen phase={phase} />;
  }

  if (phase === 'resolving' && inventory) {
    // If we have a current loop, show the resolution card
    if (currentLoop) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white px-6 py-8">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Exit</span>
              </button>
              <span className="text-white/50 text-sm capitalize">
                {currentGroup.replace('_', ' ')}
              </span>
            </div>

            {/* Loop Card */}
            <LoopCard
              loop={currentLoop}
              currentIndex={currentLoopIndex}
              totalInGroup={currentLoops.length}
              onReply={handleReply}
              onConvertToTask={convertToTask}
              onSchedule={() => setShowScheduleModal(true)}
              onArchive={() => resolveLoop('archived')}
              onIgnore={() => resolveLoop('ignored')}
              isGeneratingDraft={isGeneratingDraft}
            />

            {/* Modals */}
            {showReplyModal && aiDraft && (
              <ReplyDraftModal
                draft={aiDraft}
                onSend={handleSendReply}
                onEdit={(newDraft) => {}}
                onClose={() => setShowReplyModal(false)}
              />
            )}

            {showScheduleModal && (
              <ScheduleModal
                onSchedule={handleSchedule}
                onClose={() => setShowScheduleModal(false)}
              />
            )}
          </div>
        </div>
      );
    }

    // No current loop - show group selector
    return (
      <LoopGroupSelector
        inventory={inventory}
        onSelectGroup={selectGroup}
        onStartQuickCloses={() => selectGroup('quick_closes')}
      />
    );
  }

  if (phase === 'complete') {
    const stats = getSessionStats();
    return (
      <ClosureScreen
        stats={stats}
        onReturnToFocus={() => navigate('/focus')}
        onExit={() => {
          reset();
          navigate('/');
        }}
      />
    );
  }

  return null;
};

export default ClearOpenLoops;
