import { useState, useRef, useCallback } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssistantIntelligence } from '@/hooks/useAssistantIntelligence';
import { useReadOnlyExecution } from '@/hooks/useReadOnlyExecution';
import { useAssistantReadOnly } from '@/contexts/AssistantReadOnlyContext';
import { ASSISTANT_VOICE } from '@/lib/assistantPersonality';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Patterns that indicate execution requests
const EXECUTION_PATTERNS = [
  { pattern: /create\s+(a\s+)?task/i, action: 'createTask' as const },
  { pattern: /add\s+(a\s+)?task/i, action: 'createTask' as const },
  { pattern: /start\s+(a\s+)?focus/i, action: 'startFocusSession' as const },
  { pattern: /begin\s+(a\s+)?session/i, action: 'startFocusSession' as const },
  { pattern: /claim\s+(my\s+)?uct/i, action: 'claimUCT' as const },
  { pattern: /send\s+(a\s+)?message/i, action: 'sendMessage' as const },
  { pattern: /reply\s+to/i, action: 'autoReply' as const },
  { pattern: /handle\s+this/i, action: 'autoReply' as const },
  { pattern: /do\s+this\s+for\s+me/i, action: 'autoReply' as const },
  { pattern: /schedule/i, action: 'scheduleAction' as const },
  { pattern: /archive/i, action: 'archiveMessage' as const },
  { pattern: /delete\s+(the\s+)?task/i, action: 'deleteTask' as const },
];

// Patterns for analysis requests
const ANALYSIS_PATTERNS = [
  { pattern: /what\s+should\s+i\s+focus/i, type: 'priorities' },
  { pattern: /priorit/i, type: 'priorities' },
  { pattern: /what.*next/i, type: 'priorities' },
  { pattern: /how\s+am\s+i\s+doing/i, type: 'stats' },
  { pattern: /my\s+stats/i, type: 'stats' },
  { pattern: /my\s+progress/i, type: 'stats' },
  { pattern: /streak/i, type: 'stats' },
  { pattern: /recommend/i, type: 'plan' },
  { pattern: /suggest/i, type: 'plan' },
  { pattern: /plan/i, type: 'plan' },
];

export const AssistantChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const { analyzeStats, suggestPriorities, explainFocusState, getContextualData, isLoading } = useAssistantIntelligence();
  const { attemptExecution, getExplanation, isReadOnly } = useReadOnlyExecution();
  const { showTooltip } = useAssistantReadOnly();

  const generateResponse = useCallback((userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const data = getContextualData;

    // Check for execution requests first
    for (const { pattern, action } of EXECUTION_PATTERNS) {
      if (pattern.test(lowerMessage)) {
        const result = attemptExecution(action, sendButtonRef.current);
        
        if (result.blocked) {
          result.showTooltip();
          
          // Provide explanation of what would happen
          const explanation = getExplanation(action);
          return `${explanation}\n\nExecution requires Operator authority. I can analyze and advise, but cannot modify state at Analyst tier.`;
        }
      }
    }

    // Check for analysis requests
    for (const { pattern, type } of ANALYSIS_PATTERNS) {
      if (pattern.test(lowerMessage)) {
        switch (type) {
          case 'priorities': {
            const priorities = suggestPriorities();
            let response = 'Based on your current state:\n\n';
            priorities.forEach((p, i) => {
              const urgencyIcon = p.urgency === 'high' ? '●' : p.urgency === 'medium' ? '○' : '·';
              response += `${urgencyIcon} ${p.title}\n  ${p.reason}\n\n`;
            });
            
            if (data.currentStreak > 0) {
              response += `\nYour ${data.currentStreak}-day streak is active. Maintaining focus today extends it.`;
            }
            return response.trim();
          }
          
          case 'stats': {
            const analysis = analyzeStats();
            return `${analysis.focusSummary}\n\n${analysis.streakStatus}\n\n${analysis.recommendations.length > 0 ? `Recommendation: ${analysis.nextAction}` : 'All metrics healthy.'}`;
          }
          
          case 'plan': {
            const analysis = analyzeStats();
            const priorities = suggestPriorities();
            
            let response = 'Recommended approach:\n\n';
            priorities.slice(0, 3).forEach((p, i) => {
              response += `${i + 1}. ${p.title}\n`;
            });
            
            if (analysis.recommendations.length > 0) {
              response += `\nNote: ${analysis.recommendations[0]}`;
            }
            return response;
          }
        }
      }
    }

    // Default contextual response
    const state = explainFocusState();
    return `${state}\n\nAsk me to analyze priorities, explain your stats, or suggest a plan.`;
  }, [analyzeStats, suggestPriorities, explainFocusState, getContextualData, attemptExecution, getExplanation]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate brief processing delay for natural feel
    setTimeout(() => {
      const response = generateResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 400);
  }, [input, isProcessing, generateResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground/90 flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary/70" />
          Assistant
          {isReadOnly && (
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              Analyst Mode
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages Area */}
        <ScrollArea className="h-48 rounded-lg bg-background/30 border border-border/20 p-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center">
                Ask about priorities, stats, or next steps.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground'
                        : 'bg-muted/50 text-foreground/90'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What should I focus on today?"
            className="flex-1 h-9 text-sm bg-background/50 border-border/30"
            disabled={isProcessing || isLoading}
          />
          <Button
            ref={sendButtonRef}
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || isLoading}
            className="h-9 w-9 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssistantChatPanel;
