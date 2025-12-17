import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Mail, Archive, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FocusBackgroundState } from '@/hooks/useFocusBackground';
import { AUTONOMOUS_REVEAL } from '@/lib/assistantPersonality';

interface AutonomousRevealProps {
  backgroundState: FocusBackgroundState;
  onReview: () => void;
  onContinue: () => void;
  hasAutonomyCapability: boolean;
}

export const AutonomousReveal = ({
  backgroundState,
  onReview,
  onContinue,
  hasAutonomyCapability,
}: AutonomousRevealProps) => {
  const [showLine1, setShowLine1] = useState(false);
  const [showLine2, setShowLine2] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const { messagesAutoHandled, messagesNeedingReview, autoActions } = backgroundState;
  const hasHandledMessages = messagesAutoHandled > 0;
  const hasNeedingReview = messagesNeedingReview.length > 0;

  // Typewriter reveal animation
  useEffect(() => {
    const timer1 = setTimeout(() => setShowLine1(true), 300);
    const timer2 = setTimeout(() => setShowLine2(true), 1800);
    const timer3 = setTimeout(() => setShowDetails(true), 2800);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // If user doesn't have autonomy capability, show upgrade prompt
  if (!hasAutonomyCapability && backgroundState.messagesArrived > 0) {
    return (
      <div className="max-w-2xl mx-auto mb-8">
        <div className="glass-card text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-slate-300 text-sm">Autonomous Actions</span>
          </div>
          
          <p className="text-white/80 mb-2">
            {backgroundState.messagesArrived} message{backgroundState.messagesArrived !== 1 ? 's' : ''} arrived while you were focused.
          </p>
          <p className="text-slate-400 text-sm mb-6">
            Stake UCT to enable automatic handling of routine messages.
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onContinue}
              className="border-white/20 hover:bg-white/5"
            >
              Continue
            </Button>
            <Button
              onClick={() => window.location.href = '/crypto'}
              className="btn-primary"
            >
              Learn About Staking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Nothing happened during session
  if (!hasHandledMessages && !hasNeedingReview) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="glass-card">
        {/* Check Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Line 1: What was handled */}
        <div className={`text-center transition-all duration-700 ${showLine1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <p className="text-xl text-white font-light">
            {hasHandledMessages 
              ? AUTONOMOUS_REVEAL.handled_multiple(messagesAutoHandled)
              : AUTONOMOUS_REVEAL.nothing_handled
            }
          </p>
        </div>

        {/* Line 2: What needs review */}
        <div className={`text-center mt-4 transition-all duration-700 delay-500 ${showLine2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {hasNeedingReview ? (
            <p className="text-lg text-slate-300">
              {messagesNeedingReview.length === 1 
                ? AUTONOMOUS_REVEAL.needs_one
                : AUTONOMOUS_REVEAL.needs_multiple(messagesNeedingReview.length)
              }
            </p>
          ) : (
            <p className="text-lg text-emerald-400/80">
              {AUTONOMOUS_REVEAL.nothing_missed}
            </p>
          )}
        </div>

        {/* Details Panel */}
        <div className={`mt-8 transition-all duration-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-slate-400">View details</span>
            {detailsExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {detailsExpanded && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* What was handled */}
              {autoActions.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Archive className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">What was handled</span>
                  </div>
                  <ul className="space-y-2">
                    {autoActions.slice(0, 5).map((action, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-400/60">•</span>
                        <span>{action.subject} <span className="text-slate-500">from {action.sender}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Why it was safe */}
              {autoActions.length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-400">Why it was safe</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {AUTONOMOUS_REVEAL.why_safe}
                  </p>
                </div>
              )}

              {/* What remains */}
              {messagesNeedingReview.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">What remains</span>
                  </div>
                  <ul className="space-y-2">
                    {messagesNeedingReview.map((msg, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <Mail className="w-3 h-3 text-amber-400/60 mt-1 flex-shrink-0" />
                        <span>{msg.subject} <span className="text-slate-500">from {msg.sender}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 mt-8 transition-all duration-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
          {hasNeedingReview && (
            <Button
              variant="outline"
              onClick={onReview}
              className="flex-1 border-white/20 hover:bg-white/5"
            >
              Review
            </Button>
          )}
          <Button
            onClick={onContinue}
            className={`${hasNeedingReview ? 'flex-1' : 'w-full'} btn-primary`}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
