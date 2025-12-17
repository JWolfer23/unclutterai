import { useState, useCallback } from 'react';
import { PromotionInterrupt } from './PromotionInterrupt';
import { PromotionOffer } from './PromotionOffer';
import { PromotionAccepted } from './PromotionAccepted';
import { PromotionConfirmation } from './PromotionConfirmation';
import { PromotionDeclined } from './PromotionDeclined';

type PromotionScreen = 'interrupt' | 'offer' | 'accepted' | 'confirmation' | 'declined';

interface AssistantPromotionFlowProps {
  onAccept: () => Promise<boolean>;
  onDecline: () => Promise<void>;
  onComplete: () => void;
}

export function AssistantPromotionFlow({ 
  onAccept, 
  onDecline, 
  onComplete 
}: AssistantPromotionFlowProps) {
  const [screen, setScreen] = useState<PromotionScreen>('interrupt');

  const handleInterruptComplete = useCallback(() => {
    setScreen('offer');
  }, []);

  const handleAccept = useCallback(async () => {
    const success = await onAccept();
    if (success) {
      setScreen('accepted');
    }
  }, [onAccept]);

  const handleDecline = useCallback(async () => {
    await onDecline();
    setScreen('declined');
  }, [onDecline]);

  const handleAcceptedComplete = useCallback(() => {
    setScreen('confirmation');
  }, []);

  const handleConfirmationComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleDeclinedComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {screen === 'interrupt' && (
        <PromotionInterrupt onComplete={handleInterruptComplete} />
      )}
      
      {screen === 'offer' && (
        <PromotionOffer onAccept={handleAccept} onDecline={handleDecline} />
      )}
      
      {screen === 'accepted' && (
        <PromotionAccepted onComplete={handleAcceptedComplete} />
      )}
      
      {screen === 'confirmation' && (
        <PromotionConfirmation onComplete={handleConfirmationComplete} />
      )}
      
      {screen === 'declined' && (
        <PromotionDeclined onComplete={handleDeclinedComplete} />
      )}
    </div>
  );
}
