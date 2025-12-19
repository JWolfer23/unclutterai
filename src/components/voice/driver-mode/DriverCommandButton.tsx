import React from 'react';
import { ArrowRight, MessageSquare, CheckCircle, Focus, LucideIcon } from 'lucide-react';
import type { DriverCommandId } from '@/lib/driverModeCommands';

interface DriverCommandButtonProps {
  id: DriverCommandId;
  label: string;
  icon: string;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  ArrowRight,
  MessageSquare,
  CheckCircle,
  Focus,
};

export const DriverCommandButton: React.FC<DriverCommandButtonProps> = ({
  id,
  label,
  icon,
  onPress,
  isActive = false,
  disabled = false,
}) => {
  const IconComponent = ICON_MAP[icon] || ArrowRight;

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center
        w-full aspect-square
        rounded-2xl
        transition-all duration-200
        active:scale-95
        ${isActive 
          ? 'bg-primary/20 border-2 border-primary shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={label}
    >
      <IconComponent 
        className={`w-10 h-10 mb-3 ${isActive ? 'text-primary' : 'text-white/70'}`}
        strokeWidth={1.5}
      />
      <span className={`text-base font-medium ${isActive ? 'text-primary' : 'text-white/80'}`}>
        {label}
      </span>
    </button>
  );
};
