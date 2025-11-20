
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  Users,
  Mail,
  Star,
  Target
} from "lucide-react";

interface MissedMessage {
  id: number;
  from: string;
  subject: string;
  priority: string;
  type: string;
  time: string;
  requiresAction: boolean;
  suggestedResponse?: string;
}

interface CatchUpSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  focusDuration: string;
  missedMessages: MissedMessage[];
  focusScore: number;
}

const CatchUpSummary = ({ 
  isOpen, 
  onClose, 
  focusDuration, 
  missedMessages, 
  focusScore 
}: CatchUpSummaryProps) => {
  const [showActionPlan, setShowActionPlan] = useState(false);

  const highPriorityMessages = missedMessages.filter(m => m.priority === 'high');
  const quickActionMessages = missedMessages.filter(m => m.priority === 'medium');
  const batchMessages = missedMessages.filter(m => m.priority === 'low');
  const spamMessages = missedMessages.filter(m => !m.requiresAction);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎯';
    if (score >= 70) return '👍';
    return '💪';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <span className="text-2xl">{getScoreEmoji(focusScore)}</span>
            <span>Focus Score: {focusScore}% – {focusScore >= 90 ? 'Excellent!' : focusScore >= 70 ? 'Great job!' : 'Good effort!'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Focus Summary */}
          <Card className="glass-card bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  📩 You missed {missedMessages.length} messages total
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">🔥 {highPriorityMessages.length}</div>
                    <div className="text-sm text-gray-600">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">✅ {quickActionMessages.length}</div>
                    <div className="text-sm text-gray-600">Quick Actions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">🗂 {batchMessages.length}</div>
                    <div className="text-sm text-gray-600">Batch for Later</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">💤 {spamMessages.length}</div>
                    <div className="text-sm text-gray-600">Low Priority</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{focusDuration} focused</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Session Complete
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* High Priority Messages Preview */}
          {highPriorityMessages.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>🔥 High Priority Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {highPriorityMessages.slice(0, 3).map((message) => (
                  <div key={message.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(message.type)}
                      <span className="font-medium text-gray-900">{message.from}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 truncate">{message.subject}</p>
                      <p className="text-xs text-gray-500">{message.time}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      🔥 High Priority
                    </Badge>
                  </div>
                ))}
                {highPriorityMessages.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{highPriorityMessages.length - 3} more high priority messages
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enhanced Action Plan */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Star className="w-5 h-5 text-purple-600" />
                <span>🚀 Recommended Action Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showActionPlan ? (
                <Button 
                  onClick={() => setShowActionPlan(true)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Generate Action Plan
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✅ Immediate Actions (Next 5 mins)</span>
                    </h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Respond to {highPriorityMessages.length} high-priority messages</li>
                      <li>• Quick scan of urgent emails from key contacts</li>
                      <li>• Check for any time-sensitive requests</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2 flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>✉️ Quick Replies (Next 10 mins)</span>
                    </h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Use AI-suggested responses for routine messages</li>
                      <li>• Archive or delete non-essential notifications</li>
                      <li>• Schedule follow-ups for complex messages</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>🗂 Batch Processing (Later)</span>
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Process remaining {missedMessages.length - highPriorityMessages.length} messages in batch</li>
                      <li>• Update calendar with any new meetings or deadlines</li>
                      <li>• Review and respond to social media interactions</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Catch Up
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              <Clock className="w-4 h-4 mr-2" />
              Review Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatchUpSummary;
