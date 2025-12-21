import { useState, useMemo } from "react";
import { 
  Mail, 
  RefreshCw, 
  Loader2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useExecutiveInbox, InboxMessage } from "@/hooks/useExecutiveInbox";

// Deterministic subtext based on current hour (stable within the hour)
const getEmptyStateSubtext = (): string => {
  const hour = new Date().getHours();
  const subtexts = [
    "Your assistant is monitoring everything.",
    "You're clear. We'll interrupt only if it matters.",
    "All loops are closed."
  ];
  return subtexts[hour % 3];
};

// Calm empty state component
const InboxEmptyState = () => {
  const subtext = useMemo(() => getEmptyStateSubtext(), []);
  
  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-8">
      {/* Soft ambient glow background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-sm">
        <h2 className="text-xl font-medium text-foreground mb-3">
          Nothing needs your attention.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {subtext}
        </p>
        
        {/* Muted timestamp */}
        <p className="text-xs text-muted-foreground/50 mt-8">
          Last checked: just now
        </p>
      </div>
    </div>
  );
};

interface ExecutiveInboxProps {
  onMessageSelect?: (message: InboxMessage) => void;
  showHeader?: boolean;
}

const getPriorityColor = (score: number | null) => {
  if (!score) return "text-muted-foreground bg-muted/50 border-border";
  if (score >= 4) return "text-red-400 bg-red-500/10 border-red-500/30";
  if (score === 3) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-muted-foreground bg-muted/50 border-border";
};

const getPriorityLabel = (score: number | null) => {
  if (!score) return { icon: "⚪", label: "unscored" };
  if (score === 5) return { icon: "🔴", label: "urgent" };
  if (score === 4) return { icon: "🟠", label: "important" };
  if (score === 3) return { icon: "🟡", label: "normal" };
  if (score === 2) return { icon: "🔵", label: "low" };
  return { icon: "⚪", label: "ignore" };
};

// Subtle source indicator - only in metadata
const SourceBadge = ({ source }: { source: "gmail" | "outlook" }) => (
  <span className="text-xs text-muted-foreground opacity-60">
    {source === "gmail" ? "G" : "O"}
  </span>
);

export function ExecutiveInbox({ onMessageSelect, showHeader = true }: ExecutiveInboxProps) {
  const { 
    messages, 
    stats,
    isLoading, 
    isSyncing,
    isConnected,
    syncAll 
  } = useExecutiveInbox();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">No email accounts connected</p>
        <p className="text-sm text-muted-foreground/70">
          Connect Gmail or Outlook in Preferences to see your inbox
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return <InboxEmptyState />;
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">Inbox</h3>
            <span className="text-sm text-muted-foreground">
              {stats.totalUnread} unread
            </span>
            {stats.urgentCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                <AlertCircle className="h-3 w-3" />
                {stats.urgentCount} urgent
              </span>
            )}
          </div>
          <Button
            onClick={syncAll}
            disabled={isSyncing}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {messages.map((msg) => {
          const priority = getPriorityLabel(msg.priority_score);
          const isSelected = selectedIds.has(msg.id);
          
          return (
            <div
              key={msg.id}
              onClick={() => {
                toggleSelection(msg.id);
                onMessageSelect?.(msg);
              }}
              className={`p-4 rounded-xl bg-card border transition-all cursor-pointer group ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${!msg.is_read ? "bg-accent/20" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs border ${getPriorityColor(msg.priority_score)}`}>
                    {priority.icon} {priority.label}
                  </span>
                  {msg.priority_score && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {msg.priority_score}/5
                    </span>
                  )}
                  <SourceBadge source={msg.source} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {msg.received_at 
                    ? formatDistanceToNow(new Date(msg.received_at), { addSuffix: true })
                    : ""
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${msg.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                  {msg.sender_name}
                </span>
                {!msg.is_read && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              
              <div className={`text-sm mb-1 ${msg.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                {msg.subject}
              </div>
              
              <div className="text-xs text-muted-foreground line-clamp-2">
                {msg.preview}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-3 w-3" />
          Messages sorted by AI priority across all accounts
        </p>
      </div>
    </div>
  );
}
