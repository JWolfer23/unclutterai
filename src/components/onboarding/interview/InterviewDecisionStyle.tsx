import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap, LayoutList, HelpCircle, Eye } from "lucide-react";

interface InterviewDecisionStyleProps {
  onNext: (style: string) => void;
}

const OPTIONS = [
  { 
    id: "autonomous", 
    label: "Decide for me when obvious", 
    icon: Zap,
    description: "Maximum autonomy, minimal interruption"
  },
  { 
    id: "present_options", 
    label: "Present options", 
    icon: LayoutList,
    description: "Show choices, let me pick"
  },
  { 
    id: "ask_first", 
    label: "Ask before acting", 
    icon: HelpCircle,
    description: "Confirm every action"
  },
  { 
    id: "observe", 
    label: "Observe first", 
    icon: Eye,
    description: "Watch and learn before suggesting"
  },
];

export const InterviewDecisionStyle = ({ onNext }: InterviewDecisionStyleProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-10">
        {/* Question */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Decision Style
          </p>
          <h2 className="text-2xl font-light text-foreground/90">
            When something requires action, how should I behave?
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 text-left ${
                  isSelected
                    ? "bg-primary/10 border-primary/50"
                    : "bg-card/50 border-border/50 hover:border-border hover:bg-card/80"
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/20" : "bg-muted/50"}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <span className={`font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {option.label}
                  </span>
                  <p className="text-sm text-muted-foreground/70">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue */}
        <Button
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
          size="lg"
          className="w-full py-6 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};
