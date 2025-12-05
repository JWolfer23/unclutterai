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
      // Generate confetti particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * -150 - 50,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);
      
      // Hide after animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
      {/* Radial glow pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-64 h-64 rounded-full animate-pulse"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(45,212,191,0.2) 50%, transparent 70%)",
            animation: "levelUpPulse 1s ease-out"
          }}
        />
      </div>
      
      {/* Floating LEVEL UP text */}
      <div 
        className="absolute flex flex-col items-center gap-2"
        style={{
          animation: "levelUpFloat 1.5s ease-out forwards"
        }}
      >
        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600/90 to-teal-500/90 border border-white/30 shadow-[0_0_40px_rgba(168,85,247,0.6)]">
          <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          <span className="text-2xl font-bold text-white tracking-wider">LEVEL UP!</span>
          <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
        </div>
        <span className="text-lg font-semibold text-white/90 animate-pulse">
          You reached Level {newLevel}
        </span>
      </div>

      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: particle.id % 3 === 0 ? "#a855f7" : particle.id % 3 === 1 ? "#2dd4bf" : "#facc15",
            animation: `confetti 1.5s ease-out ${particle.delay}s forwards`,
            transform: `translate(${particle.x}px, 0)`,
          }}
        />
      ))}

      <style>{`
        @keyframes levelUpPulse {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes levelUpFloat {
          0% { transform: translateY(20px) scale(0.8); opacity: 0; }
          20% { transform: translateY(-10px) scale(1.05); opacity: 1; }
          40% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(0.9); opacity: 0; }
        }
        
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-200px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
