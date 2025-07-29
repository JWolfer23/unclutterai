
import { Button } from "@/components/ui/button";
import { Sparkles, Search, LogOut, Coins } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface HeaderSectionProps {
  onShowCommandPalette: () => void;
}

const HeaderSection = ({ onShowCommandPalette }: HeaderSectionProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left: Logo + Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted/30">
              <img 
                src="/lovable-uploads/064ee60b-3850-4faa-abe4-7aefeedf9961.png" 
                alt="Unclutter Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Unclutter
            </h1>
          </div>

          {/* Center: Welcome */}
          <div className="text-center">
            <p className="text-base font-medium text-foreground">Welcome, {user?.email}</p>
            <p className="text-sm text-muted-foreground">AI Communication Assistant</p>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShowCommandPalette}
              className="text-sm"
            >
              <Search className="w-4 h-4 mr-2" />
              🔍 Search
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/crypto-integration')}
              className="text-sm"
            >
              <Coins className="w-4 h-4 mr-2" />
              ⛓️ Crypto
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              🧠 AI Compose
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              🔓 Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;
