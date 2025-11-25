import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Target, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const CareerMode = () => {
  const navigate = useNavigate();

  const careerMetrics = [
    { icon: Target, label: "Active Goals", value: "0", color: "from-blue-500 to-indigo-500" },
    { icon: TrendingUp, label: "Growth Score", value: "0", color: "from-purple-500 to-pink-500" },
    { icon: Users, label: "Network", value: "0", color: "from-cyan-500 to-blue-500" },
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
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, hsl(217, 91%, 60%), hsl(266, 83%, 65%))" }}>
            <Briefcase className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Career Mode</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track goals, network, and professional growth
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {careerMetrics.map((metric, idx) => {
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
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Manage job goals, track promotions, network milestones, and get AI-powered career guidance with UCT rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerMode;
