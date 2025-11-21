
import { Button } from "@/components/ui/button";
import { Sparkles, Search, LogOut, Coins, Menu } from "lucide-react";
import BetaTestButton from "./BetaTestButton";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoDark from "@/assets/logo-new.png";

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
        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 justify-start"
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
    <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto unclutter-header">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={logoDark} 
            alt="Unclutter AI Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="unclutter-header-title bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            Unclutter
          </h1>
          <p className="unclutter-header-subtitle hidden sm:block">AI Communication Assistant</p>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" 
              size="sm"
              onClick={onShowCommandPalette}
              className="h-9 px-3 hover:bg-white/5"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/crypto-integration')}
              className="h-9 px-3 hover:bg-white/5 hidden md:flex"
            >
              <Coins className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="h-9 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">AI Compose</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="h-9 px-3 hover:bg-white/5 hidden sm:flex"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="unclutter-header-menu">
                <Menu className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-[#05060a] border-white/10">
              <MobileMenu />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
};

export default HeaderSection;
