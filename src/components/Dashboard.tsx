import { useState } from "react";
import { Link } from "react-router-dom";
import HeaderSection from "@/components/HeaderSection";
import MorningBriefCard from "@/components/MorningBriefCard";
import { UserStatsOverview } from "@/components/UserStatsOverview";
import { RecentSessionsList } from "@/components/focus/RecentSessionsList";
import { FocusRewardsSection } from "@/components/focus/FocusRewardsSection";
import FocusRecoveryDashboard from "@/components/FocusRecoveryDashboard";
import { useFocusRecovery } from "@/hooks/useFocusRecovery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssistantChatPanel, ExecutionLockedTooltip } from "@/components/assistant";
import { AssistantReadOnlyProvider } from "@/contexts/AssistantReadOnlyContext";
import OSView from "@/components/OSView";
import { type NextBestAction } from "@/hooks/useNextBestAction";
import { ArrowRight } from "lucide-react";

interface DashboardProps {
  assistantName: string;
  subscriptionTier: string;
  nextBestAction: NextBestAction;
}

const Dashboard = ({ assistantName, subscriptionTier, nextBestAction }: DashboardProps) => {
  const { focusSessions, missedMessages, generateRecoveryData } = useFocusRecovery();
  const [showOSView, setShowOSView] = useState(false);
  
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

  // Show OS View as separate view (not overlay)
  if (showOSView) {
    return <OSView onClose={() => setShowOSView(false)} />;
  }

  return (
    <AssistantReadOnlyProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <HeaderSection 
          onShowCommandPalette={handleShowCommandPalette} 
          onShowOSView={() => setShowOSView(true)}
        />
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Next Best Action Card */}
          <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
            <CardContent className="py-5 px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-foreground">{nextBestAction.title}</h3>
                  <p className="text-sm text-muted-foreground">{nextBestAction.description}</p>
                </div>
                <Button asChild variant="default" size="sm" className="shrink-0">
                  <Link to={nextBestAction.href}>
                    {nextBestAction.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <MorningBriefCard />
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
                <p className="text-muted-foreground text-sm">No recovery data yet. Complete a focus session to see what you missed.</p>
              </CardContent>
            </Card>
          )}
        </main>
        
        {/* Assistant Panel - Fixed at bottom, never obscures primary content */}
        <footer className="container mx-auto px-4 pb-6 pt-2">
          <AssistantChatPanel />
        </footer>
        
        {/* Global tooltip for execution locks */}
        <ExecutionLockedTooltip />
      </div>
    </AssistantReadOnlyProvider>
  );
};

export default Dashboard;
