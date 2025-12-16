import { ArrowLeft, Brain, Newspaper, GraduationCap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IntelligenceFeed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white px-6 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/50 via-sky-300/35 to-blue-200/20 flex items-center justify-center">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Intelligence Feed</h1>
            <p className="text-white/50 text-sm">Only what matters</p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-6">
            <Brain className="h-10 w-10 text-cyan-400/60" />
          </div>
          
          <h2 className="text-xl font-medium mb-3">Coming Soon</h2>
          <p className="text-white/50 text-sm max-w-md mx-auto mb-8">
            A unified feed combining curated news and learning content. AI filters out the noise, 
            delivering only intelligence that moves the needle.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Newspaper, label: "Curated News" },
              { icon: GraduationCap, label: "Learning" },
              { icon: Brain, label: "AI Insights" },
              { icon: Sparkles, label: "Signal Only" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <item.icon className="h-5 w-5 text-white/40 mx-auto mb-2" />
                <span className="text-xs text-white/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceFeed;
