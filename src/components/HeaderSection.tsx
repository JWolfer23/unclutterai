
import { Button } from "@/components/ui/button";
import { Sparkles, Search, LogOut, Coins, Menu } from "lucide-react";
import BetaTestButton from "./BetaTestButton";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderSectionProps {
  onShowCommandPalette: () => void;
}

const HeaderSection = ({ onShowCommandPalette }: HeaderSectionProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const MobileMenu = () => (
    <div className="flex flex-col space-y-3 p-4">
      <span className="text-sm text-gray-600 border-b pb-2">
        Welcome, {user?.email?.split('@')[0]}
      </span>
      <BetaTestButton />
      <Button
        variant="outline" 
        size="sm"
        onClick={() => {
          onShowCommandPalette();
          setIsMenuOpen(false);
        }}
        className="justify-start"
      >
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          navigate('/crypto-integration');
          setIsMenuOpen(false);
        }}
        className="justify-start"
      >
        <Coins className="w-4 h-4 mr-2" />
        Crypto
      </Button>
      <Button 
        size="sm" 
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 justify-start"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        AI Compose
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          handleSignOut();
          setIsMenuOpen(false);
        }}
        className="justify-start"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 border-purple-200/50 bg-white/50">
              <img 
                src="/lovable-uploads/064ee60b-3850-4faa-abe4-7aefeedf9961.png" 
                alt="Unclutter Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Unclutter
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">AI Communication Assistant</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          {!isMobile ? (
            <div className="flex items-center space-x-3 lg:space-x-6">
              <span className="hidden lg:block text-sm text-gray-600 truncate max-w-48">
                Welcome, {user?.email}
              </span>
              <div className="hidden md:block">
                <BetaTestButton />
              </div>
              <Button
                variant="outline" 
                size="sm"
                onClick={onShowCommandPalette}
                className="transition-all duration-200 hover:scale-105 hidden sm:flex"
              >
                <Search className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Search</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/crypto-integration')}
                className="transition-all duration-200 hover:scale-105 hidden md:flex"
              >
                <Coins className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Crypto</span>
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">AI Compose</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="transition-all duration-200 hover:scale-105 hidden sm:flex"
              >
                <LogOut className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            /* Mobile Menu */
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="p-2">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <MobileMenu />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;
