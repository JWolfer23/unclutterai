import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Phone, Circle, Sparkles, Layers, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Focus Mode Demo for UnclutterAI
 * Optimized for product demo video capture.
 * FYI items de-emphasized, action items prominent.
 */

type DemoScene = "loading" | "focus";

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

const priorityColors = {
  high: "bg-amber-600",
  medium: "bg-blue-500",
  fyi: "bg-muted/20",
};

// Header Component
function DemoHeader() {
  return (
    <header className="border-b border-border/20 px-4 sm:px-6 py-5 bg-background/50 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Unified Inbox
              </h1>
              <Eye className="h-4 w-4 text-primary opacity-60" />
            </div>
            <p className="text-sm text-muted-foreground">
              4 items need attention
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs border-primary/30 text-primary/80 shrink-0"
          >
            Focus active
          </Badge>
        </div>
      </div>
    </header>
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
  isFocusDimmed?: boolean;
  isVisible: boolean;
}

function DemoMessageRow({ message, isFocusDimmed, isVisible }: DemoMessageRowProps) {
  const SourceIcon = sourceIcons[message.source];
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 py-4 px-4 bg-card/20 rounded-xl border border-border/10 transition-all duration-500 ease-out",
        isFocusDimmed && "opacity-40 blur-[0.5px]",
        !isVisible && "opacity-0"
      )}
    >
      {/* Priority indicator */}
      <div 
        className={cn(
          "w-1 h-10 rounded-full mt-0.5 shrink-0 transition-opacity duration-500",
          priorityColors[message.priority],
          isFocusDimmed && "opacity-50"
        )}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn(
          "font-semibold text-foreground text-sm tracking-tight truncate transition-opacity duration-500",
          isFocusDimmed && "text-muted-foreground"
        )}>
          {message.sender}
        </p>
        <p className={cn(
          "text-muted-foreground text-sm leading-relaxed line-clamp-2 transition-opacity duration-500",
          isFocusDimmed && "text-muted-foreground/60"
        )}>
          {message.intent}
        </p>
        {!isFocusDimmed && <AILabel label={message.aiLabel} />}
      </div>
      
      {/* Meta */}
      <div className={cn(
        "flex flex-col items-end gap-1 text-xs text-muted-foreground/60 shrink-0 transition-opacity duration-500",
        isFocusDimmed && "opacity-50"
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
  isFocusDimmed?: boolean;
  isVisible: boolean;
}

function DemoSection({ label, messages, isFocusDimmed, isVisible }: DemoSectionProps) {
  if (messages.length === 0) return null;
  
  return (
    <div className={cn(
      "space-y-3 transition-all duration-500 ease-out",
      isFocusDimmed && "opacity-60"
    )}>
      <h3 className={cn(
        "text-xs font-medium uppercase tracking-wider px-1 transition-colors duration-500",
        isFocusDimmed ? "text-muted-foreground/40" : "text-muted-foreground/70"
      )}>
        {label}
      </h3>
      <div className="space-y-2">
        {messages.map((message) => (
          <DemoMessageRow 
            key={message.id} 
            message={message}
            isFocusDimmed={isFocusDimmed}
            isVisible={isVisible}
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
      style={{ transitionDelay: visible ? `${index * 80}ms` : "0ms" }}
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
function DemoActionsSection({ visible }: { visible: boolean }) {
  return (
    <div className={cn(
      "transition-all duration-500 ease-out",
      visible ? "opacity-100" : "opacity-0"
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
              visible={visible}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [scene, setScene] = useState<DemoScene>("loading");
  
  // Transition to focus mode after brief loading
  useEffect(() => {
    const timer = setTimeout(() => setScene("focus"), 400);
    return () => clearTimeout(timer);
  }, []);
  
  const isFocusActive = scene === "focus";
  
  const priorityGroups = {
    high: { label: "Requires Action", messages: DEMO_MESSAGES.filter(m => m.priority === "high") },
    medium: { label: "For Review", messages: DEMO_MESSAGES.filter(m => m.priority === "medium") },
    fyi: { label: "FYI", messages: DEMO_MESSAGES.filter(m => m.priority === "fyi") },
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <DemoHeader />
      
      <main className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Requires Action - Always prominent */}
          <DemoSection 
            {...priorityGroups.high}
            isFocusDimmed={false}
            isVisible={true}
          />
          
          {/* For Review - Always prominent */}
          <DemoSection 
            {...priorityGroups.medium}
            isFocusDimmed={false}
            isVisible={true}
          />
          
          {/* FYI - De-emphasized in focus mode */}
          <DemoSection 
            {...priorityGroups.fyi}
            isFocusDimmed={isFocusActive}
            isVisible={true}
          />
          
          {/* Next Actions - Always visible and prominent */}
          <DemoActionsSection visible={true} />
        </div>
      </main>
    </div>
  );
}