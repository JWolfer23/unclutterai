import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, Phone, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CommunicationMode = () => {
  const navigate = useNavigate();

  const platforms = [
    { name: "Email", icon: Mail, count: 0, color: "from-blue-500 to-cyan-500" },
    { name: "Text", icon: MessageSquare, count: 0, color: "from-green-500 to-emerald-500" },
    { name: "Voice", icon: Phone, count: 0, color: "from-purple-500 to-pink-500" },
    { name: "Social", icon: MessageCircle, count: 0, color: "from-orange-500 to-red-500" },
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
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, hsl(300, 83%, 65%), hsl(266, 83%, 65%))" }}>
            <MessageCircle className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Communication Mode</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Unified inbox with AI prioritization and summaries
            </p>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((platform, idx) => {
            const Icon = platform.icon;
            return (
              <Card key={idx} className="glass-card">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{platform.count}</div>
                    <div className="text-sm text-muted-foreground">{platform.name}</div>
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
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Unified communication hub across email, text, voice, and social with AI-powered prioritization and smart summaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationMode;
