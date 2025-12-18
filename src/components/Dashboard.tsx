import HeaderSection from "@/components/HeaderSection";

interface DashboardProps {
  assistantName: string;
  subscriptionTier: string;
}

const Dashboard = ({ assistantName, subscriptionTier }: DashboardProps) => {
  // Safe no-op handler for command palette
  const handleShowCommandPalette = () => {
    console.log("Command palette - coming soon");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <HeaderSection onShowCommandPalette={handleShowCommandPalette} />
    </div>
  );
};

export default Dashboard;
