import { Mail, Reply, Calendar, Archive, X, SkipForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loop, LoopAction } from "@/hooks/useUnclutter";
import { useAssistantProfile } from "@/hooks/useAssistantProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LoopScreenProps {
  loop: Loop;
  currentIndex: number;
  totalLoops: number;
  onReply: () => void;
  onSchedule: () => void;
  onArchive: () => void;
  onIgnore: () => void;
  onSkip: () => void;
  isGeneratingDraft: boolean;
}

const LoopScreen = ({
  loop,
  currentIndex,
  totalLoops,
  onReply,
  onSchedule,
  onArchive,
  onIgnore,
  onSkip,
  isGeneratingDraft
}: LoopScreenProps) => {
  const { user } = useAuth();
  const { isOperator, requiresConfirmation } = useAssistantProfile();

  // Log action approval to track patterns for promotion eligibility
  const logActionApproval = async (actionType: 'reply' | 'schedule' | 'archive') => {
    if (!user?.id) return;
    try {
      await supabase.from('ai_feedback').insert({
        user_id: user.id,
        ai_block_type: `action_approved_${actionType}`,
        thumbs_up: true,
      });
    } catch (error) {
      console.error('Failed to log action approval:', error);
    }
  };

  const handleReply = async () => {
    await logActionApproval('reply');
    onReply();
  };

  const handleSchedule = async () => {
    await logActionApproval('schedule');
    onSchedule();
  };

  const handleArchive = async () => {
    await logActionApproval('archive');
    onArchive();
  };

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* Progress indicator */}
      <div className="text-center mb-6">
        <span className="text-white/40 text-sm">
          Loop {currentIndex + 1} of {totalLoops}
        </span>
      </div>

      {/* Loop card */}
      <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 space-y-5">
        {/* Header with icon and sender */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/10 text-white/60">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-sm truncate">
              {loop.senderEmail || loop.sender}
            </p>
          </div>
        </div>

        {/* Summary - the key content */}
        <p className="text-white/90 text-lg leading-relaxed">
          "{loop.summary}"
        </p>

        {/* Divider */}
        <div className="border-t border-white/10 pt-4" />

        {/* Five action buttons */}
        <div className="grid grid-cols-5 gap-2">
          <Button
            onClick={handleReply}
            disabled={isGeneratingDraft}
            className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
          >
            {isGeneratingDraft ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Reply className="h-4 w-4" />
            )}
            <span className="text-xs">Reply</span>
          </Button>

          <Button
            onClick={handleSchedule}
            variant="ghost"
            className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-0"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Sched</span>
          </Button>

          <Button
            onClick={handleArchive}
            variant="ghost"
            className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-0"
          >
            <Archive className="h-4 w-4" />
            <span className="text-xs">Archive</span>
          </Button>

          <Button
            onClick={onIgnore}
            variant="ghost"
            className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-0"
          >
            <X className="h-4 w-4" />
            <span className="text-xs">Ignore</span>
          </Button>

          <Button
            onClick={onSkip}
            variant="ghost"
            className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-0"
          >
            <SkipForward className="h-4 w-4" />
            <span className="text-xs">Skip</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoopScreen;
