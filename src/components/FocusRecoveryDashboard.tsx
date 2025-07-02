
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Mail, 
  MessageSquare, 
  User, 
  Instagram,
  Mic,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
  Star
} from "lucide-react";

interface Message {
  id: number;
  from: string;
  subject: string;
  preview: string;
  platform: 'email' | 'social' | 'messaging' | 'voicemail';
  time: string;
  timestamp: Date;
  priority: 'high' | 'quick' | 'batch' | 'spam';
  requiresAction: boolean;
  suggestedResponse?: string;
  platformIcon: string;
}

interface FocusRecoveryData {
  focusScore: number;
  totalMissed: number;
  breakdown: {
    high: number;
    quick: number;
    batch: number;
    spam: number;
  };
  platformBreakdown: Record<string, number>;
  actionPlan: {
    immediate: string[];
    quickReplies: string[];
    batchLater: string[];
  };
  highPriorityPreview: Message[];
}

interface FocusRecoveryDashboardProps {
  data: FocusRecoveryData;
  focusDuration: string;
  onStartCatchUp: () => void;
  onReviewLater: () => void;
}

const FocusRecoveryDashboard = ({ 
  data, 
  focusDuration, 
  onStartCatchUp, 
  onReviewLater 
}: FocusRecoveryDashboardProps) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'social':
        return <User className="w-4 h-4" />;
      case 'messaging':
        return <MessageSquare className="w-4 h-4" />;
      case 'voicemail':
        return <Mic className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'quick':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'batch':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'spam':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎯';
    if (score >= 70) return '👍';
    return '💪';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header with Focus Score */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-3xl">{getScoreEmoji(data.focusScore)}</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Focus Score: <span className={getScoreColor(data.focusScore)}>{data.focusScore}%</span>
              </h1>
            </div>
            <p className="text-gray-600">
              {data.focusScore >= 90 ? 'Excellent job staying focused!' : 
               data.focusScore >= 70 ? 'Good focus session!' : 
               'Room for improvement next time!'} 
              {' '}You focused for {focusDuration}.
            </p>
          </div>

          {/* Message Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-gray-900">{data.totalMissed}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">🔥 {data.breakdown.high}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">✅ {data.breakdown.quick}</div>
              <div className="text-sm text-gray-600">Quick Actions</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">🗂 {data.breakdown.batch}</div>
              <div className="text-sm text-gray-600">Batch Later</div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.platformBreakdown).map(([platform, count]) => (
              <div key={platform} className="flex items-center space-x-2 p-2 bg-white rounded-lg border">
                {getPlatformIcon(platform)}
                <span className="text-sm font-medium capitalize">{platform}</span>
                <Badge variant="secondary" className="ml-auto">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* High Priority Preview */}
      {data.highPriorityPreview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>High Priority Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.highPriorityPreview.map((message) => (
              <div key={message.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(message.platform)}
                    <span className="font-medium text-gray-900">{message.from}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{message.subject}</p>
                    <p className="text-xs text-gray-600 mt-1">{message.preview}</p>
                    <p className="text-xs text-gray-500 mt-1">{message.time}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    🔥 High Priority
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 3-Part Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-purple-600" />
            <span>🚀 Action Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Immediate Actions */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-3 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>✅ Immediate (takes &lt; 5 min)</span>
            </h4>
            <ul className="space-y-2">
              {data.actionPlan.immediate.map((action, index) => (
                <li key={index} className="text-sm text-red-800 flex items-start space-x-2">
                  <span>•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Replies */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>✉️ Quick Replies (takes &lt; 10 min)</span>
            </h4>
            <ul className="space-y-2">
              {data.actionPlan.quickReplies.map((action, index) => (
                <li key={index} className="text-sm text-orange-800 flex items-start space-x-2">
                  <span>•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Batch Later */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>🗂 Batch Items for Later (non-urgent)</span>
            </h4>
            <ul className="space-y-2">
              {data.actionPlan.batchLater.map((action, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                  <span>•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button 
          onClick={onStartCatchUp}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          size="lg"
        >
          <Zap className="w-4 h-4 mr-2" />
          Start Catch Up
        </Button>
        <Button 
          variant="outline" 
          onClick={onReviewLater}
          className="flex-1"
          size="lg"
        >
          <Clock className="w-4 h-4 mr-2" />
          Review Later
        </Button>
      </div>
    </div>
  );
};

export default FocusRecoveryDashboard;
