import { X, Clock, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleModalProps {
  onSchedule: (date: Date) => void;
  onClose: () => void;
  requiresConfirmation: boolean;
}

const ScheduleModal = ({ onSchedule, onClose, requiresConfirmation }: ScheduleModalProps) => {
  const getDate = (hoursFromNow: number): Date => {
    const date = new Date();
    date.setHours(date.getHours() + hoursFromNow);
    return date;
  };

  const options = [
    { label: 'Later Today', icon: Clock, hours: 4 },
    { label: 'Tomorrow', icon: Calendar, hours: 24 },
    { label: 'Next Week', icon: CalendarDays, hours: 168 },
    { label: 'Next Month', icon: CalendarRange, hours: 720 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-medium text-white">Schedule for Later</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {options.map((option) => (
            <button
              key={option.label}
              onClick={() => onSchedule(getDate(option.hours))}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <option.icon className="h-5 w-5 text-white/60" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Confirmation notice */}
        {requiresConfirmation && (
          <div className="px-4 pb-2">
            <p className="text-xs text-amber-400/80">
              This will create a task in your list.
            </p>
          </div>
        )}

        {/* Cancel */}
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-white/60 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
