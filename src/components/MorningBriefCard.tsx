import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useTasks } from "@/hooks/useTasks";

const MorningBriefCard = () => {
  const { currentStreak, isLoading: streakLoading } = useFocusStreaks();
  const { sessions, isLoading: sessionsLoading } = useFocusSessions();
  const { tasks, isLoading: tasksLoading } = useTasks();

  const isLoading = streakLoading || sessionsLoading || tasksLoading;

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate sessions today
  const today = new Date().toISOString().split('T')[0];
  const sessionsToday = sessions.filter(s => 
    s.start_time && s.start_time.startsWith(today) && s.is_completed
  ).length;

  // Get urgent tasks (high priority, pending)
  const urgentTasks = tasks.filter(t => 
    t.priority === 'high' && t.status === 'pending'
  );

  // Generate priorities (max 2, one protective)
  const generatePriorities = () => {
    const priorities: string[] = [];

    // Protective priority first - always add one
    if (sessionsToday === 0) {
      priorities.push("Start with a short focus session to build momentum.");
    } else if (currentStreak > 0) {
      priorities.push("Protect your focus streak. One session keeps it alive.");
    } else {
      priorities.push("Take things one step at a time today.");
    }

    // Action priority second (if urgent items exist)
    if (urgentTasks.length > 0) {
      const taskTitle = urgentTasks[0].title;
      const truncated = taskTitle.length > 40 ? taskTitle.slice(0, 40) + "…" : taskTitle;
      priorities.push(`Address: ${truncated}`);
    } else if (sessionsToday >= 2) {
      priorities.push("You've made good progress. Consider wrapping up intentionally.");
    }

    return priorities.slice(0, 2);
  };

  const priorities = generatePriorities();

  if (isLoading) {
    return (
      <div className="bg-card/30 border border-border/20 rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted/30 rounded w-48" />
          <div className="h-4 bg-muted/20 rounded w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card/40 to-card/20 border border-border/20 rounded-xl p-6 space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-lg font-medium text-foreground">
          {getGreeting()}. Here's your brief.
        </h2>
      </div>

      {/* State Snapshot */}
      <div className="space-y-2 text-sm text-muted-foreground">
        {/* Focus Streak */}
        <p>
          {currentStreak > 0 
            ? `Focus streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}.`
            : "No active focus streak."
          }
        </p>

        {/* Sessions Today */}
        <p>
          {sessionsToday > 0 
            ? `Sessions today: ${sessionsToday}.`
            : "No sessions completed today."
          }
        </p>

        {/* Urgent Items */}
        <p>
          {urgentTasks.length > 0 
            ? `Urgent items: ${urgentTasks.length}.`
            : "No urgent items."
          }
        </p>
      </div>

      {/* Priority Compression */}
      {priorities.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/10">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/60">
            Priorities
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            {priorities.map((priority, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground/40 select-none">—</span>
                <span>{priority}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calm Reassurance Close */}
      <p className="text-sm text-muted-foreground/70 pt-2">
        You're in control. Take it at your pace.
      </p>
    </div>
  );
};

export default MorningBriefCard;
