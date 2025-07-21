
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
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-200/50 bg-white/50">
              <img 
                src="/lovable-uploads/064ee60b-3850-4faa-abe4-7aefeedf9961.png" 
                alt="Unclutter Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Unclutter
              </h1>
              <p className="text-sm text-gray-500">AI Communication Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShowCommandPalette}
              className="transition-all duration-200 hover:scale-105"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/crypto-integration')}
              className="transition-all duration-200 hover:scale-105"
            >
              <Coins className="w-4 h-4 mr-2" />
              Crypto
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Compose
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="transition-all duration-200 hover:scale-105"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;
