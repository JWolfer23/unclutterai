import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Minus, Heart, Brain } from "lucide-react";

interface InterviewVoiceToneProps {
  onNext: (tone: string) => void;
}

const OPTIONS = [
  { 
    id: "minimal", 
    label: "Minimal & direct", 
    icon: Minus,
    description: "Short, no fluff"
  },
  { 
    id: "calm", 
    label: "Calm & supportive", 
    icon: Heart,
    description: "Encouraging, warm"
  },
  { 
    id: "analytical", 
    label: "Strategic & analytical", 
    icon: Brain,
    description: "Data-driven, precise"
  },
];

export const InterviewVoiceTone = ({ onNext }: InterviewVoiceToneProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-10">
        {/* Question */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Communication Style
          </p>
          <h2 className="text-2xl font-light text-foreground/90">
            How should I communicate with you?
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
