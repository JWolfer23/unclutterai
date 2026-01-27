import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cohesive Presentation Demo for UnclutterAI
 * Supports Scenes 2-5 of product video for Google Startup Grant review.
 * Static, calm, production-grade. No interactivity.
 */

type DemoScene = "intro" | "inbox" | "intelligence" | "tasks";

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
  messageId: string;
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
  { id: "t1", action: "Approve contract", source: "Sarah Chen", messageId: "1", priority: "high" },
  { id: "t2", action: "Unblock deployment", source: "DevOps Team", messageId: "2", priority: "high" },
  { id: "t3", action: "Review proposal", source: "Michael Torres", messageId: "3", priority: "medium" },
  { id: "t4", action: "Provide roadmap feedback", source: "Product Team", messageId: "4", priority: "medium" },
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
  fyi: "bg-transparent",
};

// Components

function DemoHeader({ scene }: { scene: DemoScene }) {
  return (
    <header className="border-b border-border/30 px-8 py-6 bg-background/50 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Unified Inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            {scene === "intro" 
              ? "Monitoring 3 channels" 
              : "7 messages across 3 channels"}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs border-border/50 transition-all duration-500",
            scene === "tasks" ? "text-primary border-primary/30" : "text-muted-foreground"
          )}
        >
          {scene === "tasks" ? "4 actions identified" : "All synced"}
        </Badge>
      </div>
    </header>
  );
}

function AILabel({ label, visible, delay }: { label: string; visible: boolean; delay: number }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2 mt-1.5 transition-all duration-500",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
      <span className="text-xs font-medium text-primary">{label}</span>
    </div>
  );
}

interface DemoMessageRowProps {
  message: DemoMessage;
  scene: DemoScene;
  messageIndex: number;
  globalIndex: number;
}

function DemoMessageRow({ message, scene, messageIndex, globalIndex }: DemoMessageRowProps) {
  const SourceIcon = sourceIcons[message.source];
  
  // Visibility based on scene
  const isVisible = scene !== "intro";
  const showPriorityBar = scene === "intelligence" || scene === "tasks";
  const showAILabel = scene === "intelligence" || scene === "tasks";
  const isDimmed = (scene === "intelligence" || scene === "tasks") && message.priority === "fyi";
  
  // Stagger delays
  const messageDelay = messageIndex * 300;
  const labelDelay = globalIndex * 150;
  
  return (
    <div 
      className={cn(
        "flex items-start gap-4 py-5 px-6 bg-card/30 rounded-2xl border border-border/20 transition-all duration-500 ease-out",
        isDimmed && "opacity-50",
        !isVisible && "opacity-0 translate-y-2"
      )}
      style={{ 
        transitionDelay: isVisible && scene === "inbox" ? `${messageDelay}ms` : "0ms" 
      }}
    >
      {/* Priority indicator */}
      <div 
        className={cn(
          "w-1 h-12 rounded-full transition-all duration-300 mt-1",
          showPriorityBar ? priorityColors[message.priority] : "bg-transparent"
        )}
        style={{ transitionDelay: showPriorityBar ? "200ms" : "0ms" }}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-semibold text-foreground text-base tracking-tight">
          {message.sender}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {message.intent}
        </p>
        <AILabel 
          label={message.aiLabel} 
          visible={showAILabel} 
          delay={labelDelay}
        />
      </div>
      
      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground/60 pt-1">
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3.5 w-3.5" />
          <span>{sourceLabels[message.source]}</span>
        </div>
        <span>{message.time}</span>
      </div>
    </div>
  );
}

interface DemoSectionProps {
  label: string;
  messages: DemoMessage[];
  scene: DemoScene;
  startIndex: number;
}

function DemoSection({ label, messages, scene, startIndex }: DemoSectionProps) {
  if (messages.length === 0) return null;
  
  const isVisible = scene !== "intro";
  
  return (
    <div 
      className={cn(
        "space-y-3 transition-all duration-500",
        !isVisible && "opacity-0"
      )}
      style={{ transitionDelay: isVisible ? `${startIndex * 300}ms` : "0ms" }}
    >
      <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider pl-2">
        {label}
      </h3>
      <div className="space-y-2">
        {messages.map((message, idx) => (
          <DemoMessageRow 
            key={message.id} 
            message={message}
            scene={scene}
            messageIndex={startIndex + idx}
            globalIndex={startIndex + idx}
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
        "flex items-start gap-3 py-4 px-4 bg-card/20 rounded-xl border border-border/20 transition-all duration-500",
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      )}
      style={{ transitionDelay: visible ? `${600 + index * 200}ms` : "0ms" }}
    >
      {/* Priority bar */}
      <div className={cn(
        "w-1 h-10 rounded-full mt-0.5",
        task.priority === "high" ? "bg-amber-600" : "bg-blue-500"
      )} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{task.action}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          from {task.source}
        </p>
      </div>
    </div>
  );
}

function DemoTaskPanel({ scene }: { scene: DemoScene }) {
  const isVisible = scene === "tasks";
  
  return (
    <div 
      className={cn(
        "w-72 shrink-0 transition-all duration-600 ease-out",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
      )}
    >
      <div className="bg-card/20 rounded-2xl border border-border/20 p-5 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4 tracking-tight">
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
  const [scene, setScene] = useState<DemoScene>("intro");
  
  // Automatic scene progression
  useEffect(() => {
    const timers = [
      setTimeout(() => setScene("inbox"), 2000),        // Scene 3: Messages appear
      setTimeout(() => setScene("intelligence"), 7000), // Scene 4: AI labels appear
      setTimeout(() => setScene("tasks"), 13000),       // Scene 5: Task panel slides in
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  
  const priorityGroups = {
    high: { label: "Requires Action", messages: DEMO_MESSAGES.filter(m => m.priority === "high") },
    medium: { label: "For Review", messages: DEMO_MESSAGES.filter(m => m.priority === "medium") },
    fyi: { label: "FYI", messages: DEMO_MESSAGES.filter(m => m.priority === "fyi") },
  };
  
  // Calculate start indices for staggered animations
  const highStartIndex = 0;
  const mediumStartIndex = priorityGroups.high.messages.length;
  const fyiStartIndex = mediumStartIndex + priorityGroups.medium.messages.length;
  
  return (
    <div className="min-h-screen bg-[#0b0b0d]">
      <DemoHeader scene={scene} />
      
      <main className="px-8 py-8">
        <div className="max-w-5xl mx-auto flex gap-8">
          {/* Message List */}
          <div className="flex-1 space-y-8">
            <DemoSection 
              {...priorityGroups.high} 
              scene={scene} 
              startIndex={highStartIndex}
            />
            <DemoSection 
              {...priorityGroups.medium} 
              scene={scene} 
              startIndex={mediumStartIndex}
            />
            <DemoSection 
              {...priorityGroups.fyi} 
              scene={scene} 
              startIndex={fyiStartIndex}
            />
          </div>
          
          {/* Task Panel (Scene 5) */}
          <DemoTaskPanel scene={scene} />
        </div>
      </main>
    </div>
  );
}
