import { Star, Diamond } from "lucide-react";

interface FocusTierBadgeProps {
  level: number;
  className?: string;
}

const getTierInfo = (level: number) => {
  if (level >= 20) return { label: "Diamond", color: "#7FFFFF", icon: "diamond" };
  if (level >= 15) return { label: "Platinum", color: "#D8F3FF", icon: "star" };
  if (level >= 10) return { label: "Gold", color: "#FFD700", icon: "star" };
  if (level >= 5) return { label: "Silver", color: "#C0C0C0", icon: "star" };
  return { label: "Bronze", color: "#C57A3B", icon: "star" };
};

export const FocusTierBadge = ({ level, className = "" }: FocusTierBadgeProps) => {
  const tier = getTierInfo(level);
  
  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${className}`}
      style={{ 
        backgroundColor: `${tier.color}15`,
        borderColor: `${tier.color}40`,
        boxShadow: `0 0 12px ${tier.color}30, inset 0 1px 2px ${tier.color}20`
      }}
    >
      {tier.icon === "diamond" ? (
        <Diamond className="w-3.5 h-3.5" style={{ color: tier.color }} />
      ) : (
        <Star className="w-3.5 h-3.5" style={{ color: tier.color }} />
      )}
      <span 
        className="text-xs font-semibold"
        style={{ color: tier.color }}
      >
        Tier: {tier.label}
      </span>
    </div>
  );
};
