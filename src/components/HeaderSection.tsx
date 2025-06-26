
import { Button } from "@/components/ui/button";
import { Filter, Sparkles, Command } from "lucide-react";

interface HeaderSectionProps {
  onShowCommandPalette: () => void;
}

const HeaderSection = ({ onShowCommandPalette }: HeaderSectionProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-200/50 bg-white/50">
              <img 
                src="/lovable-uploads/0ae5b11c-a621-4394-9a31-569e17849685.png" 
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
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShowCommandPalette}
            >
              <Command className="w-4 h-4 mr-2" />
              Command
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Compose
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;
