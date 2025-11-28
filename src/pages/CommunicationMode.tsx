import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageCircle, 
  Mail, 
  Phone, 
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
  Zap,
  Brain,
  Link2,
  Settings
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CommunicationMode = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inbox");

  // Mock data
  const stats = {
    unreadCount: 47,
    urgent: 8,
    reply: 15,
    ignore: 24,
    clarityScore: 72,
    actionItems: 12
  };

  const messages = [
    {
      id: 1,
      sender: "Sarah Chen",
      subject: "Q4 Budget Review",
      preview: "Can we sync on the budget allocation for...",
      priority: "urgent",
      platform: "email",
      time: "10m ago"
    },
    {
      id: 2,
      sender: "Marketing Team",
      subject: "Campaign Performance Update",
      preview: "This week's metrics look strong across...",
      priority: "actionable",
      platform: "slack",
      time: "1h ago"
    },
    {
      id: 3,
      sender: "Newsletter",
      subject: "Weekly Digest",
      preview: "Top stories from this week...",
      priority: "ignore",
      platform: "email",
      time: "2h ago"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "actionable": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "ignore": return "text-slate-400 bg-slate-500/10 border-slate-500/30";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return "🔴";
      case "actionable": return "🟡";
      case "ignore": return "⚪";
      default: return "⚪";
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="learning-icon bg-gradient-to-br from-indigo-500 to-blue-500">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-sora font-bold bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Communication Mode
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Message mastery — command your day
            </p>
          </div>
        </div>
      </div>

      {/* Top Functional Tiles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
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
              {stats.unreadCount}
            </div>
            <div className="text-sm text-slate-300 mb-3">Unread Messages</div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                🔴 {stats.urgent} Urgent
              </span>
              <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                🟡 {stats.reply} Reply
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30">
                ⚪ {stats.ignore} Ignore
              </span>
            </div>
          </div>

          {/* Active Action Plan */}
          <div className="learning-stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="learning-icon bg-gradient-to-br from-blue-500 to-cyan-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <Zap className="h-4 w-4 text-blue-400 opacity-50" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
              {stats.actionItems}
            </div>
            <div className="text-sm text-slate-300 mb-3">Active Action Items</div>
            <div className="text-xs text-slate-400">
              Generated from messages
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
              {stats.clarityScore}
            </div>
            <div className="text-sm text-slate-300 mb-3">Inbox Clarity Score</div>
            <div className="text-xs text-slate-400">
              How organized your communications are
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="learning-tabs mb-6">
            <TabsTrigger value="inbox" className="gap-2">
              <Mail className="h-4 w-4" />
              Smart Inbox
            </TabsTrigger>
            <TabsTrigger value="action" className="gap-2">
              <Zap className="h-4 w-4" />
              Action Plan
            </TabsTrigger>
            <TabsTrigger value="catchup" className="gap-2">
              <Clock className="h-4 w-4" />
              Focus Catch-Up
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <Link2 className="h-4 w-4" />
              Linked Workflows
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Smart Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            <div className="learning-panel">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-sora font-semibold text-white">
                  Smart Inbox
                </h3>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>

              <div className="space-y-3">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs border ${getPriorityColor(msg.priority)}`}>
                          {getPriorityIcon(msg.priority)} {msg.priority}
                        </span>
                        <span className="text-sm text-slate-400">{msg.platform}</span>
                      </div>
                      <span className="text-xs text-slate-500">{msg.time}</span>
                    </div>
                    <div className="text-white font-medium mb-1">{msg.sender}</div>
                    <div className="text-sm text-slate-300 mb-1">{msg.subject}</div>
                    <div className="text-xs text-slate-400">{msg.preview}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400 mb-4">
                  AI labels every message to help you focus on what matters
                </p>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Train AI on your preferences →
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Action Plan Tab */}
          <TabsContent value="action" className="space-y-4">
            <div className="learning-panel">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-sora font-semibold text-white">
                  AI Action Plan
                </h3>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Plan
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-400">🔴 Urgent</span>
                  </div>
                  <div className="text-white font-medium mb-1">Review Q4 budget with Sarah</div>
                  <div className="text-sm text-slate-300">Due: Today, 3 PM</div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">🟡 This Week</span>
                  </div>
                  <div className="text-white font-medium mb-1">Analyze marketing campaign performance</div>
                  <div className="text-sm text-slate-300">From: Marketing Team</div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400">📋 Ongoing Projects</span>
                  </div>
                  <div className="text-white font-medium mb-1">Sync with product team on roadmap</div>
                  <div className="text-sm text-slate-300">3 related messages</div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-sm text-slate-300 mb-2">
                  💡 <strong>AI Insight:</strong> You tend to reply fastest to Sarah's messages. Want to prioritize her emails?
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Focus Catch-Up Tab */}
          <TabsContent value="catchup" className="space-y-4">
            <div className="learning-panel">
              <div className="flex items-center gap-3 mb-6">
                <div className="learning-icon bg-gradient-to-br from-purple-500 to-pink-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white">
                    Focus Mode Catch-Up
                  </h3>
                  <p className="text-sm text-slate-400">
                    Here's what you missed, what's urgent, and what can wait
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/15 to-orange-500/15 border border-red-500/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🔴</span>
                    <h4 className="text-lg font-semibold text-white">Urgent (2)</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Sarah Chen needs budget review by 3 PM</li>
                    <li>• Client approval needed for proposal</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">✨</span>
                    <h4 className="text-lg font-semibold text-white">Opportunities (3)</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Speaking invitation for tech conference</li>
                    <li>• Potential partnership inquiry</li>
                    <li>• Press mention in industry newsletter</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-slate-500/15 to-slate-600/15 border border-slate-500/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⚪</span>
                    <h4 className="text-lg font-semibold text-white">Can Wait (18)</h4>
                  </div>
                  <p className="text-sm text-slate-400">
                    Newsletters, promotions, and low-priority updates
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Linked Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <div className="learning-panel">
              <div className="flex items-center gap-3 mb-6">
                <div className="learning-icon bg-gradient-to-br from-cyan-500 to-blue-500">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white">
                    Linked Workflows
                  </h3>
                  <p className="text-sm text-slate-400">
                    Connect messages to your task managers and calendars
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">N</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Notion</div>
                      <div className="text-xs text-slate-400">Not connected</div>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    Connect
                  </button>
                </div>

                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">C</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">ClickUp</div>
                      <div className="text-xs text-slate-400">Not connected</div>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    Connect
                  </button>
                </div>

                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">G</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Google Calendar</div>
                      <div className="text-xs text-slate-400">Not connected</div>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    Connect
                  </button>
                </div>

                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Asana</div>
                      <div className="text-xs text-slate-400">Not connected</div>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    Connect
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/30">
                <p className="text-sm text-slate-300">
                  💡 When connected, actionable messages will automatically create tasks in your preferred tools
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <div className="learning-panel">
              <div className="flex items-center gap-3 mb-6">
                <div className="learning-icon bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white">
                    Preferences + Rules
                  </h3>
                  <p className="text-sm text-slate-400">
                    Teach the AI how you like to reply, defer, or delegate
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50">
                  <h4 className="text-white font-medium mb-3">Auto-Reply Rules</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40">
                      <span className="text-sm text-slate-300">Auto-archive newsletters</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40">
                      <span className="text-sm text-slate-300">Prioritize team messages</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40">
                      <span className="text-sm text-slate-300">Mute promotional emails</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50">
                  <h4 className="text-white font-medium mb-3">Response Tone</h4>
                  <select className="w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-sm">
                    <option>Professional & Concise</option>
                    <option>Friendly & Warm</option>
                    <option>Direct & Efficient</option>
                    <option>Creative & Casual</option>
                  </select>
                </div>

                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50">
                  <h4 className="text-white font-medium mb-3">VIP Senders</h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Always prioritize messages from these contacts
                  </p>
                  <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    Add VIP Contact
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunicationMode;
