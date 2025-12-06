import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Coins, Zap, Flame, Trophy, Star, Sparkles } from "lucide-react";
import { TIER_DATA, LEVEL_THRESHOLDS } from "@/lib/focusMicroCopy";

interface FocusSystemExplainerModalProps {
  trigger?: React.ReactNode;
}

export const FocusSystemExplainerModal = ({ trigger }: FocusSystemExplainerModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-purple-400 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How it works</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-white/10">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            How Rewards, Levels & Tiers Work
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-6 pt-4">
            
            {/* Section 1: UCT Rewards */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                  <Coins className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">UCT Rewards</h3>
              </div>
              <div className="pl-10 space-y-2 text-sm text-slate-300">
                <p>Earn <span className="text-cyan-400 font-medium">UCT (Unclutter Tokens)</span> by completing focus sessions.</p>
                <p className="text-slate-400">Longer sessions = more UCT.</p>
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-2">Bonus multipliers:</p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    <li>• Mode difficulty (Learning +30%, Career +20%)</li>
                    <li>• Streak consistency (daily bonus)</li>
                    <li>• Weekly tier (up to +20%)</li>
                    <li>• Focus level (passive boost)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            {/* Section 2: Levels */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Levels & XP</h3>
              </div>
              <div className="pl-10 space-y-2 text-sm text-slate-300">
                <p>Earn <span className="text-purple-400 font-medium">XP</span> every session. Higher levels unlock small UCT multipliers + cosmetic titles.</p>
                
                <div className="mt-3 space-y-2">
                  {LEVEL_THRESHOLDS.map((level) => (
                    <div 
                      key={level.range}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-medium text-white">{level.title}</span>
                      </div>
                      <span className="text-xs text-slate-500">Lv. {level.range}</span>
                    </div>
                  ))}
                </div>

                {/* Example XP Bar */}
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
                  <p className="text-xs text-slate-400 mb-2">Example: Level 7 → 8</p>
                  <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                      style={{ width: '65%' }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">4,900 / 6,400 XP</p>
                </div>
              </div>
            </section>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

            {/* Section 3: Streaks */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="font-semibold text-white">Streaks</h3>
              </div>
              <div className="pl-10 space-y-2 text-sm text-slate-300">
                <p>Your streak increases every day you complete at least one focus session.</p>
                <p className="text-slate-400">Streaks improve XP and UCT gains.</p>
                <p className="text-orange-400 text-xs mt-2">🔥 7+ day streaks unlock higher multipliers.</p>
              </div>
            </section>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

            {/* Section 4: Weekly Tiers */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="font-semibold text-white">Weekly Tiers</h3>
              </div>
              <div className="pl-10 space-y-2 text-sm text-slate-300">
                <p>Earn tier status based on total sessions this week:</p>
                
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {TIER_DATA.map((tier) => (
                    <div 
                      key={tier.name}
                      className="flex items-center justify-between p-2 rounded-lg border"
                      style={{ 
                        backgroundColor: `${tier.color}10`,
                        borderColor: `${tier.color}30`
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" style={{ color: tier.color }} />
                        <span className="text-xs font-medium" style={{ color: tier.color }}>
                          {tier.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">+{tier.bonusPercent}%</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-slate-400 mt-2">Each tier gives a UCT multiplier for the rest of the week.</p>
              </div>
            </section>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Section 5: Summary */}
            <section className="space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-cyan-500/5 to-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-center text-slate-200 leading-relaxed">
                  "UnclutterAI rewards <span className="text-purple-400 font-medium">consistency</span>, not perfection. 
                  The more often you show up, the more powerful your digital assistant becomes."
                </p>
              </div>
            </section>

            {/* Close Button */}
            <Button 
              onClick={() => setOpen(false)} 
              className="w-full btn-primary"
            >
              Got it!
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
