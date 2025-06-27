
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Mail, 
  MessageSquare, 
  Phone, 
  Twitter,
  Calendar,
  FileText,
  Settings,
  Zap
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
  onSetupRequired: (platform: string, feature: string) => void;
}

const commands = [
  {
    id: "view-emails",
    title: "View Email Summary",
    description: "See your latest emails",
    icon: <Mail className="w-4 h-4" />,
    platform: "gmail",
    category: "Email"
  },
  {
    id: "view-messages",
    title: "View Messages",
    description: "Check WhatsApp and texts",
    icon: <MessageSquare className="w-4 h-4" />,
    platform: "whatsapp",
    category: "Messages"
  },
  {
    id: "view-calls",
    title: "View Missed Calls",
    description: "See recent call activity",
    icon: <Phone className="w-4 h-4" />,
    platform: "phone",
    category: "Calls"
  },
  {
    id: "view-social",
    title: "View Social Updates",
    description: "Check mentions and DMs",
    icon: <Twitter className="w-4 h-4" />,
    platform: "twitter",
    category: "Social"
  },
  {
    id: "schedule-meeting",
    title: "Schedule Meeting",
    description: "Create a calendar event",
    icon: <Calendar className="w-4 h-4" />,
    platform: "calendar",
    category: "Productivity"
  },
  {
    id: "take-notes",
    title: "Take Notes",
    description: "Open daily notes",
    icon: <FileText className="w-4 h-4" />,
    platform: "notes",
    category: "Productivity"
  }
];

const CommandPalette = ({ isOpen, onClose, onCommand, onSetupRequired }: CommandPaletteProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCommandClick = (command: typeof commands[0]) => {
    if (command.platform && ['gmail', 'whatsapp', 'twitter', 'phone'].includes(command.platform)) {
      onSetupRequired(command.platform, command.title);
    } else {
      onCommand(command.title);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4 z-50">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/50"
              autoFocus
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="space-y-1">
            {filteredCommands.map((command) => (
              <Button
                key={command.id}
                variant="ghost"
                className="w-full justify-start p-3 h-auto"
                onClick={() => handleCommandClick(command)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600">
                    {command.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{command.title}</div>
                    <div className="text-sm text-gray-500">{command.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {command.category}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
          
          {filteredCommands.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="absolute inset-0" onClick={onClose} />
    </div>
  );
};

export default CommandPalette;
