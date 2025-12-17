import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Send, Calendar, DollarSign, Trash2, Share2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface InterviewTrustBoundaryProps {
  onNext: (boundaries: Record<string, boolean>) => void;
}

const BOUNDARIES = [
  { id: "send_messages", label: "Send messages", icon: Send },
  { id: "schedule_meetings", label: "Schedule meetings", icon: Calendar },
  { id: "move_money", label: "Move money", icon: DollarSign },
  { id: "delete_content", label: "Delete content", icon: Trash2 },
  { id: "share_data", label: "Share data", icon: Share2 },
];

export const InterviewTrustBoundary = ({ onNext }: InterviewTrustBoundaryProps) => {
  const [boundaries, setBoundaries] = useState<Record<string, boolean>>(() =>
    BOUNDARIES.reduce((acc, b) => ({ ...acc, [b.id]: true }), {})
  );

  const toggleBoundary = (id: string) => {
    setBoundaries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-10">
        {/* Question */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Trust Boundary
          </p>
          <h2 className="text-2xl font-light text-foreground/90">
            What should I never do without asking?
          </h2>
          <p className="text-sm text-muted-foreground">
            Toggle on actions that require your explicit approval
          </p>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          {BOUNDARIES.map((boundary) => {
            const Icon = boundary.icon;
            const isEnabled = boundaries[boundary.id];
            return (
              <div
                key={boundary.id}
                className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                  isEnabled
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-card/50 border-border/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isEnabled ? "bg-amber-500/20" : "bg-muted/50"}`}>
                    <Icon className={`w-5 h-5 ${isEnabled ? "text-amber-500" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`font-medium ${isEnabled ? "text-foreground" : "text-muted-foreground"}`}>
                    {boundary.label}
                  </span>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleBoundary(boundary.id)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            );
          })}
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground/70">
          You can adjust these boundaries anytime in settings.
        </p>

        {/* Continue */}
        <Button
          onClick={() => onNext(boundaries)}
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
