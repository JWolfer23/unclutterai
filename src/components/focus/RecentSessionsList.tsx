import { Card, CardContent } from "@/components/ui/card";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { Clock, Coins } from "lucide-react";
import { format } from "date-fns";

const MODE_LABELS: Record<string, string> = {
  learning: "Learning",
  health: "Health",
  career: "Career",
  wealth: "Wealth",
  focus: "Focus",
  general: "General",
};

export const RecentSessionsList = () => {
  const { recentSessions, isLoading } = useFocusAnalytics();

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Focus Sessions</h3>
          <div className="h-48 flex items-center justify-center text-slate-500">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recentSessions.length) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Focus Sessions</h3>
          <div className="h-48 flex items-center justify-center text-slate-500">
            No sessions yet. Start focusing to see your history!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Focus Sessions</h3>
        
        <div className="space-y-3">
          {recentSessions.slice(0, 7).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {MODE_LABELS[session.mode?.toLowerCase() || 'general'] || 'Focus'} Session
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(session.start_time), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {session.actual_minutes || session.planned_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">
                    +{Number(session.uct_reward || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
