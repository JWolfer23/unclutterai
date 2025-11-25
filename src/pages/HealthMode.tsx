import { useNavigate } from "react-router-dom";
import { ArrowLeft, HeartPulse, Activity, Moon, Footprints } from "lucide-react";
import { Card } from "@/components/ui/card";

const HealthMode = () => {
  const navigate = useNavigate();

  const healthMetrics = [
    { icon: Activity, label: "Wellness Score", value: "0", color: "from-green-500 to-emerald-500" },
    { icon: Moon, label: "Sleep Quality", value: "0h", color: "from-indigo-500 to-purple-500" },
    { icon: Footprints, label: "Movement", value: "0", color: "from-cyan-500 to-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to modes
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="metric-icon metric-icon--community">
            <HeartPulse className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Health Mode</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Digital wellbeing through mindful breaks and habits
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {healthMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx} className="glass-card">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="glass-card">
          <div className="text-center py-12">
            <HeartPulse className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Track wellness habits, get reminders for breaks and movement, and earn UCT tokens for consistency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthMode;
