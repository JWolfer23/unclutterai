import FocusScoreCard from "@/components/FocusScoreCard";
import InboxView from "@/components/InboxView";
import TasksView from "@/components/TasksView";
import CatchUpAssistant from "@/components/CatchUpAssistant";
import TokenBalance from "@/components/TokenBalance";

interface DashboardProps {
  activeView?: 'overview' | 'inbox' | 'tasks' | 'focus' | 'tokens';
}

export default function Dashboard({ activeView = 'overview' }: DashboardProps) {
  console.log("Dashboard.tsx - Rendering with activeView:", activeView);
  
  const renderActiveView = () => {
    console.log("Dashboard.tsx - renderActiveView called with:", activeView);
    switch (activeView) {
      case 'inbox':
        console.log("Dashboard.tsx - Rendering InboxView");
        return <InboxView />;
      case 'tasks':
        console.log("Dashboard.tsx - Rendering TasksView");
        return <TasksView />;
      case 'focus':
        console.log("Dashboard.tsx - Rendering Focus view");
        return (
          <div className="space-y-6">
            <FocusScoreCard />
            {/* Add focus mode controls here */}
          </div>
        );
      case 'tokens':
        console.log("Dashboard.tsx - Rendering TokenBalance");
        return <TokenBalance />;
      default:
        console.log("Dashboard.tsx - Rendering overview (default)");
        return (
          <div className="space-y-6">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <FocusScoreCard />
                <CatchUpAssistant />
              </div>
              <div className="space-y-6">
                <TokenBalance />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </div>
    </div>
  );
}