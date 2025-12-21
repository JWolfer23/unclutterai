import { 
  Mail, 
  Brain, 
  Sparkles,
  Zap
} from "lucide-react";
import { useExecutiveInbox } from "@/hooks/useExecutiveInbox";

export function InboxStatsCards() {
  const { stats, messages } = useExecutiveInbox();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Unread Message Count */}
      <div className="learning-stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between mb-4">
          <div className="learning-icon bg-gradient-to-br from-indigo-500 to-blue-500">
            <Mail className="h-5 w-5" />
          </div>
          <Sparkles className="h-4 w-4 text-indigo-400 opacity-50" />
        </div>
        <div className="text-4xl font-bold bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent mb-2">
          {stats.totalUnread}
        </div>
        <div className="text-sm text-slate-300 mb-3">Unread Messages</div>
        <div className="flex gap-2 text-xs flex-wrap">
          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
            🔴 {stats.urgentCount} Urgent
          </span>
          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
            🟡 {stats.importantCount} Normal
          </span>
          <span className="px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30">
            ⚪ {stats.lowPriorityCount} Low
          </span>
        </div>
      </div>

      {/* Action Items */}
      <div className="learning-stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between mb-4">
          <div className="learning-icon bg-gradient-to-br from-blue-500 to-cyan-500">
            <Zap className="h-5 w-5" />
          </div>
          <Zap className="h-4 w-4 text-blue-400 opacity-50" />
        </div>
        <div className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
          {stats.urgentCount + stats.importantCount}
        </div>
        <div className="text-sm text-slate-300 mb-3">Action Items</div>
        <div className="text-xs text-slate-400">
          High-priority messages needing response
        </div>
      </div>

      {/* Inbox Clarity Score */}
      <div className="learning-stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between mb-4">
          <div className="learning-icon bg-gradient-to-br from-cyan-500 to-indigo-500">
            <Brain className="h-5 w-5" />
          </div>
          <Sparkles className="h-4 w-4 text-cyan-400 opacity-50" />
        </div>
        <div className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent mb-2">
          {stats.clarityScore}%
        </div>
        <div className="text-sm text-slate-300 mb-3">Inbox Clarity Score</div>
        <div className="text-xs text-slate-400">
          {messages.length} total messages synced
        </div>
      </div>
    </div>
  );
}
