import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLearning } from "@/hooks/useLearning";
import { Calendar } from "lucide-react";

interface LearningScheduleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const LearningScheduleDrawer = ({ open, onOpenChange }: LearningScheduleDrawerProps) => {
  const { schedule, upsertSchedule } = useLearning();
  const [frequency, setFrequency] = useState("daily");
  const [deliveryTime, setDeliveryTime] = useState("09:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (schedule) {
      setFrequency(schedule.frequency);
      setDeliveryTime(schedule.delivery_time);
      setSelectedDays(schedule.days_of_week ? JSON.parse(schedule.days_of_week as string) : []);
      const channels = schedule.channels ? JSON.parse(schedule.channels as string) : ["in-app"];
      setInAppEnabled(channels.includes("in-app"));
      setEmailEnabled(channels.includes("email"));
      setSmsEnabled(channels.includes("sms"));
      setIsEnabled(schedule.is_enabled);
    }
  }, [schedule]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    const channels = [];
    if (inAppEnabled) channels.push("in-app");
    if (emailEnabled) channels.push("email");
    if (smsEnabled) channels.push("sms");

    upsertSchedule({
      frequency,
      delivery_time: deliveryTime,
      days_of_week: JSON.stringify(frequency === "weekly" ? selectedDays : []),
      channels: JSON.stringify(channels),
      is_enabled: isEnabled,
    });

    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-card max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="text-slate-50">Learning Schedule</DrawerTitle>
          <DrawerDescription className="text-slate-300">
            Set up your study reminders and notifications
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Enable/Disable Schedule */}
          <div className="flex items-center justify-between glass-card--primary p-4 rounded-2xl">
            <div>
              <Label className="text-slate-200">Enable Schedule</Label>
              <p className="text-xs text-slate-400 mt-1">Turn reminders on or off</p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-slate-200">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days of Week (for weekly) */}
          {frequency === "weekly" && (
            <div className="space-y-2">
              <Label className="text-slate-200">Select Days</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((day) => (
                  <Button
                    key={day}
                    onClick={() => toggleDay(day)}
                    variant={selectedDays.includes(day) ? "default" : "outline"}
                    className={
                      selectedDays.includes(day)
                        ? "btn-primary"
                        : "border-white/10 text-slate-300"
                    }
                    size="sm"
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Time */}
          <div className="space-y-2">
            <Label className="text-slate-200">Reminder Time</Label>
            <Input
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="bg-slate-900/50 border-white/10 text-white"
            />
          </div>

          {/* Delivery Channels */}
          <div className="space-y-3">
            <Label className="text-slate-200">Delivery Channels</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between glass-card--primary p-3 rounded-xl">
                <div>
                  <p className="text-sm text-slate-200">In-App Notification</p>
                  <p className="text-xs text-slate-400">Get reminders in the app</p>
                </div>
                <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
              </div>

              <div className="flex items-center justify-between glass-card--primary p-3 rounded-xl">
                <div>
                  <p className="text-sm text-slate-200">Email</p>
                  <p className="text-xs text-slate-400">Receive email reminders</p>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              <div className="flex items-center justify-between glass-card--primary p-3 rounded-xl">
                <div>
                  <p className="text-sm text-slate-200">SMS</p>
                  <p className="text-xs text-slate-400">Get text message reminders</p>
                </div>
                <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="btn-primary w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Save Schedule
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};