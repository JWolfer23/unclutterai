import {
  ArrowUpRight,
  FileText,
  GraduationCap,
  HeartPulse,
  Briefcase,
  DollarSign,
  MessageCircle,
  SlidersHorizontal,
  Users,
  Bitcoin,
  Activity,
} from "lucide-react";

export type ModeKey =
  | "focus"
  | "news"
  | "learning"
  | "health"
  | "career"
  | "wealth"
  | "communication"
  | "customize-ai-1"
  | "community"
  | "crypto"
  | "customize-ai-2"
  | "ai-usage";

interface ModeGridProps {
  activeMode: ModeKey;
  onSelectMode: (mode: ModeKey) => void;
}

type ModeDefinition = {
  key: ModeKey;
  label: string;
  icon: React.ElementType;
  // Gradient used for the outline and glow
  gradientClass: string;
};

const MODES: ModeDefinition[] = [
  {
    key: "focus",
    label: "Focus Mode",
    icon: ArrowUpRight,
    gradientClass: "from-[#ec4899] via-[#a855f7] to-[#22d3ee]",
  },
  {
    key: "news",
    label: "News Mode",
    icon: FileText,
    gradientClass: "from-[#38bdf8] to-[#6366f1]",
  },
  {
    key: "learning",
    label: "Learning Mode",
    icon: GraduationCap,
    gradientClass: "from-[#22c55e] to-[#0ea5e9]",
  },
  {
    key: "health",
    label: "Health Mode",
    icon: HeartPulse,
    gradientClass: "from-[#4ade80] to-[#22c55e]",
  },
  {
    key: "career",
    label: "Career Mode",
    icon: Briefcase,
    gradientClass: "from-[#22d3ee] to-[#6366f1]",
  },
  {
    key: "wealth",
    label: "Wealth Mode",
    icon: DollarSign,
    gradientClass: "from-[#facc15] to-[#f97316]",
  },
  {
    key: "communication",
    label: "Communication Mode",
    icon: MessageCircle,
    gradientClass: "from-[#a855f7] to-[#6366f1]",
  },
  {
    key: "customize-ai-1",
    label: "Customize AI",
    icon: SlidersHorizontal,
    gradientClass: "from-[#38bdf8] to-[#22d3ee]",
  },
  {
    key: "community",
    label: "Community Ranking",
    icon: Users,
    gradientClass: "from-[#f97316] to-[#ec4899]",
  },
  {
    key: "crypto",
    label: "Crypto Hub",
    icon: Bitcoin,
    gradientClass: "from-[#eab308] to-[#f97316]",
  },
  {
    key: "customize-ai-2",
    label: "Customize AI",
    icon: SlidersHorizontal,
    gradientClass: "from-[#22d3ee] to-[#6366f1]",
  },
  {
    key: "ai-usage",
    label: "AI Usage",
    icon: Activity,
    gradientClass: "from-[#a855f7] to-[#22c55e]",
  },
];

const ModeGrid = ({ activeMode, onSelectMode }: ModeGridProps) => {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center px-4 pb-10 pt-10 sm:pt-16">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-8 sm:mb-10">
        <div className="relative mb-6">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.35),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.35),_transparent_60%)] blur-xl" />
          {/* Icon block */}
          <div className="relative w-28 h-28 rounded-[32px] bg-[radial-gradient(circle_at_top,_#22d3ee,_#0f172a),radial-gradient(circle_at_bottom,_#a855f7,_#020617)] border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.6)] flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl border border-white/15 flex items-center justify-center">
              {/* Simple three-line glyph to echo the logo */}
              <div className="space-y-1.5 w-7">
                <div className="h-[2px] rounded-full bg-white/90" />
                <div className="h-[2px] rounded-full bg-white/80 w-5" />
                <div className="h-[2px] rounded-full bg-white/70 w-4" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          unclutter<span className="text-white/80">AI</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm tracking-[0.35em] text-white/55 uppercase">
          Choose your mode
        </p>
      </div>

      {/* 12-button neon outline grid */}
      <div className="w-full max-w-md sm:max-w-lg grid grid-cols-3 gap-3 sm:gap-4">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = mode.key === activeMode;

          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => onSelectMode(mode.key)}
              className={`
                group relative overflow-hidden rounded-[26px] p-[2px]
                bg-gradient-to-br ${mode.gradientClass}
                transition-transform duration-150
                active:scale-95
                ${isActive ? "shadow-[0_0_30px_rgba(59,130,246,0.7)]" : "shadow-[0_0_16px_rgba(15,23,42,0.8)]"}
              `}
            >
              {/* Inner dark card */}
              <div
                className={`
                  relative flex flex-col items-center justify-center
                  rounded-[24px] bg-black/70
                  px-2 py-4 sm:px-3 sm:py-5
                  backdrop-blur-xl
                  border border-white/5
                  transition-all duration-200
                  group-hover:bg-black/55
                `}
              >
                {/* Soft inner glow on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.22),_transparent_60%)]" />
                </div>

                <Icon
                  className={`
                    relative z-10 h-6 w-6 sm:h-7 sm:w-7 text-white
                    transition-transform duration-200
                    group-hover:scale-110
                  `}
                  strokeWidth={1.7}
                />
                <span className="relative z-10 mt-2 text-[11px] sm:text-xs font-medium text-white/90 text-center leading-tight">
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
