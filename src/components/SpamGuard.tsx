import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
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
  ChevronRight,
  Coins,
  Zap,
  Brain
} from "lucide-react";
import { useSpamGuard, SpamAnalysis } from "@/hooks/useSpamGuard";

interface SpamGuardProps {
  messages: any[];
  onMessageAction: (messageId: string, action: 'block' | 'unsubscribe' | 'safe' | 'quarantine') => void;
}

const SpamGuard = ({ messages, onMessageAction }: SpamGuardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuarantine, setShowQuarantine] = useState(false);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(true);
  
  const {
    analyzeMessage,
    analyzeMessageWithAI,
    isAnalyzing,
    blockSender,
    unsubscribeSender,
    markAsSafe,
    quarantineMessage,
    autoArchiveSpam,
    quarantinedMessages,
    senderStats,
    archivedForYou,
    totalUctFromArchiving
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
        return <ShieldX className="w-4 h-4 text-red-500" />;
      case 'phishing':
        return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'guilt_invoke':
      case 'manipulation':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'pyramid':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low-value':
      case 'promo':
        return <ShieldAlert className="w-4 h-4 text-blue-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spam':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'phishing':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'guilt_invoke':
      case 'manipulation':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'pyramid':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'suspicious':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'low-value':
      case 'promo':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'guilt_invoke': return 'Guilt Trip';
      case 'manipulation': return 'Manipulation';
      case 'pyramid': return 'MLM/Pyramid';
      case 'promo': return 'Promotional';
      case 'low-value': return 'Low Value';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const handleAction = async (message: any, action: 'block' | 'unsubscribe' | 'safe' | 'quarantine') => {
    const sender = message.sender_email || message.from;
    switch (action) {
      case 'block':
        blockSender(sender);
        break;
      case 'unsubscribe':
        unsubscribeSender(sender);
        break;
      case 'safe':
        markAsSafe(sender);
        break;
      case 'quarantine':
        quarantineMessage(message);
        break;
    }
    onMessageAction(message.id, action);
  };

  const handleAIAnalysis = async (message: any) => {
    const result = await analyzeMessageWithAI(message);
    if (result.aiResult && result.aiResult.is_spam && autoArchiveEnabled) {
      await autoArchiveSpam(message, result.aiResult);
    }
  };

  return (
    <Card className="glass-card border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-lg text-slate-100">SpamGuard+</CardTitle>
            {suspiciousMessages.length > 0 && (
              <Badge variant="destructive" className="text-xs bg-red-500/20 text-red-300 border-red-500/40">
                {suspiciousMessages.length} alerts
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200"
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
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <div className="text-sm font-medium text-emerald-300">Protected</div>
              <div className="text-xs text-emerald-400/70">{messages.length - suspiciousMessages.length} safe</div>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <ShieldAlert className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <div className="text-sm font-medium text-red-300">Flagged</div>
              <div className="text-xs text-red-400/70">{suspiciousMessages.length} suspicious</div>
            </div>
            <div className="text-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Coins className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <div className="text-sm font-medium text-purple-300">UCT Earned</div>
              <div className="text-xs text-purple-400/70">+{totalUctFromArchiving.toFixed(2)}</div>
            </div>
          </div>

          {/* Auto-Archive Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-200">Auto-archive spam (+0.02 UCT each)</span>
            </div>
            <Switch
              checked={autoArchiveEnabled}
              onCheckedChange={setAutoArchiveEnabled}
            />
          </div>

          {/* Archived For You Section */}
          {archivedForYou.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-slate-200 flex items-center space-x-2">
                <Coins className="w-4 h-4 text-purple-400" />
                <span>Archived For You</span>
                <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                  +{totalUctFromArchiving.toFixed(2)} UCT
                </Badge>
              </h4>
              <div className="text-xs text-slate-400">
                {archivedForYou.length} spam messages auto-archived
              </div>
            </div>
          )}

          {/* Suspicious Messages */}
          {suspiciousMessages.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-slate-200 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span>Suspicious Messages</span>
              </h4>
              
              {suspiciousMessages.slice(0, 3).map((message) => (
                <Alert key={message.id} className="border-orange-500/30 bg-orange-500/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getShieldIcon(message.spamAnalysis.category)}
                        <span className="font-medium text-sm text-slate-200">
                          {message.sender_name || message.from}
                        </span>
                        <Badge className={`text-xs ${getCategoryColor(message.spamAnalysis.category)}`}>
                          {getCategoryLabel(message.spamAnalysis.category)}
                        </Badge>
                      </div>
                      <AlertDescription className="text-xs text-slate-300 mb-2">
                        {message.subject}
                      </AlertDescription>
                      <div className="text-xs text-slate-400">
                        {message.spamAnalysis.confidence}% confidence • 
                        {message.spamAnalysis.reasons.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-emerald-500/20"
                        onClick={() => handleAction(message, 'safe')}
                        title="Mark as Safe"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-purple-500/20"
                        onClick={() => handleAIAnalysis(message)}
                        disabled={isAnalyzing}
                        title="AI Analyze"
                      >
                        <Brain className="w-3 h-3 text-purple-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-red-500/20"
                        onClick={() => handleAction(message, 'block')}
                        title="Block Sender"
                      >
                        <UserX className="w-3 h-3 text-red-400" />
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
              <h4 className="font-medium text-slate-200 flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Rarely Opened</span>
              </h4>
              
              {lowEngagementSenders.map((sender, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div>
                    <div className="font-medium text-sm text-slate-200">{sender.email}</div>
                    <div className="text-xs text-slate-400">
                      {sender.totalReceived} messages • {sender.opened} opened • {sender.replied} replied
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unsubscribeSender(sender.email)}
                    className="text-xs border-blue-500/40 text-blue-300 hover:bg-blue-500/20"
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
            <div className="pt-3 border-t border-slate-700/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuarantine(!showQuarantine)}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                View Quarantined ({quarantinedMessages.length})
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-3 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 mb-2">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700">
                Block Unknown Senders
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700">
                Auto-Unsubscribe
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700">
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
