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
  Target,
  Loader2,
  Send,
  Calendar
} from "lucide-react";
import { useActionPlan, ActionPlan } from "@/hooks/useActionPlan";

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
  const { 
    actionPlan, 
    isGenerating, 
    generateActionPlan,
    claimTask,
    completeTask,
    isClaiming 
  } = useActionPlan();

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-white">
            <span className="text-2xl">{getScoreEmoji(focusScore)}</span>
            <span>Focus Score: {focusScore}% – {focusScore >= 90 ? 'Excellent!' : focusScore >= 70 ? 'Great job!' : 'Good effort!'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Focus Summary */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/30">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold text-white mb-2">
                  📩 You missed {missedMessages.length} messages total
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">🔥 {highPriorityMessages.length}</div>
                    <div className="text-sm text-slate-400">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">✅ {quickActionMessages.length}</div>
                    <div className="text-sm text-slate-400">Quick Actions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">🗂 {batchMessages.length}</div>
                    <div className="text-sm text-slate-400">Batch for Later</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-400">💤 {spamMessages.length}</div>
                    <div className="text-sm text-slate-400">Low Priority</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{focusDuration} focused</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Session Complete
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Action Plan Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-white">🚀 AI Action Plan</span>
                </div>
                {!actionPlan && (
                  <Button 
                    onClick={() => generateActionPlan()}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Target className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Action Plan'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionPlan ? (
                <div className="space-y-4">
                  {/* UCT Reward */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🪙</span>
                      <div>
                        <div className="text-white font-semibold">+{actionPlan.uct_reward_estimate.toFixed(1)} UCT Earned</div>
                        <div className="text-xs text-slate-400">{actionPlan.messages_processed} messages analyzed</div>
                      </div>
                    </div>
                  </div>

                  {/* Urgent Tasks */}
                  {actionPlan.urgent_tasks.length > 0 && (
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                      <h4 className="font-medium text-red-300 mb-2 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✅ Immediate Actions ({actionPlan.urgent_tasks.length})</span>
                      </h4>
                      <ul className="text-sm text-red-200 space-y-2">
                        {actionPlan.urgent_tasks.map((task, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span>• {task.title}</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500/50 text-red-300 h-7"
                              onClick={() => task.id && claimTask(task.id)}
                              disabled={isClaiming || !task.id}
                            >
                              Claim
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Quick Wins */}
                  {actionPlan.quick_wins.length > 0 && (
                    <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <h4 className="font-medium text-emerald-300 mb-2 flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>⚡ Quick Wins ({actionPlan.quick_wins.length})</span>
                      </h4>
                      <ul className="text-sm text-emerald-200 space-y-2">
                        {actionPlan.quick_wins.slice(0, 5).map((task, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span>• {task.title}</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-500/50 text-emerald-300 h-7"
                              onClick={() => task.id && completeTask(task.id)}
                              disabled={!task.id}
                            >
                              Do Now
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Auto Replies */}
                  {actionPlan.auto_replies.length > 0 && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <h4 className="font-medium text-blue-300 mb-2 flex items-center space-x-2">
                        <Send className="w-4 h-4" />
                        <span>✉️ Ready to Send ({actionPlan.auto_replies.length})</span>
                      </h4>
                      <p className="text-sm text-blue-200">
                        {actionPlan.auto_replies.length} AI-drafted replies ready for review
                      </p>
                    </div>
                  )}

                  {/* Batch Recommendations */}
                  {actionPlan.batch_recommendations.length > 0 && (
                    <div className="p-4 bg-slate-500/10 rounded-lg border border-slate-500/30">
                      <h4 className="font-medium text-slate-300 mb-2 flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>🗂 Batch Processing</span>
                      </h4>
                      <ul className="text-sm text-slate-200 space-y-1">
                        {actionPlan.batch_recommendations.map((batch, idx) => (
                          <li key={idx}>• {batch.goal} ({batch.batch_size} items)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">
                    Generate an AI-powered action plan to prioritize your catch-up
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* High Priority Messages Preview */}
          {highPriorityMessages.length > 0 && !actionPlan && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2 text-white">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>🔥 High Priority Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {highPriorityMessages.slice(0, 3).map((message) => (
                  <div key={message.id} className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(message.type)}
                      <span className="font-medium text-white">{message.from}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 truncate">{message.subject}</p>
                      <p className="text-xs text-slate-500">{message.time}</p>
                    </div>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                      🔥 High Priority
                    </Badge>
                  </div>
                ))}
                {highPriorityMessages.length > 3 && (
                  <p className="text-sm text-slate-500 text-center">
                    +{highPriorityMessages.length - 3} more high priority messages
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Catch Up
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
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
