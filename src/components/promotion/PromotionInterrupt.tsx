import { useEffect, useState } from 'react';
import { PROMOTION_MOMENTS } from '@/lib/assistantPersonality';

interface PromotionInterruptProps {
  onComplete: () => void;
}

export function PromotionInterrupt({ onComplete }: PromotionInterruptProps) {
  const [showLine1, setShowLine1] = useState(false);
  const [showLine2, setShowLine2] = useState(false);

  useEffect(() => {
    // Fade in line 1 after brief delay
    const timer1 = setTimeout(() => setShowLine1(true), 400);
    
    // Fade in line 2 after 2-second pause
    const timer2 = setTimeout(() => setShowLine2(true), 2400);
    
    // Auto-advance after 4 seconds total
    const timer3 = setTimeout(() => onComplete(), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-black px-8 cursor-pointer"
      onClick={onComplete}
    >
      <div className="max-w-md text-center space-y-6">
        <p 
          className={`text-2xl font-light text-white/90 transition-opacity duration-700 ${
            showLine1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {PROMOTION_MOMENTS.patternRecognized.line1}
        </p>
        
        <p 
          className={`text-2xl font-light text-white/90 transition-opacity duration-700 ${
            showLine2 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {PROMOTION_MOMENTS.patternRecognized.line2}
        </p>
      </div>
    </div>
  );
}
