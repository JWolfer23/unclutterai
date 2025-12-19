import { Mail, Reply, Calendar, Archive, X, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loop } from "@/hooks/useUnclutter";
import { useAssistantProfile } from "@/hooks/useAssistantProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BetaUCTData } from "@/hooks/useBetaUCT";

interface LoopScreenProps {
  loop: Loop;
  loopsResolved: number;
  onReply: () => void;
  onSchedule: () => void;
  onArchive: () => void;
  onIgnore: () => void;
  isGeneratingDraft: boolean;
  uctData?: BetaUCTData | null;
}

const LoopScreen = ({
  loop,
  loopsResolved,
  onReply,
  onSchedule,
  onArchive,
  onIgnore,
  isGeneratingDraft,
  uctData
}: LoopScreenProps) => {
  const { user } = useAuth();

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
      {/* Minimal progress - only shows resolved count, not total */}
      <div className="text-center mb-6 space-y-2">
        <span className="text-white/40 text-sm">
          {loopsResolved > 0 ? `${loopsResolved} resolved` : 'Focus on this one'}
        </span>
        {uctData && uctData.resolutionSpeedBoost > 1 && (
          <div className="flex items-center justify-center gap-1.5 text-cyan-400">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{uctData.resolutionSpeedBoost}x speed</span>
          </div>
        )}
      </div>

      {/* Loop card - single focused item */}
      <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
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

        {/* Instruction */}
        <p className="text-white/30 text-xs text-center">
          Choose an action to continue
        </p>

        {/* Divider */}
        <div className="border-t border-white/10 pt-4" />

        {/* Four action buttons - no skip allowed */}
        <div className="grid grid-cols-4 gap-2">
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
            <span className="text-xs">Schedule</span>
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
        </div>
      </div>
    </div>
  );
};

export default LoopScreen;
