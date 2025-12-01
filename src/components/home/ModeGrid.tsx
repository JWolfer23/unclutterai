// src/components/home/ModeGrid.tsx
import { useState } from "react";
import {
  ArrowUpRight,
  Newspaper,
  GraduationCap,
  HeartPulse,
  BriefcaseBusiness,
  CircleDollarSign,
  MessageCircle,
  Coins,
  Users,
  Bitcoin,
  SlidersHorizontal,
  Activity,
} from "lucide-react";
import logoTransparent from "@/assets/logo-transparent.png";

export type ModeId =
  | "focus"
  | "news"
  | "learning"
  | "health"
  | "career"
  | "wealth"
  | "communication"
  | "uctTokens"
  | "community"
  | "crypto"
  | "customize"
  | "aiUsage";

interface Mode {
  id: ModeId;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  outline: string; // CSS gradient for the border glow
  isAvailable?: boolean;
}

interface ModeGridProps {
  onSelectMode: (modeId: ModeId) => void;
}

const modes: Mode[] = [
  {
    id: "focus",
    label: "Focus Mode",
    icon: ArrowUpRight,
    outline: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    isAvailable: true,
  },
  {
    id: "news",
    label: "News Mode",
    icon: Newspaper,
    outline: "linear-gradient(135deg, #38bdf8, #6366f1)",
  },
  {
    id: "learning",
    label: "Learning Mode",
    icon: GraduationCap,
    outline: "linear-gradient(135deg, #22d3ee, #4ade80)",
  },

  {
    id: "health",
    label: "Health Mode",
    icon: HeartPulse,
    outline: "linear-gradient(135deg, #4ade80, #22c55e)",
  },
  {
    id: "career",
    label: "Career Mode",
    icon: BriefcaseBusiness,
    outline: "linear-gradient(135deg, #34d399, #22c55e)",
  },
  {
    id: "wealth",
    label: "Wealth Mode",
    icon: CircleDollarSign,
    outline: "linear-gradient(135deg, #facc15, #fb923c)",
  },

  {
    id: "communication",
    label: "Communication Mode",
    icon: MessageCircle,
    outline: "linear-gradient(135deg, #e879f9, #6366f1)",
  },

  // ✅ FIXED: 3rd row, middle column is now UCT Tokens Earned
  {
    id: "uctTokens",
    label: "UCT Tokens Earned",
    icon: Coins,
    outline: "linear-gradient(135deg, #38bdf8, #22c55e)",
  },

  {
    id: "community",
    label: "Community Ranking",
    icon: Users,
    outline: "linear-gradient(135deg, #a855f7, #ec4899)",
  },

  {
    id: "crypto",
    label: "Crypto Hub",
    icon: Bitcoin,
    outline: "linear-gradient(135deg, #facc15, #fb923c)",
  },
  {
    id: "customize",
    label: "Customize AI",
    icon: SlidersHorizontal,
    outline: "linear-gradient(135deg, #38bdf8, #6366f1)",
  },
  {
    id: "aiUsage",
    label: "AI Usage",
    icon: Activity,
    outline: "linear-gradient(135deg, #a855f7, #22d3ee)",
  },
];

const ModeGrid = ({ onSelectMode }: ModeGridProps) => {
  const [comingSoonMode, setComingSoonMode] = useState<string | null>(null);

  const handleSelectMode = (modeId: ModeId) => {
    const mode = modes.find((m) => m.id === modeId);

    // Only Focus Mode is live for now – others show banner
    if (mode && mode.id !== "focus") {
      setComingSoonMode(mode.label);
      return;
    }

    setComingSoonMode(null);
    onSelectMode(modeId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 pb-16 px-6 gap-10 bg-gradient-to-b from-black via-slate-950 to-black">
      {/* Coming soon banner */}
      {comingSoonMode && (
        <div className="w-full max-w-md rounded-3xl bg-black/85 border border-white/10 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
          <p className="text-sm font-semibold text-white mb-1">
            {comingSoonMode}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            This mode is coming soon. For now, try{" "}
            <span className="font-semibold text-white">Focus Mode</span>.
          </p>
        </div>
      )}

      {/* Logo + title */}
      <div className="flex flex-col items-center gap-6">
        {/* App icon with purple gradient fill and glow */}
        <div className="relative">
          {/* Ambient glow behind */}
          <div className="absolute -inset-4 rounded-[40px] bg-purple-500/40 blur-2xl" />
          
          {/* Main container with gradient fill */}
          <div className="relative w-56 h-56 flex items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-slate-900 border border-purple-500/50 shadow-[0_0_60px_rgba(147,51,234,0.5)]">
            <img
              src={logoTransparent}
              alt="UnclutterAI"
              className="w-52 h-52 object-contain"
            />
          </div>
        </div>

        {/* Text lockup */}
        <div className="text-center space-y-1">
          <h1 className="text-[36px] font-semibold tracking-tight text-white">
            unclutterAI
          </h1>
          <p className="text-[11px] tracking-[0.3em] text-white/60 uppercase">
            Choose your mode
          </p>
        </div>
      </div>

      {/* Grid of 12 modes — NEON OUTLINE ICONS */}
      <div className="grid grid-cols-3 gap-5 w-full max-w-md">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className="
                group relative rounded-[28px] p-[2px]
                shadow-[0_0_25px_rgba(15,23,42,0.9)]
                transition-transform duration-200
                active:scale-[0.97]
              "
              style={{
                backgroundImage: mode.outline,
              }}
            >
              {/* Inner dark tile */}
              <div
                className="
                  flex h-28 flex-col items-center justify-center
                  rounded-[24px]
                  bg-black/80
                  backdrop-blur-2xl
                  border border-white/8
                  relative overflow-hidden
                "
              >
                {/* Glow halo */}
                <div
                  className="
                    pointer-events-none absolute inset-0 opacity-40
                    group-hover:opacity-80 transition-opacity duration-300
                  "
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 55%)",
                  }}
                />

                {/* Icon */}
                <div
                  className="
                    relative mb-3 flex h-10 w-10 items-center justify-center
                    rounded-2xl border border-white/55 bg-black/40
                    shadow-[0_0_22px_rgba(148,163,184,0.55)]
                    group-hover:shadow-[0_0_30px_rgba(148,163,184,0.9)]
                    transition-shadow duration-300
                  "
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Label */}
                <span className="relative mt-1 text-[12px] font-medium text-white/90 text-center leading-tight">
                  {mode.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeGrid;
