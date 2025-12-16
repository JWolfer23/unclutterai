import React, { useEffect, useState } from 'react';

interface WaveformIndicatorProps {
  isListening: boolean;
}

export const WaveformIndicator: React.FC<WaveformIndicatorProps> = ({ isListening }) => {
  const [showText, setShowText] = useState(true);

  useEffect(() => {
    if (isListening) {
      setShowText(true);
      const timer = setTimeout(() => setShowText(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  if (!isListening) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Waveform bars */}
      <div className="flex items-end gap-1 h-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-1 bg-cyan-400 rounded-full animate-driver-waveform"
            style={{ 
              animationDelay: `${i * 0.1}s`,
              height: '8px',
            }}
          />
        ))}
      </div>
      
      {/* Listening text - fades after 1.5s */}
      <span 
        className={`text-sm text-cyan-400/80 font-medium transition-opacity duration-500 ${
          showText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Listening
      </span>
    </div>
  );
};
