import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PROMOTION_MOMENTS } from '@/lib/assistantPersonality';

interface PromotionOfferProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function PromotionOffer({ onAccept, onDecline }: PromotionOfferProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowContent(true), 300);
    const timer2 = setTimeout(() => setShowButtons(true), 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-8">
      <div className="max-w-md text-center space-y-8">
        <div 
          className={`space-y-6 transition-opacity duration-700 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h2 className="text-2xl font-light text-white/90">
            {PROMOTION_MOMENTS.offer.headline}
          </h2>
          
          <div className="space-y-2">
            {PROMOTION_MOMENTS.offer.capabilities.map((capability, index) => (
              <p key={index} className="text-base text-white/50">
                {capability}
              </p>
            ))}
          </div>
        </div>

        <div 
          className={`flex flex-col gap-3 pt-4 transition-opacity duration-500 ${
            showButtons ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            onClick={onAccept}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white rounded-xl py-6 text-base font-normal"
          >
            Allow
          </Button>
          
          <Button
            onClick={onDecline}
            variant="ghost"
            className="w-full border border-white/20 text-white/70 hover:text-white hover:bg-white/5 rounded-xl py-6 text-base font-normal"
          >
            Keep reviewing
          </Button>
        </div>
      </div>
    </div>
  );
}
