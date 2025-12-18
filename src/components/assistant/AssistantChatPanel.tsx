import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssistantIntelligence } from '@/hooks/useAssistantIntelligence';
import { useReadOnlyExecution } from '@/hooks/useReadOnlyExecution';
import { useAssistantReadOnly } from '@/contexts/AssistantReadOnlyContext';
import { ENABLE_ASSISTANT_STREAMING } from '@/config/flags';

// Safe mode configuration
const ASSISTANT_CONFIG = {
  mode: 'analyst' as const,
  streaming: false,
  requestMode: 'manual' as const,
  hardTimeoutMs: 8000, // Hard timeout - abort after 8 seconds
};

const TIMEOUT_FALLBACK_MESSAGE = "I'm ready, but couldn't reach my reasoning engine just now. Try again.";
const FALLBACK_MESSAGE = "I'm unable to process that request right now. Try asking about your priorities or stats.";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  isStreaming?: boolean; // Track if message is currently streaming
}

// Streaming message renderer component
const StreamingMessage = ({ 
  content, 
  onComplete 
}: { 
  content: string; 
  onComplete: () => void;
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [streamFailed, setStreamFailed] = useState(false);

  useEffect(() => {
    if (!ENABLE_ASSISTANT_STREAMING || streamFailed) {
      // Fallback: show full content immediately
      setDisplayedContent(content);
      onComplete();
      return;
    }

    let index = 0;
    const streamInterval = setInterval(() => {
      try {
        if (index < content.length) {
          // Stream ~3 characters at a time for smoother effect
          const chunkSize = Math.min(3, content.length - index);
          setDisplayedContent(content.slice(0, index + chunkSize));
          index += chunkSize;
        } else {
          clearInterval(streamInterval);
          onComplete();
        }
      } catch (error) {
        console.error('Streaming render failed, falling back:', error);
        setStreamFailed(true);
        setDisplayedContent(content);
        clearInterval(streamInterval);
        onComplete();
      }
    }, 20); // ~50 updates/sec for smooth streaming

    return () => clearInterval(streamInterval);
  }, [content, onComplete, streamFailed]);

  return <p className="whitespace-pre-wrap">{displayedContent}</p>;
};

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

  // Safe access to hooks - never block on loading
  const intelligence = useAssistantIntelligence();
  const readOnlyExecution = useReadOnlyExecution();
  const readOnlyContext = useAssistantReadOnly();

  // Safe getters with fallbacks - hooks may still be loading
  const getContextualData = intelligence?.getContextualData ?? {
    focusMinutesToday: 0,
    focusMinutesWeek: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyTier: 'bronze',
    pendingTasks: 0,
    totalSessions: 0,
  };

  const generateResponse = useCallback((userMessage: string): string => {
    try {
      const lowerMessage = userMessage.toLowerCase();

      // Check for execution requests first (analyst mode blocks execution)
      for (const { pattern, action } of EXECUTION_PATTERNS) {
        if (pattern.test(lowerMessage)) {
          if (readOnlyExecution?.attemptExecution) {
            const result = readOnlyExecution.attemptExecution(action, sendButtonRef.current);
            
            if (result.blocked) {
              result.showTooltip();
              const explanation = readOnlyExecution.getExplanation?.(action) ?? 'This action requires elevated permissions.';
              return `${explanation}\n\nExecution requires Operator authority. I can analyze and advise, but cannot modify state at Analyst tier.`;
            }
          } else {
            // Fallback if hook not ready
            return `This action requires Operator authority. Currently operating in Analyst mode.`;
          }
        }
      }

      // Check for analysis requests
      for (const { pattern, type } of ANALYSIS_PATTERNS) {
        if (pattern.test(lowerMessage)) {
          switch (type) {
            case 'priorities': {
              if (!intelligence?.suggestPriorities) {
                return 'Priority analysis is loading. Try again in a moment.';
              }
              const priorities = intelligence.suggestPriorities();
              let response = 'Based on your current state:\n\n';
              priorities.forEach((p) => {
                const urgencyIcon = p.urgency === 'high' ? '●' : p.urgency === 'medium' ? '○' : '·';
                response += `${urgencyIcon} ${p.title}\n  ${p.reason}\n\n`;
              });
              
              if (getContextualData.currentStreak > 0) {
                response += `\nYour ${getContextualData.currentStreak}-day streak is active. Maintaining focus today extends it.`;
              }
              return response.trim();
            }
            
            case 'stats': {
              if (!intelligence?.analyzeStats) {
                return 'Stats analysis is loading. Try again in a moment.';
              }
              const analysis = intelligence.analyzeStats();
              return `${analysis.focusSummary}\n\n${analysis.streakStatus}\n\n${analysis.recommendations.length > 0 ? `Recommendation: ${analysis.nextAction}` : 'All metrics healthy.'}`;
            }
            
            case 'plan': {
              if (!intelligence?.analyzeStats || !intelligence?.suggestPriorities) {
                return 'Plan generation is loading. Try again in a moment.';
              }
              const analysis = intelligence.analyzeStats();
              const priorities = intelligence.suggestPriorities();
              
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
      if (intelligence?.explainFocusState) {
        const state = intelligence.explainFocusState();
        return `${state}\n\nAsk me to analyze priorities, explain your stats, or suggest a plan.`;
      }

      return 'Ask me about priorities, stats, or next steps.';
    } catch (error) {
      console.error('Assistant response error:', error);
      return FALLBACK_MESSAGE;
    }
  }, [intelligence, readOnlyExecution, getContextualData]);

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

    // AbortController for hard timeout - ensures we never hang
    const abortController = new AbortController();
    let isAborted = false;

    // Hard 8-second timeout - abort and show fallback
    const hardTimeoutId = setTimeout(() => {
      isAborted = true;
      abortController.abort();
      setIsProcessing(false);
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: TIMEOUT_FALLBACK_MESSAGE,
        timestamp: new Date(),
        isError: true,
        isStreaming: false, // Timeout errors render immediately
      }]);
    }, ASSISTANT_CONFIG.hardTimeoutMs);

    // Process response (manual mode - triggered on send only)
    // Small delay for UX, then generate response
    setTimeout(() => {
      // Skip if already aborted by hard timeout
      if (isAborted) return;
      
      clearTimeout(hardTimeoutId);
      
      try {
        const response = generateResponse(userMessage.content);
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          isStreaming: ENABLE_ASSISTANT_STREAMING, // Enable streaming render if flag is on
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Assistant error:', error);
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: FALLBACK_MESSAGE,
          timestamp: new Date(),
          isError: true,
          isStreaming: false, // Errors never stream
        }]);
      }
      
      setIsProcessing(false);
    }, 400);
  }, [input, isProcessing, generateResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Always render - never block on hook loading state
  const isAnalystMode = ASSISTANT_CONFIG.mode === 'analyst' || readOnlyContext?.isReadOnly;

  return (
    <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground/90 flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary/70" />
          Assistant
          {isAnalystMode && (
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.isError ? 'bg-destructive/10' : 'bg-primary/10'
                    }`}>
                      {msg.isError ? (
                        <AlertCircle className="w-3 h-3 text-destructive" />
                      ) : (
                        <Bot className="w-3 h-3 text-primary" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground'
                        : msg.isError
                        ? 'bg-destructive/10 text-foreground/90'
                        : 'bg-muted/50 text-foreground/90'
                    }`}
                  >
                    {/* Conditional streaming: if enabled and this is a streaming assistant message */}
                    {msg.role === 'assistant' && msg.isStreaming && ENABLE_ASSISTANT_STREAMING ? (
                      <StreamingMessage 
                        content={msg.content} 
                        onComplete={() => {
                          setMessages(prev => prev.map(m => 
                            m.id === msg.id ? { ...m, isStreaming: false } : m
                          ));
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
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

        {/* Input Area - never disabled by hook loading */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What should I focus on today?"
            className="flex-1 h-9 text-sm bg-background/50 border-border/30"
            disabled={isProcessing}
          />
          <Button
            ref={sendButtonRef}
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
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
