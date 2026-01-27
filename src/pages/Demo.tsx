import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Presentation-Only Demo Page
 * Optimized for video frames, investor reviews, and first impressions.
 * Static, calm, readable from 6 feet away.
 * Includes automatic interaction sequence demonstrating AI assistant action.
 */

type InteractionPhase = "calm" | "focus" | "action" | "resolve" | "complete";

interface DemoMessage {
  id: string;
  sender: string;
  intent: string;
  source: "email" | "slack" | "whatsapp";
  time: string;
  priority: "high" | "medium" | "fyi";
}

const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: "1",
    sender: "Sarah Chen",
    intent: "Contract needs approval before Friday",
    source: "email",
    time: "2h ago",
    priority: "high",
  },
  {
    id: "2",
    sender: "DevOps Team",
    intent: "Production deployment blocked",
    source: "slack",
    time: "3h ago",
    priority: "high",
  },
  {
    id: "3",
    sender: "Michael Torres",
    intent: "Review updated proposal draft",
    source: "email",
    time: "Today",
    priority: "medium",
  },
  {
    id: "4",
    sender: "Finance",
    intent: "Q4 invoice processed",
    source: "email",
    time: "Today",
    priority: "fyi",
  },
  {
    id: "5",
    sender: "Alex Kim",
    intent: "Confirmed meeting moved to 3pm",
    source: "whatsapp",
    time: "4h ago",
    priority: "fyi",
  },
  {
    id: "6",
    sender: "Product Team",
    intent: "Feedback requested on roadmap",
    source: "slack",
    time: "Yesterday",
    priority: "medium",
  },
  {
    id: "7",
    sender: "Board Assistant",
    intent: "Quarterly report attached",
    source: "email",
    time: "Yesterday",
    priority: "fyi",
  },
];

const sourceIcons = {
  email: Mail,
  slack: MessageSquare,
  whatsapp: Phone,
};

const sourceLabels = {
  email: "Email",
  slack: "Slack",
  whatsapp: "WhatsApp",
};

const priorityColors = {
  high: "bg-amber-500",
  medium: "bg-blue-400",
  fyi: "bg-transparent",
};

function SuggestedAction({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-2 animate-fade-in">
      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      <span className="text-sm text-primary font-medium">{label}</span>
    </div>
  );
}

interface DemoMessageRowProps {
  message: DemoMessage;
  isFocused: boolean;
  isFaded: boolean;
  isResolving: boolean;
  showAction: boolean;
}

function DemoMessageRow({ message, isFocused, isFaded, isResolving, showAction }: DemoMessageRowProps) {
  const SourceIcon = sourceIcons[message.source];
  
  return (
    <div 
      className={cn(
        "flex items-center gap-4 py-5 px-6 bg-card/30 rounded-2xl border border-border/30 transition-all duration-500 ease-out",
        isFaded && "opacity-50",
        isFocused && "bg-card/50 ring-1 ring-primary/20",
        isResolving && "opacity-0 max-h-0 overflow-hidden py-0 my-0 border-0"
      )}
    >
      {/* Priority indicator - subtle left bar */}
      <div 
        className={`w-1 h-10 rounded-full ${priorityColors[message.priority]} transition-opacity duration-500`}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Sender - Primary */}
        <p className="font-semibold text-foreground text-lg tracking-tight">
          {message.sender}
        </p>
        
        {/* Intent - Secondary */}
        <p className="text-muted-foreground text-base">
          {message.intent}
        </p>
        
        {/* Suggested Action - appears during action phase */}
        {showAction && <SuggestedAction label="Approve contract" />}
      </div>
      
      {/* Meta - Tertiary */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground/70">
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3.5 w-3.5" />
          <span className="text-xs">{sourceLabels[message.source]}</span>
        </div>
        <span className="text-xs">{message.time}</span>
      </div>
    </div>
  );
}

interface DemoSectionProps {
  label: string;
  messages: DemoMessage[];
  phase: InteractionPhase;
  focusedMessageId: string;
}

function DemoSection({ label, messages, phase, focusedMessageId }: DemoSectionProps) {
  if (messages.length === 0) return null;
  
  // Filter out resolved message in complete phase
  const visibleMessages = phase === "complete" 
    ? messages.filter(m => m.id !== focusedMessageId)
    : messages;
  
  if (visibleMessages.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider pl-2">
        {label}
      </h3>
      <div className="space-y-2">
        {visibleMessages.map(message => {
          const isFocused = message.id === focusedMessageId && (phase === "focus" || phase === "action");
          const isFaded = message.id !== focusedMessageId && (phase === "focus" || phase === "action" || phase === "resolve");
          const isResolving = message.id === focusedMessageId && phase === "resolve";
          const showAction = message.id === focusedMessageId && phase === "action";
          
          return (
            <DemoMessageRow 
              key={message.id} 
              message={message}
              isFocused={isFocused}
              isFaded={isFaded}
              isResolving={isResolving}
              showAction={showAction}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Demo() {
  const [phase, setPhase] = useState<InteractionPhase>("calm");
  const focusedMessageId = "1"; // Sarah Chen - Contract approval
  
  // Automatic interaction sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("focus"), 1000),
      setTimeout(() => setPhase("action"), 2000),
      setTimeout(() => setPhase("resolve"), 3500),
      setTimeout(() => setPhase("complete"), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  
  const priorityGroups = {
    high: { label: "Requires Action", messages: DEMO_MESSAGES.filter(m => m.priority === "high") },
    medium: { label: "For Review", messages: DEMO_MESSAGES.filter(m => m.priority === "medium") },
    fyi: { label: "FYI", messages: DEMO_MESSAGES.filter(m => m.priority === "fyi") },
  };
  
  // Calculate message count based on phase
  const messageCount = phase === "complete" ? 6 : 7;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Minimal, clean */}
      <header className="border-b border-border/50 px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Unified Inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              {messageCount} messages across 3 channels
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs border-border/50 transition-all duration-300",
              phase === "complete" ? "text-primary border-primary/30" : "text-muted-foreground"
            )}
          >
            {phase === "complete" ? "1 handled" : "All caught up"}
          </Badge>
        </div>
      </header>
      
      {/* Message List - Presentation optimized */}
      <main className="px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <DemoSection {...priorityGroups.high} phase={phase} focusedMessageId={focusedMessageId} />
          <DemoSection {...priorityGroups.medium} phase={phase} focusedMessageId={focusedMessageId} />
          <DemoSection {...priorityGroups.fyi} phase={phase} focusedMessageId={focusedMessageId} />
        </div>
      </main>
    </div>
  );
}
