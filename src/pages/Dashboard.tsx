import FocusScorecard from "@/components/FocusScoreCard";
import InboxView from "@/components/InboxView";
import TasksView from "@/components/TasksView";
import CatchUpAssistant from "@/components/CatchUpAssistant";
import TokenBalance from "@/components/TokenBalance";

interface DashboardProps {
  activeView: 'overview' | 'inbox' | 'tasks' | 'focus' | 'tokens';
}

export default function Dashboard({ activeView }: DashboardProps) {
  const renderActiveView = () => {
    switch (activeView) {
      case 'inbox':
        return <InboxView />;
      case 'tasks':
        return <TasksView />;
      case 'focus':
        return (
          <div className="space-y-6">
            <FocusScorecard />
            {/* Add focus mode controls here */}
          </div>
        );
      case 'tokens':
        return <TokenBalance />;
      default:
        return (
          <div className="space-y-6">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <FocusScorecard />
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