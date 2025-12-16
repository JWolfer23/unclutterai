import { Globe, Briefcase, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IntelligenceData } from "@/hooks/useMorningBrief";

interface IntelligenceScreenProps {
  intelligence: IntelligenceData;
  onContinue: () => void;
}

export const IntelligenceScreen = ({
  intelligence,
  onContinue,
}: IntelligenceScreenProps) => {
  return (
    <div className="flex flex-col min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-semibold text-white/95 mb-2">What You Should Know</h2>
        <p className="text-white/50">Assistant-selected intelligence</p>
      </div>

      {/* Intelligence Cards */}
      <div className="flex-1 space-y-5 max-w-lg mx-auto w-full">
        {/* Market / World */}
        {intelligence.market && intelligence.market.length > 0 && (
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-white/80 font-medium">Market & World</h3>
            </div>
            <ul className="space-y-3">
              {intelligence.market.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-white/70 text-sm leading-relaxed"
                >
                  <span className="text-cyan-400/60 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Personal / Industry */}
        {intelligence.personal && (
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-white/80 font-medium">Personal Relevance</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {intelligence.personal}
            </p>
          </div>
        )}

        {/* Learning (optional) */}
        {intelligence.learning && (
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white/80 font-medium">Learning Insight</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {intelligence.learning}
            </p>
          </div>
        )}

        {/* Empty state */}
        {(!intelligence.market?.length && !intelligence.personal) && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No new intelligence today</p>
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="flex justify-center mt-8">
        <Button
          onClick={onContinue}
          className="
            px-8 py-5
            bg-gradient-to-r from-cyan-500/80 to-blue-500/80
            hover:from-cyan-400/90 hover:to-blue-400/90
            text-white border-0
            rounded-full
            shadow-[0_0_20px_rgba(6,182,212,0.3)]
            hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]
            transition-all duration-300
          "
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
