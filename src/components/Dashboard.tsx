import HeaderSection from "@/components/HeaderSection";
import { UserStatsOverview } from "@/components/UserStatsOverview";
import { RecentSessionsList } from "@/components/focus/RecentSessionsList";
import { FocusRewardsSection } from "@/components/focus/FocusRewardsSection";
import FocusRecoveryDashboard from "@/components/FocusRecoveryDashboard";
import { useFocusRecovery } from "@/hooks/useFocusRecovery";
import { Card, CardContent } from "@/components/ui/card";
import { AssistantChatPanel, ExecutionLockedTooltip } from "@/components/assistant";
import { AssistantReadOnlyProvider } from "@/contexts/AssistantReadOnlyContext";

interface DashboardProps {
  assistantName: string;
  subscriptionTier: string;
}

const Dashboard = ({ assistantName, subscriptionTier }: DashboardProps) => {
  const { focusSessions, missedMessages, generateRecoveryData } = useFocusRecovery();
  
  // Safe no-op handler for command palette
  const handleShowCommandPalette = () => {
    console.log("Command palette - coming soon");
  };

  // Calculate focus duration from most recent session
  const lastSession = focusSessions.length > 0 ? focusSessions[focusSessions.length - 1] : null;
  const focusDuration = lastSession ? `${lastSession.actualDuration} min` : "0 min";

  // Generate recovery data only if we have missed messages
  const hasRecoveryData = missedMessages && missedMessages.length > 0;
  const defaultFocusScore = lastSession?.score ?? 85;
  const recoveryData = hasRecoveryData ? generateRecoveryData(missedMessages, defaultFocusScore) : null;

  return (
    <AssistantReadOnlyProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <HeaderSection onShowCommandPalette={handleShowCommandPalette} />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <UserStatsOverview />
          <FocusRewardsSection />
          <RecentSessionsList />
          
          {/* Focus Recovery Dashboard - conditional render */}
          {hasRecoveryData && recoveryData ? (
            <FocusRecoveryDashboard
              data={recoveryData}
              focusDuration={focusDuration}
              onStartCatchUp={() => console.log("Start catch up")}
              onReviewLater={() => console.log("Review later")}
            />
          ) : (
            <Card className="bg-card/50 border-border/30">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No recovery data yet</p>
              </CardContent>
            </Card>
          )}

          {/* Assistant Chat Panel - Read-only mode */}
          <AssistantChatPanel />
        </main>
        
        {/* Global tooltip for execution locks */}
        <ExecutionLockedTooltip />
      </div>
    </AssistantReadOnlyProvider>
  );
};

export default Dashboard;
