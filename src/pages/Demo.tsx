import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Phone, Circle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AI Interaction Demo for UnclutterAI
 * Shows cause → effect of AI analysis.
 * Optimized for 5-7 second product video capture.
 */

type DemoPhase = "idle" | "processing" | "revealing" | "complete";

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

const AI_SUMMARY_ITEMS = [
  "2 decisions required",
  "1 deployment blocked", 
  "1 review requested",
];

const sourceIcons = {
  email: Mail,
  slack: MessageSquare,
  whatsapp: Phone,
};

const priorityColors = {
  high: "bg-amber-600",
  medium: "bg-blue-500",
  fyi: "bg-muted/20",
};

// Header Component
function DemoHeader({ phase }: { phase: DemoPhase }) {
  return (
    <header className="border-b border-border/20 px-4 py-5 bg-background/50 backdrop-blur-sm">
      <div className="max-w-md mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Unified Inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              7 messages across 3 channels
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs border-primary/30 text-primary/80 shrink-0"
          >
            4 actions identified
          </Badge>
        </div>
      </div>
    </header>
  );
}

// Summarize Button Component
function SummarizeButton({ phase, onClick }: { phase: DemoPhase; onClick: () => void }) {
  const isProcessing = phase === "processing";
  const isComplete = phase === "complete" || phase === "revealing";
  
  return (
    <div className="px-4 py-3">
      <div className="max-w-md mx-auto">
        <Button
          onClick={onClick}
          disabled={isProcessing || isComplete}
          className={cn(
            "w-full h-11 rounded-xl font-medium transition-all duration-300",
            isProcessing && "animate-pulse bg-primary/80",
            isComplete && "bg-primary/60 cursor-default",
            !isProcessing && !isComplete && "bg-primary hover:bg-primary/90"
          )}
        >
          <Sparkles className={cn(
            "h-4 w-4 mr-2 transition-opacity duration-300",
            isProcessing && "animate-pulse"
          )} />
          {isProcessing ? "Analyzing..." : isComplete ? "Analysis Complete" : "Summarize"}
        </Button>
      </div>
    </div>
  );
}

// AI Summary Panel Component
function AISummaryPanel({ phase }: { phase: DemoPhase }) {
  const isVisible = phase === "revealing" || phase === "complete";
  
  return (
    <div className={cn(
      "px-4 overflow-hidden transition-all duration-500 ease-out",
      isVisible ? "max-h-40 opacity-100 py-3" : "max-h-0 opacity-0 py-0"
    )}>
      <div className="max-w-md mx-auto">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-primary/80">
              AI Summary
            </span>
          </div>
          <ul className="space-y-1.5">
            {AI_SUMMARY_ITEMS.map((item, index) => (
              <li 
                key={index}
                className={cn(
                  "text-sm text-foreground/90 transition-all duration-300",
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                )}
                style={{ 
                  transitionDelay: isVisible ? `${index * 150}ms` : "0ms" 
                }}
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// AI Label Component
function AILabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
      <span className="text-xs font-medium text-primary">{label}</span>
    </div>
  );
}

// Message Row Component
interface DemoMessageRowProps {
  message: DemoMessage;
  phase: DemoPhase;
  showAILabel?: boolean;
}

function DemoMessageRow({ message, phase, showAILabel = true }: DemoMessageRowProps) {
  const SourceIcon = sourceIcons[message.source];
  const isProcessing = phase === "processing";
  const isFyi = message.priority === "fyi";
  const isComplete = phase === "complete" || phase === "revealing";
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 py-4 px-4 bg-card/20 rounded-xl border border-border/10 transition-all duration-500 ease-out",
        isProcessing && "opacity-60",
        isComplete && isFyi && "opacity-40 blur-[0.3px]"
      )}
    >
      {/* Priority indicator */}
      <div 
        className={cn(
          "w-1 h-10 rounded-full mt-0.5 shrink-0 transition-opacity duration-500",
          priorityColors[message.priority],
          (isProcessing || (isComplete && isFyi)) && "opacity-50"
        )}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn(
          "font-semibold text-foreground text-sm tracking-tight truncate transition-opacity duration-500",
          (isProcessing || (isComplete && isFyi)) && "text-muted-foreground"
        )}>
          {message.sender}
        </p>
        <p className={cn(
          "text-muted-foreground text-sm leading-relaxed line-clamp-2 transition-opacity duration-500",
          (isProcessing || (isComplete && isFyi)) && "text-muted-foreground/60"
        )}>
          {message.intent}
        </p>
        {showAILabel && isComplete && !isFyi && <AILabel label={message.aiLabel} />}
      </div>
      
      {/* Meta */}
      <div className={cn(
        "flex flex-col items-end gap-1 text-xs text-muted-foreground/60 shrink-0 transition-opacity duration-500",
        (isProcessing || (isComplete && isFyi)) && "opacity-50"
      )}>
        <SourceIcon className="h-3 w-3" />
        <span>{message.time}</span>
      </div>
    </div>
  );
}

