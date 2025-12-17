import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Building2, TrendingUp, DollarSign, Heart, BookOpen, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InterviewWhatMattersProps {
  onNext: (selected: string[]) => void;
}

const OPTIONS = [
  { id: "company", label: "Company / Project", icon: Building2 },
  { id: "career", label: "Career Growth", icon: TrendingUp },
  { id: "financial", label: "Financial Expansion", icon: DollarSign },
  { id: "health", label: "Health & Energy", icon: Heart },
  { id: "learning", label: "Learning / Mastery", icon: BookOpen },
];

export const InterviewWhatMatters = ({ onNext }: InterviewWhatMattersProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  const toggleSelection = (id: string) => {
    if (id === "other") {
      setShowOther(!showOther);
      if (showOther) {
        setSelected(selected.filter(s => s !== "other"));
      }
      return;
    }

    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const handleNext = () => {
    const finalSelection = showOther && otherText 
      ? [...selected, `other:${otherText}`]
      : selected;
    onNext(finalSelection);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-10">
        {/* Question */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Priority Calibration
          </p>
          <h2 className="text-2xl font-light text-foreground/90">
            What are you building right now?
          </h2>
          <p className="text-sm text-muted-foreground">
            Select up to 3
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id);
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => toggleSelection(option.id)}
                disabled={!isSelected && selected.length >= 3}
                className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 text-left ${
                  isSelected
                    ? "bg-primary/10 border-primary/50 text-foreground"
                    : "bg-card/50 border-border/50 text-muted-foreground hover:border-border hover:bg-card/80"
                } ${!isSelected && selected.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/20" : "bg-muted/50"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}

          {/* Something Else */}
          <button
            onClick={() => toggleSelection("other")}
            className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 text-left ${
              showOther
                ? "bg-primary/10 border-primary/50 text-foreground"
                : "bg-card/50 border-border/50 text-muted-foreground hover:border-border hover:bg-card/80"
            }`}
          >
            <div className={`p-2 rounded-lg ${showOther ? "bg-primary/20" : "bg-muted/50"}`}>
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-medium">Something Else</span>
          </button>

          {showOther && (
            <Input
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="What else are you focused on?"
              className="bg-card/50 border-border/50 rounded-xl"
            />
          )}
        </div>

        {/* Continue */}
        <Button
          onClick={handleNext}
          disabled={selected.length === 0 && !showOther}
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
