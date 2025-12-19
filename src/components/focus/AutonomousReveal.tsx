import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Mail, Archive, AlertCircle, Shield, History, Clock, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FocusBackgroundState } from '@/hooks/useFocusBackground';
import { AUTONOMOUS_REVEAL, TRUST_MOMENTS } from '@/lib/assistantPersonality';
import { FocusSummary, QueuedItem } from '@/hooks/useFocusProtection';

interface AutonomousRevealProps {
  backgroundState: FocusBackgroundState;
  focusSummary?: FocusSummary;
  onReview: () => void;
  onContinue: () => void;
  hasAutonomyCapability: boolean;
}

export const AutonomousReveal = ({
  backgroundState,
  focusSummary,
  onReview,
  onContinue,
  hasAutonomyCapability,
}: AutonomousRevealProps) => {
  const navigate = useNavigate();
  const [showShield, setShowShield] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showReassurance, setShowReassurance] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const { messagesAutoHandled, messagesNeedingReview, autoActions, messagesArrived } = backgroundState;
  
  // Combine background state with focus summary for complete picture
  const totalItemsReceived = (focusSummary?.itemsReceived || 0) + messagesArrived;
  const totalItemsHandled = (focusSummary?.itemsHandled || 0) + messagesAutoHandled;
  const totalDeferred = focusSummary?.queuedItems?.filter(i => !i.handled).length || 0;
  const totalNeedingAttention = totalDeferred + messagesNeedingReview.length;
  
  const deferredItems = focusSummary?.queuedItems?.filter(i => !i.handled) || [];
  
  const hasHandledMessages = totalItemsHandled > 0;
  const hasNeedingReview = totalNeedingAttention > 0;

  // Calm, sequential reveal animation
  useEffect(() => {
    const timer1 = setTimeout(() => setShowShield(true), 200);
    const timer2 = setTimeout(() => setShowStats(true), 800);
    const timer3 = setTimeout(() => setShowReassurance(true), 1800);
    const timer4 = setTimeout(() => setShowDetails(true), 2600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="glass-card">
        {/* Shield Icon - Focus Protection Complete */}
        <div className={`flex justify-center mb-8 transition-all duration-700 ${showShield ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="relative">
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-emerald-500/10 blur-xl" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Summary: What arrived, What was deferred, What needs attention */}
        <div className={`transition-all duration-700 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {totalItemsReceived > 0 ? (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* What arrived */}
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-center mb-2">
                  <Inbox className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-2xl font-light text-white">{totalItemsReceived}</div>
                <div className="text-xs text-slate-500 mt-1">arrived</div>
              </div>
              
              {/* What was deferred */}
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-center mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-light text-blue-400">{totalDeferred}</div>
                <div className="text-xs text-slate-500 mt-1">deferred</div>
              </div>
              
              {/* What needs attention */}
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-center mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-2xl font-light text-amber-400">{totalNeedingAttention}</div>
                <div className="text-xs text-slate-500 mt-1">need attention</div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <p className="text-lg text-slate-300 font-light">No interruptions during your session.</p>
            </div>
          )}
        </div>

        {/* CRITICAL REASSURANCE - "Nothing important was missed." */}
        <div className={`text-center mb-8 transition-all duration-700 ${showReassurance ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <p className="text-2xl text-emerald-400 font-light tracking-wide">
            {TRUST_MOMENTS.focusProtection.primary}
          </p>
          {totalItemsReceived > 0 && (
            <p className="text-sm text-slate-500 mt-2">
              {hasHandledMessages 
                ? `${totalItemsHandled} handled silently. ${totalDeferred > 0 ? `${totalDeferred} deferred for later.` : ''}`
                : 'All items deferred until you were ready.'
              }
            </p>
          )}
        </div>

        {/* Expandable Details */}
        <div className={`transition-all duration-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
          {(deferredItems.length > 0 || autoActions.length > 0 || messagesNeedingReview.length > 0) && (
            <>
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
                  {/* What was deferred silently */}
                  {deferredItems.length > 0 && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">What was deferred</span>
                      </div>
                      <ul className="space-y-2">
                        {deferredItems.slice(0, 5).map((item, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-blue-400/60">•</span>
                            <span>{item.title} {item.sender && <span className="text-slate-500">from {item.sender}</span>}</span>
                          </li>
                        ))}
                        {deferredItems.length > 5 && (
                          <li className="text-sm text-slate-500">+{deferredItems.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* What was handled automatically */}
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
                  {(autoActions.length > 0 || deferredItems.length > 0) && (
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

                  {/* Link to What I Handled */}
                  {autoActions.length > 0 && (
                    <button
                      onClick={() => navigate('/what-handled')}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-slate-400 hover:text-white"
                    >
                      <History className="w-4 h-4" />
                      See all handled items
                    </button>
                  )}

                  {/* What needs attention */}
                  {messagesNeedingReview.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">What needs attention</span>
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
            </>
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
              Review Items
            </Button>
          )}
          <Button
            onClick={onContinue}
            className={`${hasNeedingReview ? 'flex-1' : 'w-full'} h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white`}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
