import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface LevelUpAnimationProps {
  show: boolean;
  newLevel: number;
}

export const LevelUpAnimation = ({ show, newLevel }: LevelUpAnimationProps) => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Generate lightweight confetti particles (6-8 instead of 12)
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 160 - 80,
        y: Math.random() * -100 - 30,
        delay: Math.random() * 0.2,
      }));
      setParticles(newParticles);
      
      // Hide after animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
      {/* Radial glow pulse - more subtle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-48 h-48 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(45,212,191,0.15) 50%, transparent 70%)",
            animation: "levelUpPulse 800ms ease-out forwards"
          }}
        />
      </div>
      
      {/* Floating LEVEL UP text - refined */}
      <div 
        className="absolute flex flex-col items-center gap-1.5"
        style={{
          animation: "levelUpFloat 1.2s ease-out forwards"
        }}
      >
        <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-600/80 to-teal-500/80 border border-white/25 shadow-[0_0_30px_rgba(168,85,247,0.5)]">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="text-lg font-bold text-white tracking-wide">LEVEL UP!</span>
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </div>
        <span className="text-sm font-medium text-white/80">
          Level {newLevel}
        </span>
      </div>

      {/* Confetti particles - lighter */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: particle.id % 3 === 0 ? "#a855f7" : particle.id % 3 === 1 ? "#2dd4bf" : "#facc15",
            animation: `confetti 1s ease-out ${particle.delay}s forwards`,
            transform: `translate(${particle.x}px, 0)`,
          }}
        />
      ))}

      <style>{`
        @keyframes levelUpPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes levelUpFloat {
          0% { transform: translateY(12px) scale(0.9); opacity: 0; }
          15% { transform: translateY(-5px) scale(1.02); opacity: 1; }
          35% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-20px) scale(0.95); opacity: 0; }
        }
        
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-120px) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Inline level glow effect for use inside text elements
export const InlineLevelGlow = ({ 
  level, 
  leveledUp, 
  title 
}: { 
  level: number; 
  leveledUp: boolean;
  title: string;
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (leveledUp) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [leveledUp]);

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Background glow */}
      {showAnimation && (
        <div 
          className="absolute -inset-4 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(45,212,191,0.2) 50%, transparent 70%)",
            animation: "inlineGlow 800ms ease-out forwards"
          }}
        />
      )}
      
      <span 
        className={`relative text-2xl font-bold transition-all duration-300 ${
          showAnimation 
            ? "bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent" 
            : "text-white"
        }`}
        style={showAnimation ? {
          animation: "levelNumberGlow 600ms ease-out",
          filter: "drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))"
        } : undefined}
      >
        Level {level}
      </span>
      
      <span className="text-sm text-slate-400">— {title}</span>

      {/* Rising "LEVEL UP!" tag */}
      {showAnimation && (
        <span 
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 text-xs font-bold text-white whitespace-nowrap"
          style={{
            animation: "levelUpTagFloat 1.2s ease-out forwards"
          }}
        >
          LEVEL UP!
        </span>
      )}

      <style>{`
        @keyframes inlineGlow {
          0% { transform: scale(0.7); opacity: 0; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        
        @keyframes levelNumberGlow {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        
        @keyframes levelUpTagFloat {
          0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; transform: translateX(-50%) translateY(-4px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-12px); }
        }
      `}</style>
    </div>
  );
};
