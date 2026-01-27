import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Phone, Circle, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cohesive Presentation Demo for UnclutterAI
 * Supports Scenes 2-5 of product video for Google Startup Grant review.
 * Static, calm, production-grade. Mobile-first, single-column.
 */

type DemoScene = "static" | "summarized" | "actions";

interface DemoMessage {
  id: string;
  sender: string;
  intent: string;
  source: "email" | "slack" | "whatsapp";
  time: string;
  priority: "high" | "medium" | "fyi";
  aiLabel: string;
}

interface DemoTask {
  id: string;
  action: string;
  source: string;
  priority: "high" | "medium";
}

const DEMO_MESSAGES: DemoMessage[] = [
  { id: "1", sender: "Sarah Chen", intent: "Contract needs approval before Friday", source: "email", time: "2h ago", priority: "high", aiLabel: "Decision required" },
  { id: "2", sender: "DevOps Team", intent: "Production deployment blocked", source: "slack", time: "3h ago", priority: "high", aiLabel: "Awaiting response" },
  { id: "3", sender: "Michael Torres", intent: "Review updated proposal draft", source: "email", time: "Today", priority: "medium", aiLabel: "Review requested" },
  { id: "4", sender: "Product Team", intent: "Feedback requested on roadmap", source: "slack", time: "Yesterday", priority: "medium", aiLabel: "Input requested" },
  { id: "5", sender: "Finance", intent: "Q4 invoice processed", source: "email", time: "Today", priority: "fyi", aiLabel: "No action needed" },
  { id: "6", sender: "Alex Kim", intent: "Confirmed meeting moved to 3pm", source: "whatsapp", time: "4h ago", priority: "fyi", aiLabel: "Acknowledged" },
  { id: "7", sender: "Board Assistant", intent: "Quarterly report attached", source: "email", time: "Yesterday", priority: "fyi", aiLabel: "For reference" },
];

const DEMO_TASKS: DemoTask[] = [
  { id: "t1", action: "Approve contract", source: "Sarah Chen", priority: "high" },
  { id: "t2", action: "Unblock deployment", source: "DevOps Team", priority: "high" },
  { id: "t3", action: "Review proposal", source: "Michael Torres", priority: "medium" },
  { id: "t4", action: "Provide roadmap feedback", source: "Product Team", priority: "medium" },
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
  high: "bg-amber-600",
  medium: "bg-blue-500",
  fyi: "bg-muted/30",
};

// Components

function DemoHeader({ scene }: { scene: DemoScene }) {
  return (
    <header className="border-b border-border/20 px-4 sm:px-8 py-5 bg-background/50 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Unified Inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              7 messages across 3 channels
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs border-border/40 text-muted-foreground shrink-0"
          >
            4 actions identified
          </Badge>
        </div>
      </div>
    </header>
  );
}

function DemoActions({ scene, onSummarize }: { scene: DemoScene; onSummarize: () => void }) {
  return (
    <div className="px-4 sm:px-8 py-4 border-b border-border/10">
      <div className="max-w-3xl mx-auto flex gap-3">
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "gap-2 text-sm font-medium border-border/30 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all duration-300",
            scene !== "static" && "border-primary/40 text-primary"
          )}
          onClick={onSummarize}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Summarize
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 text-sm font-medium border-border/30 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all duration-300"
        >
          <Layers className="h-3.5 w-3.5" />
          Batch Respond
        </Button>
      </div>
    </div>
  );
}

