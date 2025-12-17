import { Button } from "@/components/ui/button";
import { Sun } from "lucide-react";

interface InterviewCloseProps {
  onComplete: () => void;
}

export const InterviewClose = ({ onComplete }: InterviewCloseProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-12">
        {/* Confirmation text */}
        <div className="space-y-4">
          <p className="text-2xl font-light text-foreground/90 leading-relaxed">
            Understood.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            I'll handle the rest.
          </p>
        </div>

        {/* Begin Morning Brief CTA */}
        <Button
          onClick={onComplete}
          size="lg"
          className="px-8 py-6 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl shadow-lg"
        >
          <Sun className="w-5 h-5 mr-2" />
          Begin Morning Brief
        </Button>
      </div>
    </div>
  );
};