// Message Section Component
interface DemoSectionProps {
  label: string;
  messages: DemoMessage[];
  phase: DemoPhase;
  showAILabels?: boolean;
}

function DemoSection({ label, messages, phase, showAILabels = true }: DemoSectionProps) {
  if (messages.length === 0) return null;
  const isComplete = phase === "complete" || phase === "revealing";
  const isFyiSection = messages[0]?.priority === "fyi";
  
  return (
    <div className={cn(
      "space-y-3 transition-all duration-500 ease-out",
      isComplete && isFyiSection && "opacity-60"
    )}>
      <h3 className={cn(
        "text-xs font-medium uppercase tracking-wider px-1 transition-colors duration-500",
        isComplete && isFyiSection ? "text-muted-foreground/40" : "text-muted-foreground/70"
      )}>
        {label}
      </h3>
      <div className="space-y-2">
        {messages.map((message) => (
          <DemoMessageRow 
            key={message.id} 
            message={message}
            phase={phase}
            showAILabel={showAILabels}
          />
        ))}
      </div>
    </div>
  );
}

// Task Row Component
function DemoTaskRow({ task, index, visible }: { task: DemoTask; index: number; visible: boolean }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 py-3 px-4 bg-card/30 rounded-xl border border-border/20 transition-all duration-500",
        visible ? "opacity-100" : "opacity-0"
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
      
      {/* Checkbox placeholder */}
      <div className="w-5 h-5 rounded border border-primary/30 shrink-0" />
    </div>
  );
}

// Actions Section Component
function DemoActionsSection({ phase }: { phase: DemoPhase }) {
  const isVisible = phase === "complete";
  
  return (
    <div className={cn(
      "transition-all duration-500 ease-out",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
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
              visible={isVisible}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  
  // Auto-run the demo sequence
  useEffect(() => {
    const timers = [
      // Start processing after 1.5s
      setTimeout(() => setPhase("processing"), 1500),
      // Show AI summary after 2.5s
      setTimeout(() => setPhase("revealing"), 2500),
      // Complete state after 4s
      setTimeout(() => setPhase("complete"), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  
  const handleSummarize = () => {
    if (phase === "idle") {
      setPhase("processing");
      setTimeout(() => setPhase("revealing"), 800);
      setTimeout(() => setPhase("complete"), 1500);
    }
  };
  
  const priorityGroups = {
    high: { label: "Requires Action", messages: DEMO_MESSAGES.filter(m => m.priority === "high") },
    medium: { label: "For Review", messages: DEMO_MESSAGES.filter(m => m.priority === "medium") },
    fyi: { label: "FYI", messages: DEMO_MESSAGES.filter(m => m.priority === "fyi") },
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <DemoHeader phase={phase} />
      
      {/* Summarize Button */}
      <SummarizeButton phase={phase} onClick={handleSummarize} />
      
      {/* AI Summary Panel */}
      <AISummaryPanel phase={phase} />
      
      <main className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Requires Action */}
          <DemoSection 
            {...priorityGroups.high}
            phase={phase}
            showAILabels={phase === "complete" || phase === "revealing"}
          />
          
          {/* For Review */}
          <DemoSection 
            {...priorityGroups.medium}
            phase={phase}
            showAILabels={phase === "complete" || phase === "revealing"}
          />
          
          {/* FYI */}
          <DemoSection 
            {...priorityGroups.fyi}
            phase={phase}
            showAILabels={false}
          />
          
          {/* Next Actions */}
          <DemoActionsSection phase={phase} />
        </div>
      </main>
    </div>
  );
}
