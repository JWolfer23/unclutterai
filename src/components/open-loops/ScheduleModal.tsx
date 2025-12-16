import { X, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ScheduleModalProps {
  onSchedule: (date: Date) => void;
  onClose: () => void;
}

const ScheduleModal = ({ onSchedule, onClose }: ScheduleModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const quickOptions = [
    { key: 'later_today', label: 'Later Today', hours: 3 },
    { key: 'tomorrow', label: 'Tomorrow', hours: 24 },
    { key: 'next_week', label: 'Next Week', hours: 168 },
    { key: 'next_month', label: 'Next Month', hours: 720 }
  ];

  const handleSchedule = (hours: number) => {
    const scheduledDate = new Date();
    scheduledDate.setHours(scheduledDate.getHours() + hours);
    onSchedule(scheduledDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Schedule For Later</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {quickOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                setSelectedOption(option.key);
                handleSchedule(option.hours);
              }}
              className={`w-full p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${
                selectedOption === option.key
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <Clock className={`h-5 w-5 ${
                selectedOption === option.key ? 'text-blue-400' : 'text-white/40'
              }`} />
              <span className="text-white font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-white/70"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
