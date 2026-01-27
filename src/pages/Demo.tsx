import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone } from "lucide-react";

/**
 * Presentation-Only Demo Page
 * Optimized for video frames, investor reviews, and first impressions.
 * Static, calm, readable from 6 feet away.
 */

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

const priorityGroups = {
  high: { label: "Requires Action", messages: DEMO_MESSAGES.filter(m => m.priority === "high") },
  medium: { label: "For Review", messages: DEMO_MESSAGES.filter(m => m.priority === "medium") },
  fyi: { label: "FYI", messages: DEMO_MESSAGES.filter(m => m.priority === "fyi") },
};

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

function DemoMessageRow({ message }: { message: DemoMessage }) {
  const SourceIcon = sourceIcons[message.source];
  
  return (
    <div className="flex items-center gap-4 py-5 px-6 bg-card/30 rounded-2xl border border-border/30 hover:bg-card/40 transition-colors">
      {/* Priority indicator - subtle left bar */}
      <div 
        className={`w-1 h-10 rounded-full ${priorityColors[message.priority]}`}
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

function DemoSection({ label, messages }: { label: string; messages: DemoMessage[] }) {
  if (messages.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider pl-2">
        {label}
      </h3>
      <div className="space-y-2">
        {messages.map(message => (
          <DemoMessageRow key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}

export default function Demo() {
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
              7 messages across 3 channels
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
            All caught up
          </Badge>
        </div>
      </header>
      
      {/* Message List - Presentation optimized */}
      <main className="px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <DemoSection {...priorityGroups.high} />
          <DemoSection {...priorityGroups.medium} />
          <DemoSection {...priorityGroups.fyi} />
        </div>
      </main>
    </div>
  );
}
