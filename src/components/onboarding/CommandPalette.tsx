
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Command, 
  Search, 
  Mic, 
  MicOff,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Mail,
  Phone
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
  onSetupRequired: (platform: string, feature: string) => void;
}

const CommandPalette = ({ isOpen, onClose, onCommand, onSetupRequired }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    { 
      text: "Summarise unread email", 
      icon: <Mail className="w-4 h-4" />,
      platform: "gmail",
      description: "Get a quick overview of your inbox"
    },
    { 
      text: "Show WhatsApp messages", 
      icon: <Phone className="w-4 h-4" />,
      platform: "whatsapp",
      description: "View recent chat activity"
    },
    { 
      text: "Slack notifications summary", 
      icon: <MessageSquare className="w-4 h-4" />,
      platform: "slack",
      description: "Catch up on team conversations"
    }
  ];

  const filteredSuggestions = suggestions.filter(s => 
    s.text.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Check if command requires setup
      const suggestion = suggestions.find(s => 
        s.text.toLowerCase().includes(query.toLowerCase())
      );
      
      if (suggestion) {
        onSetupRequired(suggestion.platform, query);
      } else {
        onCommand(query);
      }
      setQuery("");
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    onSetupRequired(suggestion.platform, suggestion.text);
    onClose();
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // In a real implementation, this would start/stop speech recognition
    if (!isListening) {
      // Simulate voice input
      setTimeout(() => {
        setQuery("Summarise unread email");
        setIsListening(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4 z-50">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Command className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-800">Command Palette</span>
              <Badge variant="secondary" className="text-xs">Press Escape to close</Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try: 'Summarise unread email' or 'Show Slack notifications'"
                className="pl-10 pr-12 py-3 text-lg bg-white/50 border-white/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                  isListening ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>

            {isListening && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Listening...</span>
                </div>
              </div>
            )}

            {query && (
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Execute Command
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </form>

          {!query && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested Commands</h3>
              <div className="space-y-2">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-purple-600 group-hover:text-purple-700">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{suggestion.text}</div>
                        <div className="text-sm text-gray-500">{suggestion.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandPalette;
