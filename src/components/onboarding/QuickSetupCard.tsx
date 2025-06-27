
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface QuickSetupCardProps {
  onQuickSetup: () => void;
}

const QuickSetupCard = ({ onQuickSetup }: QuickSetupCardProps) => {
  return (
    <Card className="bg-white/60 backdrop-blur-md border-white/20">
      <CardContent className="pt-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">In a hurry?</p>
          <Button 
            variant="outline" 
            onClick={onQuickSetup}
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            Quick Setup (Connect All)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickSetupCard;
