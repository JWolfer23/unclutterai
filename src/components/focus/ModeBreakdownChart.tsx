import { Card, CardContent } from "@/components/ui/card";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const MODE_COLORS: Record<string, string> = {
  learning: "#06b6d4", // cyan
  health: "#10b981", // emerald
  career: "#3b82f6", // blue
  wealth: "#f59e0b", // amber
  focus: "#a855f7", // purple
  general: "#8b5cf6", // violet
};

export const ModeBreakdownChart = () => {
  const { modeBreakdown, isLoading } = useFocusAnalytics();

  if (isLoading || !modeBreakdown.length) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Where You're Focusing</h3>
          <div className="h-48 flex items-center justify-center text-slate-500">
            {isLoading ? "Loading..." : "Complete focus sessions to see breakdown"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = modeBreakdown.map((item) => ({
    name: item.mode ? item.mode.charAt(0).toUpperCase() + item.mode.slice(1) : 'General',
    value: item.total_minutes,
    sessions: item.session_count,
    color: MODE_COLORS[item.mode?.toLowerCase() || 'general'] || MODE_COLORS.general,
  }));

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Where You're Focusing</h3>
        
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value} min (${props.payload.sessions} sessions)`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-slate-300 text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
