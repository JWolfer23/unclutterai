import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Twitter, 
  Instagram, 
  Linkedin,
  Search,
  Filter,
  Sparkles,
  CheckSquare,
  Reply,
  Archive,
  Trash2,
  Clock,
  Users,
  TrendingUp
} from "lucide-react";
import MessageCard from "@/components/MessageCard";
import AIAssistant from "@/components/AIAssistant";
import StatsOverview from "@/components/StatsOverview";
import FocusScoreCard from "@/components/FocusScoreCard";

const Index = () => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageTypeFilter, setMessageTypeFilter] = useState<string | null>(null);

  const mockMessages = [
    {
      id: 1,
      type: "email",
      from: "Sarah Chen",
      avatar: "/placeholder.svg",
      subject: "Q4 Budget Review Meeting",
      preview: "Hi team, I wanted to schedule our quarterly budget review for next week. Could everyone please...",
      time: "2 hours ago",
      priority: "high",
      platform: "Gmail",
      tasks: ["Schedule budget review", "Prepare Q4 reports"],
      sentiment: "neutral"
    },
    {
      id: 2,
      type: "text",
      from: "Alex Thompson",
      avatar: "/placeholder.svg",
      subject: "Weekend Plans",
      preview: "Hey! Are we still on for hiking this Saturday? The weather looks perfect and I found a new trail...",
      time: "4 hours ago",
      priority: "low",
      platform: "iMessage",
      tasks: [],
      sentiment: "positive"
    },
    {
      id: 3,
      type: "social",
      from: "TechCrunch",
      avatar: "/placeholder.svg",
      subject: "New AI breakthrough announced",
      preview: "Breaking: Major AI research lab announces breakthrough in language understanding...",
      time: "6 hours ago",
      priority: "medium",
      platform: "Twitter",
      tasks: ["Read full article", "Share with team"],
      sentiment: "neutral"
    },
    {
      id: 4,
      type: "voice",
      from: "Mom",
      avatar: "/placeholder.svg",
      subject: "Voice Message",
      preview: "AI Transcription: Hi honey, just wanted to check in and see how your new job is going...",
      time: "1 day ago",
      priority: "medium",
      platform: "WhatsApp",
      tasks: ["Call mom back"],
      sentiment: "positive"
    }
  ];

  const filteredMessages = mockMessages.filter(message => {
    const matchesSearch = message.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !messageTypeFilter || message.type === messageTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleMessageTypeFilter = (type: string | null) => {
    setMessageTypeFilter(type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      {/* Header */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <FocusScoreCard />
            <StatsOverview onMessageTypeFilter={handleMessageTypeFilter} />
            <AIAssistant />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Tabs */}
            <Card className="bg-white/80 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search all messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/50 border-white/20"
                    />
                  </div>
                  {messageTypeFilter && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setMessageTypeFilter(null)}
                      className="bg-purple-50 border-purple-200 text-purple-700"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-gray-100/50">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Social
                    </TabsTrigger>
                    <TabsTrigger value="voice" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Voice
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    <div className="space-y-4">
                      {filteredMessages.map((message) => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          onClick={() => setSelectedMessage(message)}
                          isSelected={selectedMessage?.id === message.id}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="mt-6">
                    <div className="space-y-4">
                      {filteredMessages.filter(m => m.type === 'email').map((message) => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          onClick={() => setSelectedMessage(message)}
                          isSelected={selectedMessage?.id === message.id}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="text" className="mt-6">
                    <div className="space-y-4">
                      {filteredMessages.filter(m => m.type === 'text').map((message) => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          onClick={() => setSelectedMessage(message)}
                          isSelected={selectedMessage?.id === message.id}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="social" className="mt-6">
                    <div className="space-y-4">
                      {filteredMessages.filter(m => m.type === 'social').map((message) => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          onClick={() => setSelectedMessage(message)}
                          isSelected={selectedMessage?.id === message.id}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="voice" className="mt-6">
                    <div className="space-y-4">
                      {filteredMessages.filter(m => m.type === 'voice').map((message) => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          onClick={() => setSelectedMessage(message)}
                          isSelected={selectedMessage?.id === message.id}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
