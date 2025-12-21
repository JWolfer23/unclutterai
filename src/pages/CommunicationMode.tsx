import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageCircle, 
  Mail, 
  Clock,
  Zap,
  Link2,
  Settings,
  RefreshCw,
  Loader2,
  Unlink,
  Sparkles
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGmailAuth } from "@/hooks/useGmailAuth";
import { useMicrosoftAuth } from "@/hooks/useMicrosoftAuth";
import { useExecutiveInbox } from "@/hooks/useExecutiveInbox";
import { useActionPlan } from "@/hooks/useActionPlan";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { SmartStreamView } from "@/components/smart-stream";
import { ExecutiveInbox, InboxStatsCards } from "@/components/inbox";

const CommunicationMode = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inbox");
  
  const { 
    isConnected: gmailConnected, 
    activeCredential, 
    loading: gmailLoading, 
    syncing, 
    connectGmail, 
    disconnectGmail, 
    syncNow,
    reAnalyze 
  } = useGmailAuth();

  const {
    isConnected: outlookConnected,
    activeCredential: microsoftCredential,
    isConnecting: microsoftConnecting,
    isRefreshing: microsoftSyncing,
    connectMicrosoft,
    disconnectMicrosoft,
    syncEmails: syncMicrosoftEmails
  } = useMicrosoftAuth();
  
  // Use unified Executive Inbox
  const { 
    messages: inboxMessages, 
    stats, 
    isLoading: messagesLoading,
    isSyncing,
    isConnected,
    syncAll
  } = useExecutiveInbox();
  
  const { 
    actionPlan, 
    isGenerating, 
    generateActionPlan, 
    claimTask,
    completeTask,
    isClaiming 
  } = useActionPlan();


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

      {/* Connection Banner */}
      {!isConnected && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Connect Your Gmail</h3>
                  <p className="text-sm text-slate-300">Sync your inbox and let AI prioritize your messages</p>
                </div>
              </div>
              <Button
                onClick={connectGmail}
                disabled={gmailLoading}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90"
              >
                {gmailLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Connect Gmail
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Functional Tiles - Using unified inbox stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <InboxStatsCards />
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

          {/* Smart Inbox Tab - Now using Executive Inbox */}
          <TabsContent value="inbox" className="space-y-4">
            <div className="learning-panel">
              <ExecutiveInbox showHeader={true} />
            </div>
          </TabsContent>

          {/* Action Plan Tab - Now using Smart Stream */}
          <TabsContent value="action" className="space-y-4">
            <div className="learning-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white">
                    Smart Stream
                  </h3>
                  <p className="text-sm text-slate-400">
                    AI-organized tasks and messages for cognitive flow
                  </p>
                </div>
                <Button
                  onClick={() => generateActionPlan()}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Refresh Plan'}
                </Button>
              </div>

              {/* Smart Stream View */}
              <SmartStreamView defaultFilter="today" />
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
                    <h4 className="text-lg font-semibold text-white">
                      Urgent ({inboxMessages.filter(m => m.priority_score === 5).length})
                    </h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {inboxMessages
                      .filter(m => m.priority_score === 5)
                      .slice(0, 3)
                      .map(msg => (
                        <li key={msg.id}>• {msg.sender_name}: {msg.subject}</li>
                      ))}
                    {inboxMessages.filter(m => m.priority_score === 5).length === 0 && (
                      <li className="text-slate-400">No urgent messages</li>
                    )}
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">✨</span>
                    <h4 className="text-lg font-semibold text-white">
                      Important ({inboxMessages.filter(m => m.priority_score === 4).length})
                    </h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {inboxMessages
                      .filter(m => m.priority_score === 4)
                      .slice(0, 3)
                      .map(msg => (
                        <li key={msg.id}>• {msg.sender_name}: {msg.subject}</li>
                      ))}
                    {inboxMessages.filter(m => m.priority_score === 4).length === 0 && (
                      <li className="text-slate-400">No important messages</li>
                    )}
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-slate-500/15 to-slate-600/15 border border-slate-500/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⚪</span>
                    <h4 className="text-lg font-semibold text-white">
                      Can Wait ({inboxMessages.filter(m => !m.priority_score || m.priority_score <= 2).length})
                    </h4>
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
                    Preferences + Connections
                  </h3>
                  <p className="text-sm text-slate-400">
                    Manage your email connections and AI preferences
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Gmail Connection */}
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/50">
                  <h4 className="text-white font-medium mb-4">Email Connections</h4>
                  
                  <div className="space-y-3">
                    {/* Gmail */}
                    {isConnected && activeCredential ? (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">Gmail</div>
                            <div className="text-xs text-emerald-400">{activeCredential.email_address}</div>
                            {activeCredential.last_sync_at && (
                              <div className="text-xs text-slate-400">
                                Last sync: {formatDistanceToNow(new Date(activeCredential.last_sync_at), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={syncNow}
                            disabled={syncing}
                            variant="outline"
                            size="sm"
                            className="border-emerald-500/50 text-emerald-300"
                          >
                            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </Button>
                          <Button
                            onClick={() => disconnectGmail(activeCredential.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">Gmail</div>
                            <div className="text-xs text-slate-400">Not connected</div>
                          </div>
                        </div>
                        <Button
                          onClick={connectGmail}
                          disabled={gmailLoading}
                          size="sm"
                          className="bg-gradient-to-r from-red-500 to-yellow-500"
                        >
                          {gmailLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Connect
                        </Button>
                      </div>
                    )}

                    {/* Microsoft Outlook */}
                    {outlookConnected && microsoftCredential ? (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">Microsoft Outlook</div>
                            <div className="text-xs text-emerald-400">{microsoftCredential.email_address}</div>
                            {microsoftCredential.last_sync_at && (
                              <div className="text-xs text-slate-400">
                                Last sync: {formatDistanceToNow(new Date(microsoftCredential.last_sync_at), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => syncMicrosoftEmails()}
                            disabled={microsoftSyncing}
                            variant="outline"
                            size="sm"
                            className="border-emerald-500/50 text-emerald-300"
                          >
                            {microsoftSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </Button>
                          <Button
                            onClick={() => disconnectMicrosoft(microsoftCredential.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">Microsoft Outlook</div>
                            <div className="text-xs text-slate-400">Not connected</div>
                          </div>
                        </div>
                        <Button
                          onClick={connectMicrosoft}
                          disabled={microsoftConnecting}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-blue-700"
                        >
                          {microsoftConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Connect
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-Reply Rules */}
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunicationMode;
