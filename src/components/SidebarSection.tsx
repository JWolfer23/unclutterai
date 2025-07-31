
import FocusScoreCard from "@/components/FocusScoreCard";
import StatsOverview from "@/components/StatsOverview";
import DailyNotes from "@/components/DailyNotes";
import AIAssistant from "@/components/AIAssistant";
import SpamGuard from "@/components/SpamGuard";
import WalletSection from "@/components/WalletSection";

interface SidebarSectionProps {
  onMessageTypeFilter: (type: string | null) => void;
  onViewMessage: (messageId: number) => void;
  messages?: any[];
  onMessageAction?: (messageId: number, action: 'block' | 'unsubscribe' | 'safe' | 'quarantine') => void;
}

const SidebarSection = ({ 
  onMessageTypeFilter, 
  onViewMessage, 
  messages = [],
  onMessageAction = () => {}
}: SidebarSectionProps) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <FocusScoreCard />
      <StatsOverview 
        onMessageTypeFilter={onMessageTypeFilter}
        onViewMessage={onViewMessage}
      />
      <WalletSection />
      <DailyNotes />
      <AIAssistant />
    </div>
  );
};

export default SidebarSection;
