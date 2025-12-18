import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssistantIntelligence } from '@/hooks/useAssistantIntelligence';
import { useReadOnlyExecution } from '@/hooks/useReadOnlyExecution';
import { useAssistantReadOnly } from '@/contexts/AssistantReadOnlyContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ENABLE_ASSISTANT_STREAMING } from '@/config/flags';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

// Safe mode configuration - Analyst is default and locked
const ASSISTANT_CONFIG = {
  mode: 'analyst' as const,  // Default: Analyst mode (read-only)
  modeLocked: true,          // Cannot toggle mode
  canSelfEscalate: false,    // Cannot promote itself
  streaming: false,
  requestMode: 'manual' as const,
  hardTimeoutMs: 8000, // Hard timeout - abort after 8 seconds
  dataTimeoutMs: 2000, // Max 2 seconds for data loading
};

const DATA_UNAVAILABLE_MESSAGE = 'No actionable insights available yet.';
const TIMEOUT_FALLBACK_MESSAGE = 'No actionable insights available yet.';
const FALLBACK_MESSAGE = 'No actionable insights available yet.';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  isStreaming?: boolean; // Track if message is currently streaming
}

// Streaming message renderer component with safe cleanup
const StreamingMessage = ({ 
  content, 
  onComplete,
  cancelSignal,
}: { 
  content: string; 
  onComplete: () => void;
  cancelSignal?: boolean; // External signal to cancel streaming
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [streamFailed, setStreamFailed] = useState(false);
  const cancelledRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Safe cleanup function - never throws
  const cleanupStream = useCallback(() => {
    cancelledRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle external cancel signal (e.g., new message sent)
  useEffect(() => {
    if (cancelSignal) {
      cleanupStream();
      // Show full content immediately on cancel
      setDisplayedContent(content);
    }
  }, [cancelSignal, cleanupStream, content]);

  useEffect(() => {
    // Reset cancelled state for new content
    cancelledRef.current = false;

    if (!ENABLE_ASSISTANT_STREAMING || streamFailed) {
      // Fallback: show full content immediately
      setDisplayedContent(content);
      onComplete();
      return;
    }

    let index = 0;
    intervalRef.current = setInterval(() => {
      // Check if cancelled - exit silently without errors or retries
      if (cancelledRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      try {
        if (index < content.length) {
          // Stream ~3 characters at a time for smoother effect
          const chunkSize = Math.min(3, content.length - index);
          setDisplayedContent(content.slice(0, index + chunkSize));
          index += chunkSize;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Only call onComplete if not cancelled
          if (!cancelledRef.current) {
            onComplete();
          }
        }
      } catch (error) {
        // Silent fail - just show full content, no errors thrown
        console.warn('Streaming render interrupted, showing full content');
        setStreamFailed(true);
        setDisplayedContent(content);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (!cancelledRef.current) {
          onComplete();
        }
      }
    }, 20); // ~50 updates/sec for smooth streaming

    // Cleanup on unmount or content change - safe, no errors
    return () => {
      cleanupStream();
    };
  }, [content, onComplete, streamFailed, cleanupStream]);

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
  const [cancelStreaming, setCancelStreaming] = useState(false); // Signal to cancel active streams
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const activeStreamIdRef = useRef<string | null>(null); // Track active stream on mobile

  // Detect mobile for single-stream restriction
  const isMobile = useIsMobile();

  // Safe access to hooks - never block on loading
  const intelligence = useAssistantIntelligence();
  const readOnlyExecution = useReadOnlyExecution();
  const readOnlyContext = useAssistantReadOnly();
  
  // Voice input hook
  const { 
    isListening, 
    isSupported: voiceSupported, 
    transcript: voiceTranscript,
    startListening: startVoice,
    stopListening: stopVoice,
    resetTranscript 
  } = useVoiceInput({
    onTranscript: (text) => {
      // When voice stops, set the transcript as input
      setInput(prev => prev ? `${prev} ${text}` : text);
      setVoiceStatus('idle');
    },
    onError: () => {
      setVoiceStatus('idle');
    }
  });

  // Sync voice status with listening state
  useEffect(() => {
    if (isListening) {
      setVoiceStatus('listening');
    }
  }, [isListening]);

  // Handle push-to-talk press
  const handleVoicePress = useCallback(() => {
    if (!voiceSupported || isProcessing) return;
    resetTranscript();
    setVoiceStatus('listening');
    startVoice();
  }, [voiceSupported, isProcessing, startVoice, resetTranscript]);

  // Handle push-to-talk release
  const handleVoiceRelease = useCallback(() => {
    if (!isListening) return;
    setVoiceStatus('processing');
    stopVoice();
    // Processing state will be cleared when onTranscript fires
    setTimeout(() => {
      setVoiceStatus('idle');
    }, 500);
  }, [isListening, stopVoice]);

  // 2-second timeout for data loading - never show indefinite loading
  const [dataTimedOut, setDataTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDataTimedOut(true);
    }, ASSISTANT_CONFIG.dataTimeoutMs);
    return () => clearTimeout(timer);
  }, []);

  // Safe getters with fallbacks - hooks may still be loading
  const getContextualData = intelligence?.getContextualData ?? {
    todayMinutes: 0,
    weekMinutes: 0,
    weekUCT: 0,
    currentStreak: 0,
    longestStreak: 0,
    recentSessionsCount: 0,
    tasksGenerated: 0,
    tokensEarned: 0,
  };

  // Data is considered loaded if: hook reports not loading, OR timeout has passed
  const dataReady = intelligence?.isLoading === false || dataTimedOut;

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
                return DATA_UNAVAILABLE_MESSAGE;
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
                return DATA_UNAVAILABLE_MESSAGE;
              }
              const analysis = intelligence.analyzeStats();
              return `${analysis.focusSummary}\n\n${analysis.streakStatus}\n\n${analysis.recommendations.length > 0 ? `Recommendation: ${analysis.nextAction}` : 'All metrics healthy.'}`;
            }
            
            case 'plan': {
              if (!intelligence?.analyzeStats || !intelligence?.suggestPriorities) {
                return DATA_UNAVAILABLE_MESSAGE;
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
        return intelligence.explainFocusState();
      }

      return DATA_UNAVAILABLE_MESSAGE;
    } catch (error) {
      console.error('Assistant response error:', error);
      return FALLBACK_MESSAGE;
    }
  }, [intelligence, readOnlyExecution, getContextualData]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isProcessing) return;

    // On mobile: enforce single stream - cancel any active stream first
    if (isMobile && activeStreamIdRef.current) {
      console.log('[Assistant] Mobile: cancelling previous stream:', activeStreamIdRef.current);
      activeStreamIdRef.current = null;
    }

    // Cancel any active streaming messages before sending new message
    setCancelStreaming(true);
    // Mark all streaming messages as complete
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
    // Reset cancel signal after a tick
    setTimeout(() => setCancelStreaming(false), 0);

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
      // Clear active stream on timeout
      if (isMobile) activeStreamIdRef.current = null;
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
        const messageId = `assistant-${Date.now()}`;
        
        // On mobile: track active stream ID (only one allowed)
        if (isMobile && ENABLE_ASSISTANT_STREAMING) {
          activeStreamIdRef.current = messageId;
        }
        
        const assistantMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          isStreaming: ENABLE_ASSISTANT_STREAMING, // Enable streaming render if flag is on
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Assistant error:', error);
        // Clear active stream on error
        if (isMobile) activeStreamIdRef.current = null;
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
  }, [input, isProcessing, generateResponse, isMobile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Analyst Mode is always active and locked - no conditional check needed
  // This ensures read-only behavior without toggling capability

  return (
    <Card className="bg-card/50 border-border/30 backdrop-blur-sm flex-shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground/90 flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary/70" />
          Assistant
          <span className="text-xs text-muted-foreground font-normal ml-auto px-2 py-0.5 bg-muted/30 rounded">
            Analyst · Read Only
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages Area - Fixed height, no auto-scroll */}
        <ScrollArea className="h-48 rounded-lg bg-background/30 border border-border/20 p-3" style={{ overflow: 'hidden' }}>
        {messages.length === 0 ? (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-lg px-3 py-2 text-xs bg-muted/50 text-foreground/90">
                <p className="whitespace-pre-wrap">
                  {(() => {
                    const sessionsToday = getContextualData.recentSessionsCount;
                    const focusStreakActive = getContextualData.currentStreak > 0;
                    const urgentItems = getContextualData.tasksGenerated;
                    const hasAnyData = sessionsToday > 0 || getContextualData.currentStreak > 0 || 
                                       getContextualData.todayMinutes > 0 || urgentItems > 0;

                    // Calm empty state: data not ready or no data available
                    if (!dataReady || !hasAnyData) {
                      return DATA_UNAVAILABLE_MESSAGE;
                    }

                    // Data is available - show deterministic suggestions (never open-ended questions)
                    const suggestions: string[] = [];

                    // Primary suggestion based on session state
                    if (sessionsToday === 0) {
                      suggestions.push('Start a focus session to begin today');
                    } else if (focusStreakActive) {
                      suggestions.push('Continue your streak with another session');
                    } else {
                      suggestions.push('Start a session to build a new streak');
                    }

                    // Secondary suggestion based on tasks
                    if (urgentItems > 0) {
                      suggestions.push(`Review ${urgentItems} pending task${urgentItems > 1 ? 's' : ''}`);
                    } else {
                      suggestions.push('No urgent items detected');
                    }

                    // Analyst Mode: Never ask open-ended questions. Only state facts and suggest actions.
                    return `Analyst Mode — Read Only

Current state:
• Focus streak: ${focusStreakActive ? `${getContextualData.currentStreak} day${getContextualData.currentStreak > 1 ? 's' : ''} active` : 'inactive'}
• Sessions today: ${sessionsToday}
• Urgent items: ${urgentItems > 0 ? urgentItems : 'none'}

Suggested actions:
1. ${suggestions[0]}${suggestions[1] ? `\n2. ${suggestions[1]}` : ''}`;
                  })()}
                </p>
              </div>
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
                        cancelSignal={cancelStreaming}
                        onComplete={() => {
                          // Clear active stream on mobile when complete
                          if (isMobile && activeStreamIdRef.current === msg.id) {
                            activeStreamIdRef.current = null;
                          }
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

        {/* Input Area - No autoFocus to prevent focus stealing */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={voiceStatus === 'listening' ? voiceTranscript || input : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceStatus === 'listening' ? 'Listening...' : 'Ask about priorities or stats'}
            className={cn(
              "flex-1 h-9 text-sm bg-background/50 border-border/30 transition-colors",
              voiceStatus === 'listening' && "border-primary/50 bg-primary/5"
            )}
            disabled={isProcessing || voiceStatus !== 'idle'}
            autoFocus={false}
            tabIndex={0}
          />
          
          {/* Push-to-talk microphone button */}
          {voiceSupported && (
            <Button
              size="sm"
              variant="ghost"
              onMouseDown={handleVoicePress}
              onMouseUp={handleVoiceRelease}
              onMouseLeave={handleVoiceRelease}
              onTouchStart={handleVoicePress}
              onTouchEnd={handleVoiceRelease}
              disabled={isProcessing}
              className={cn(
                "h-9 w-9 p-0 transition-all touch-manipulation",
                voiceStatus === 'idle' && "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                voiceStatus === 'listening' && "bg-primary/20 text-primary ring-2 ring-primary/30",
                voiceStatus === 'processing' && "bg-muted/50 text-muted-foreground"
              )}
              aria-label="Hold to speak"
            >
              {voiceStatus === 'processing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className={cn(
                  "w-4 h-4 transition-transform",
                  voiceStatus === 'listening' && "scale-110"
                )} />
              )}
            </Button>
          )}
          
          <Button
            ref={sendButtonRef}
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || voiceStatus !== 'idle'}
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
