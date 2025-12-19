import { useUCTMilestones } from '@/hooks/useUCTMilestones';
import { useAuth } from '@/hooks/useAuth';

// Provider that monitors UCT milestones for Pro unlock
export function UCTMilestoneProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Only run milestone monitoring when user is authenticated
  if (user) {
    return <UCTMilestoneMonitor>{children}</UCTMilestoneMonitor>;
  }
  
  return <>{children}</>;
}

// Separate component to avoid hook rules violation
function UCTMilestoneMonitor({ children }: { children: React.ReactNode }) {
  // This hook monitors UCT balance and triggers Pro unlock at 40 UCT
  useUCTMilestones();
  
  return <>{children}</>;
}