function AISummaryPanel({ visible }: { visible: boolean }) {
  return (
    <div 
      className={cn(
        "px-4 sm:px-8 py-0 overflow-hidden transition-all duration-500 ease-out",
        visible ? "max-h-40 py-4 opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-card/40 border border-border/20 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">AI Summary</span>
          </div>
          <div className="space-y-1.5 text-sm text-foreground/80">
            <p>• 2 decisions required</p>
            <p>• 1 deployment blocked</p>
            <p>• 1 review requested</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AILabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
      <span className="text-xs font-medium text-primary">{label}</span>
    </div>
  );
}

interface DemoMessageRowProps {
  message: DemoMessage;
  isDimmed?: boolean;
}

function DemoMessageRow({ message, isDimmed }: DemoMessageRowProps) {
  const SourceIcon = sourceIcons[message.source];
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 sm:gap-4 py-4 sm:py-5 px-4 sm:px-5 bg-card/20 rounded-xl border border-border/10 transition-all duration-300",
        isDimmed && "opacity-50"
      )}
    >
      {/* Priority indicator */}
      <div 
        className={cn(
          "w-1 h-10 sm:h-12 rounded-full mt-0.5 shrink-0",
          priorityColors[message.priority]
        )}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-semibold text-foreground text-sm sm:text-base tracking-tight truncate">
          {message.sender}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {message.intent}
        </p>
        <AILabel label={message.aiLabel} />
      </div>
      
      {/* Meta */}
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground/60 shrink-0">
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3 w-3" />
          <span className="hidden sm:inline">{sourceLabels[message.source]}</span>
        </div>
        <span>{message.time}</span>
      </div>
    </div>
  );
}

interface DemoSectionProps {
  label: string;
  messages: DemoMessage[];
  dimmed?: boolean;
}

function DemoSection({ label, messages, dimmed }: DemoSectionProps) {
  if (messages.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-1">
        {label}
      </h3>
      <div className="space-y-2">
        {messages.map((message) => (
          <DemoMessageRow 
            key={message.id} 
            message={message}
            isDimmed={dimmed}
          />
        ))}
      </div>
    </div>
  );
}

function DemoTaskRow({ task, index, visible }: { task: DemoTask; index: number; visible: boolean }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 py-3 sm:py-4 px-4 bg-card/20 rounded-xl border border-border/10 transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      {/* Priority bar */}
      <div className={cn(
        "w-1 h-8 rounded-full shrink-0",
        task.priority === "high" ? "bg-amber-600" : "bg-blue-500"
      )} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{task.action}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          from {task.source}
        </p>
      </div>
      
      {/* Visual checkbox placeholder */}
      <div className="w-5 h-5 rounded border border-border/30 shrink-0" />
    </div>
  );
}

function DemoActionsSection({ visible }: { visible: boolean }) {
  return (
    <div 
      className={cn(
        "transition-all duration-500 ease-out",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="border-t border-border/10 pt-6 mt-6">
        <h2 className="text-base font-semibold text-foreground mb-4 tracking-tight">
          Your Next Actions
        </h2>
        <div className="space-y-2">
          {DEMO_TASKS.map((task, idx) => (
            <DemoTaskRow 
              key={task.id} 
              task={task} 
              index={idx}
              visible={visible}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [scene, setScene] = useState<DemoScene>("static");
  
  // Automatic scene progression for video recording
  useEffect(() => {
    const timers = [
      setTimeout(() => setScene("summarized"), 3000),  // Show summary
      setTimeout(() => setScene("actions"), 6000),     // Show actions
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  
  const handleSummarize = () => {
    if (scene === "static") {
      setScene("summarized");
    }
  };
  
  const priorityGroups = {
    high: { label: "Requires Action", messages: DEMO_MESSAGES.filter(m => m.priority === "high") },
    medium: { label: "For Review", messages: DEMO_MESSAGES.filter(m => m.priority === "medium") },
    fyi: { label: "FYI", messages: DEMO_MESSAGES.filter(m => m.priority === "fyi") },
  };
  
  const showSummary = scene === "summarized" || scene === "actions";
  const showActions = scene === "actions";
  
  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <DemoHeader scene={scene} />
      <DemoActions scene={scene} onSummarize={handleSummarize} />
      <AISummaryPanel visible={showSummary} />
      
      <main className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          {/* Message List */}
          <DemoSection 
            {...priorityGroups.high}
          />
          <DemoSection 
            {...priorityGroups.medium}
          />
          <DemoSection 
            {...priorityGroups.fyi}
            dimmed={showActions}
          />
          
          {/* Next Actions (full-width, below inbox) */}
          <DemoActionsSection visible={showActions} />
        </div>
      </main>
    </div>
  );
}
