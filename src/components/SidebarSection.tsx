
import FocusScoreCard from "@/components/FocusScoreCard";
import StatsOverview from "@/components/StatsOverview";
import DailyNotes from "@/components/DailyNotes";
import AIAssistant from "@/components/AIAssistant";

interface SidebarSectionProps {
  onMessageTypeFilter: (type: string | null) => void;
  onViewMessage: (messageId: number) => void;
}

const SidebarSection = ({ onMessageTypeFilter, onViewMessage }: SidebarSectionProps) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <FocusScoreCard />
      <StatsOverview 
        onMessageTypeFilter={onMessageTypeFilter}
        onViewMessage={onViewMessage}
      />
      <DailyNotes />
      <AIAssistant />
    </div>
  );
};

export default SidebarSection;
