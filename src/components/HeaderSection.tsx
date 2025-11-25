import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Search, LogOut, Coins, Menu } from "lucide-react";

import BetaTestButton from "./BetaTestButton";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import logoDark from "@/assets/logo-new.png";
import { fadeInUp } from "@/ui/styles";

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
    <div className="flex flex-col space-y-3 p-4 pt-6">
      <span className="text-sm text-slate-300 border-b border-white/10 pb-2">
        Welcome, <span className="font-semibold">{user?.email?.split("@")[0]}</span>
      </span>

      <BetaTestButton />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onShowCommandPalette();
          setIsMenuOpen(false);
        }}
        className="justify-start text-slate-100 hover:bg-white/5"
      >
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          navigate("/crypto-integration");
          setIsMenuOpen(false);
        }}
        className="justify-start text-slate-100 hover:bg-white/5"
      >
        <Coins className="w-4 h-4 mr-2" />
        Crypto
      </Button>

      <Button
        size="sm"
        className="justify-start h-9 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        AI Compose
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          handleSignOut();
          setIsMenuOpen(false);
        }}
        className="justify-start text-slate-200 hover:bg-white/5"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-7xl mx-auto unclutter-header ${fadeInUp}`}>
        {/* Logo */}
        <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 flex items-center justify-center">
          <img
            src={logoDark}
            alt="UnclutterAI Logo"
            className="w-6 h-6 object-contain"
          />
        </div>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="unclutter-header-title text-[#A855F7]">
            unclutterAI
          </h1>
          <p className="unclutter-header-subtitle hidden sm:block">
            Less Noise. More Clarity. One App.
          </p>
        </div>

        {/* Desktop actions */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowCommandPalette}
              className="h-9 px-3 text-slate-100 hover:bg-white/8"
            >
              <Search className="w-4 h-4 mr-1" />
              <span className="hidden md:inline text-xs opacity-70">Search</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/crypto-integration")}
              className="h-9 px-3 text-slate-100 hover:bg-white/8 hidden md:flex"
            >
              <Coins className="w-4 h-4 mr-1" />
              <span className="text-xs opacity-80">UCT / Crypto</span>
            </Button>

            <Button
              size="sm"
              className="h-9 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-md shadow-purple-500/30"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">AI Compose</span>
              <span className="inline lg:hidden text-xs">Compose</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-9 px-3 text-slate-200 hover:bg-white/8 hidden sm:flex"
            >
              <LogOut className="w-4 h-4 mr-1" />
            </Button>
          </div>
        )}

        {/* Mobile menu trigger */}
        {isMobile && (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="unclutter-header-menu">
                <Menu className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="
                w-80
                bg-black/85
                border-l border-white/10
                backdrop-blur-2xl
                text-slate-50
              "
            >
              <MobileMenu />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
};

export default HeaderSection;
