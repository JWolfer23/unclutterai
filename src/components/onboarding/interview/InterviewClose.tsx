import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun } from "lucide-react";
import { TRUST_MOMENTS } from "@/lib/assistantPersonality";

interface InterviewCloseProps {
  onComplete: () => void;
}

export const InterviewClose = ({ onComplete }: InterviewCloseProps) => {
  const [showSilence, setShowSilence] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Trust Moment #1: First Silence - 2-3 second pause before showing status
  useEffect(() => {
    const silenceTimer = setTimeout(() => {
      setShowSilence(true);
    }, 2500);

    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 4000);

    return () => {
      clearTimeout(silenceTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-12">
        {/* Confirmation text */}
        <div className="space-y-4">
          <p className="text-2xl font-light text-foreground/90 leading-relaxed">
            Understood.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            I'll start with your morning brief.
          </p>
        </div>

        {/* Trust Moment #1: First Silence - appears after pause */}
        <div 
          className={`space-y-2 transition-all duration-700 ${
            showSilence ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-lg text-foreground/80">
            {TRUST_MOMENTS.firstSilence.primary}
          </p>
          <p className="text-sm text-muted-foreground">
            {TRUST_MOMENTS.firstSilence.secondary}
          </p>
        </div>

        {/* Begin Morning Brief CTA - delayed appearance */}
        <div className={`transition-all duration-500 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            onClick={onComplete}
            size="lg"
            className="px-8 py-6 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl shadow-lg"
          >
            <Sun className="w-5 h-5 mr-2" />
            Begin Your Day
          </Button>
        </div>
      </div>
    </div>
  );
};
