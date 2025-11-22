// src/components/home/ModeGrid.tsx
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

type ModeId =
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

interface ModeGridProps {
  onSelectMode: (modeId: ModeId) => void;
}

interface ModeDefinition {
  id: ModeId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradientFrom: string;
  gradientTo: string;
}

const MODES: ModeDefinition[] = [
  {
    id: "focus",
    label: "Focus Mode",
    icon: ArrowUpRight,
    gradientFrom: "from-[#ec4899]",
    gradientTo: "to-[#8b5cf6]",
  },
  {
    id: "news",
    label: "News Mode",
    icon: Newspaper,
    gradientFrom: "from-[#38bdf8]",
    gradientTo: "to-[#6366f1]",
  },
  {
    id: "learning",
    label: "Learning Mode",
    icon: GraduationCap,
    gradientFrom: "from-[#22d3ee]",
    gradientTo: "to-[#4ade80]",
  },
  {
    id: "health",
    label: "Health Mode",
    icon: HeartPulse,
    gradientFrom: "from-[#4ade80]",
    gradientTo: "to-[#22c55e]",
  },
  {
    id: "career",
    label: "Career Mode",
    icon: BriefcaseBusiness,
    gradientFrom: "from-[#34d399]",
    gradientTo: "to-[#22c55e]",
  },
  {
    id: "wealth",
    label: "Wealth Mode",
    icon: CircleDollarSign,
    gradientFrom: "from-[#facc15]",
    gradientTo: "to-[#fb923c]",
  },
  {
    id: "communication",
    label: "Communication Mode",
    icon: MessageCircle,
    gradientFrom: "from-[#e879f9]",
    gradientTo: "to-[#6366f1]",
  },
  {
    id: "uctTokens",
    label: "UCT Tokens Earned",
    icon: Coins,
    gradientFrom: "from-[#38bdf8]",
    gradientTo: "to-[#22c55e]",
  },
  {
    id: "community",
    label: "Community Ranking",
    icon: Users,
    gradientFrom: "from-[#a855f7]",
    gradientTo: "to-[#ec4899]",
  },
  {
    id: "crypto",
    label: "Crypto Hub",
    icon: Bitcoin,
    gradientFrom: "from-[#facc15]",
    gradientTo: "to-[#fb923c]",
  },
  {
    id: "customize",
    label: "Customize AI",
    icon: SlidersHorizontal,
    gradientFrom: "from-[#38bdf8]",
    gradientTo: "to-[#6366f1]",
  },
  {
    id: "aiUsage",
    label: "AI Usage",
    icon: Activity,
    gradientFrom: "from-[#a855f7]",
    gradientTo: "to-[#22d3ee]",
  },
];

const ModeGrid = ({ onSelectMode }: ModeGridProps) => {
  return (
    <div className="mt-8 grid grid-cols-3 gap-4 px-4 pb-10 sm:max-w-md sm:mx-auto">
      {MODES.map((mode) => {
        const Icon = mode.icon;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelectMode(mode.id)}
            className={`
              group relative overflow-hidden rounded-[28px] p-[2px]
              bg-gradient-to-br ${mode.gradientFrom} ${mode.gradientTo}
              shadow-[0_0_35px_rgba(59,130,246,0.35)]
              transition-transform duration-200 ease-out
              active:scale-[0.97]
            `}
          >
            {/* Inner dark tile */}
            <div
              className="
                flex h-28 flex-col items-center justify-center
                rounded-[24px]
                bg-black/75
                backdrop-blur-2xl
                border border-white/10
                relative
                overflow-hidden
              "
            >
              {/* Soft halo behind icon */}
              <div
                className={`
                  pointer-events-none absolute inset-0 opacity-60
                  bg-radial from-white/15 via-transparent to-transparent
                  group-hover:opacity-90 transition-opacity duration-300
                `}
                style={{
                  background:
                    "radial-gradient(circle at 50% 10%, rgba(255,255,255,0.18), transparent 55%)",
                }}
              />

              {/* Icon circle with outline */}
              <div
                className="
                  relative mb-3 flex h-10 w-10 items-center justify-center
                  rounded-2xl border border-white/60
                  bg-black/40
                  shadow-[0_0_20px_rgba(148,163,184,0.45)]
                  group-hover:shadow-[0_0_28px_rgba(148,163,184,0.8)]
                  transition-shadow duration-300
                "
              >
                <Icon className="h-5 w-5 text-white" />
              </div>

              {/* Label */}
              <span className="relative mt-0.5 text-[13px] font-medium text-white text-center leading-tight">
                {mode.label}
              </span>
            </div>

            {/* Glow ring on press */}
            <div
              className="
                pointer-events-none absolute inset-0 rounded-[28px]
                opacity-0 group-active:opacity-100
                transition-opacity duration-150
                ring-2 ring-white/40
              "
            />
          </button>
        );
      })}
    </div>
  );
};

export default ModeGrid;
