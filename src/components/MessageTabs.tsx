
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Twitter,
  Search,
  Users
} from "lucide-react";
import MessageCard from "@/components/MessageCard";

interface Message {
  id: number;
  type: string;
  from: string;
  avatar: string;
  subject: string;
  preview: string;
  time: string;
  priority: string;
  platform: string;
  tasks: string[];
  sentiment: string;
}

interface MessageTabsProps {
  messages: Message[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  messageTypeFilter: string | null;
  onClearFilter: () => void;
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
}

const MessageTabs = ({
  messages,
  searchQuery,
  onSearchChange,
  messageTypeFilter,
  onClearFilter,
  selectedMessage,
  onSelectMessage
}: MessageTabsProps) => {
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !messageTypeFilter || message.type === messageTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const renderMessageList = (filterType?: string) => {
    const messagesToShow = filterType 
      ? filteredMessages.filter(m => m.type === filterType)
      : filteredMessages;

    return (
      <div className="space-y-4">
        {messagesToShow.map((message) => (
          <div key={message.id} id={`message-${message.id}`}>
            <MessageCard
              message={message}
              onClick={() => onSelectMessage(message)}
              isSelected={selectedMessage?.id === message.id}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search all messages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/50 border-white/20"
            />
          </div>
          {messageTypeFilter && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilter}
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
            {renderMessageList()}
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            {renderMessageList('email')}
          </TabsContent>

          <TabsContent value="text" className="mt-6">
            {renderMessageList('text')}
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            {renderMessageList('social')}
          </TabsContent>

          <TabsContent value="voice" className="mt-6">
            {renderMessageList('voice')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MessageTabs;
