
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  AlertTriangle,
  Trash2,
  UserX,
  MailX,
  Eye,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useSpamGuard } from "@/hooks/useSpamGuard";

interface SpamGuardProps {
  messages: any[];
  onMessageAction: (messageId: number, action: 'block' | 'unsubscribe' | 'safe' | 'quarantine') => void;
}

const SpamGuard = ({ messages, onMessageAction }: SpamGuardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuarantine, setShowQuarantine] = useState(false);
  
  const {
    analyzeMessage,
    blockSender,
    unsubscribeSender,
    markAsSafe,
    quarantineMessage,
    quarantinedMessages,
    senderStats
  } = useSpamGuard();

  // Analyze all messages for potential threats
  const analyzedMessages = messages.map(message => ({
    ...message,
    spamAnalysis: analyzeMessage(message)
  }));

  const suspiciousMessages = analyzedMessages.filter(m => m.spamAnalysis.isSpam || m.spamAnalysis.confidence > 30);
  const lowEngagementSenders = Array.from(senderStats.values())
    .filter(stats => stats.totalReceived > 3 && (stats.opened + stats.replied) / stats.totalReceived < 0.2)
    .slice(0, 5);

  const getShieldIcon = (category: string) => {
    switch (category) {
      case 'spam':
        return <ShieldX className="w-4 h-4 text-red-600" />;
      case 'phishing':
        return <ShieldAlert className="w-4 h-4 text-orange-600" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low-value':
        return <ShieldAlert className="w-4 h-4 text-blue-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-green-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spam':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'phishing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low-value':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const handleAction = (message: any, action: 'block' | 'unsubscribe' | 'safe' | 'quarantine') => {
    switch (action) {
      case 'block':
        blockSender(message.from);
        break;
      case 'unsubscribe':
        unsubscribeSender(message.from);
        break;
      case 'safe':
        markAsSafe(message.from);
        break;
      case 'quarantine':
        quarantineMessage(message);
        break;
    }
    onMessageAction(message.id, action);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Message Shield</CardTitle>
            {suspiciousMessages.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {suspiciousMessages.length} alerts
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Threat Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-green-800">Protected</div>
              <div className="text-xs text-green-600">{messages.length - suspiciousMessages.length} safe</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-red-800">Flagged</div>
              <div className="text-xs text-red-600">{suspiciousMessages.length} suspicious</div>
            </div>
          </div>

          {/* Suspicious Messages */}
          {suspiciousMessages.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span>Suspicious Messages</span>
              </h4>
              
              {suspiciousMessages.slice(0, 3).map((message) => (
                <Alert key={message.id} className="border-orange-200 bg-orange-50/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getShieldIcon(message.spamAnalysis.category)}
                        <span className="font-medium text-sm">{message.from}</span>
                        <Badge className={`text-xs ${getCategoryColor(message.spamAnalysis.category)}`}>
                          {message.spamAnalysis.category}
                        </Badge>
                      </div>
                      <AlertDescription className="text-xs mb-2">
                        {message.subject}
                      </AlertDescription>
                      <div className="text-xs text-gray-600">
                        Confidence: {message.spamAnalysis.confidence}% • 
                        {message.spamAnalysis.reasons.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleAction(message, 'safe')}
                      >
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleAction(message, 'block')}
                      >
                        <UserX className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* Low Engagement Senders */}
          {lowEngagementSenders.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Rarely Opened</span>
              </h4>
              
              {lowEngagementSenders.map((sender, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{sender.email}</div>
                    <div className="text-xs text-gray-600">
                      {sender.totalReceived} messages • {sender.opened} opened • {sender.replied} replied
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unsubscribeSender(sender.email)}
                    className="text-xs"
                  >
                    <MailX className="w-3 h-3 mr-1" />
                    Unsubscribe
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Quarantine Summary */}
          {quarantinedMessages.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuarantine(!showQuarantine)}
                className="text-sm text-gray-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                View Quarantined ({quarantinedMessages.length})
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                Block Unknown Senders
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                Auto-Unsubscribe
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                Weekly Summary
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SpamGuard;
