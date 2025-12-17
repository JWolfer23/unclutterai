import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface InterviewArrivalProps {
  onBegin: () => void;
}

export const InterviewArrival = ({ onBegin }: InterviewArrivalProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-12">
        {/* Calm, centered text */}
        <div className="space-y-4">
          <p className="text-2xl font-light text-foreground/90 leading-relaxed">
            I'm your assistant.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Before I help, I need to understand how you operate.
          </p>
        </div>

        {/* Begin CTA */}
        <Button
          onClick={onBegin}
          size="lg"
          className="px-8 py-6 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl shadow-lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Begin
        </Button>
      </div>
    </div>
  );
};
