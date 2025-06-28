
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
  Mail
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
  const actionRequiredMessages = missedMessages.filter(m => m.requiresAction);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span>Focus Session Complete!</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Focus Score Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Focus Score</p>
                    <p className="text-2xl font-bold text-gray-900">{focusScore}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {focusDuration} focused
                  </p>
                  <Badge className="bg-green-100 text-green-800 border-green-200 mt-1">
                    Session Complete
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">While You Were Focused</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{missedMessages.length}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{highPriorityMessages.length}</div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{actionRequiredMessages.length}</div>
                  <div className="text-sm text-gray-600">Need Response</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Priority Messages */}
          {highPriorityMessages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>High Priority Messages</span>
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
                    <Badge className={getPriorityColor(message.priority)}>
                      {message.priority}
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

          {/* Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Recommended Action Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showActionPlan ? (
                <Button 
                  onClick={() => setShowActionPlan(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Generate Action Plan
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Immediate Actions (Next 5 mins)</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Respond to {highPriorityMessages.length} high-priority messages</li>
                      <li>• Quick scan of urgent emails from key contacts</li>
                      <li>• Check for any time-sensitive requests</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Quick Responses (Next 10 mins)</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Use AI-suggested responses for routine messages</li>
                      <li>• Archive or delete non-essential notifications</li>
                      <li>• Schedule follow-ups for complex messages</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">Batch Processing (Later)</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
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
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Start Catch Up
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Review Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatchUpSummary;
