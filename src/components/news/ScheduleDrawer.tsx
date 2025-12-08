import { useState, useEffect } from "react";
import { Clock, Save, Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleDrawer = ({ open, onOpenChange }: ScheduleDrawerProps) => {
  const [frequency, setFrequency] = useState("daily");
  const [deliveryTime, setDeliveryTime] = useState("09:00");
  const [isEnabled, setIsEnabled] = useState(true);
  const [channels, setChannels] = useState({
    inApp: true,
    email: false,
    sms: false,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSchedule();
    }
  }, [open]);

  const loadSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('news_schedules')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setFrequency(data.frequency);
        setDeliveryTime(data.delivery_time);
        setIsEnabled(data.is_enabled);
        
        const savedChannels = data.channels as string[];
        setChannels({
          inApp: savedChannels.includes('in-app'),
          email: savedChannels.includes('email'),
          sms: savedChannels.includes('sms'),
        });
      }
    } catch (error: any) {
      console.error('Error loading schedule:', error);
    }
  };

  const saveSchedule = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const selectedChannels = Object.entries(channels)
        .filter(([_, enabled]) => enabled)
        .map(([channel, _]) => {
          if (channel === 'inApp') return 'in-app';
          return channel;
        });

      const { data: existing } = await supabase
        .from('news_schedules')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('news_schedules')
          .update({
            frequency,
            delivery_time: deliveryTime,
            channels: selectedChannels,
            is_enabled: isEnabled,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news_schedules')
          .insert({
            user_id: user!.id,
            frequency,
            delivery_time: deliveryTime,
            channels: selectedChannels,
            is_enabled: isEnabled,
          });

        if (error) throw error;
      }

      toast({
        title: "Schedule saved",
        description: `News summaries will be delivered ${frequency} at ${deliveryTime}`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving schedule",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-black/95 backdrop-blur-2xl border-l border-white/10 text-white"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-slate-50">
            Schedule Delivery
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-300">
            Set up automated news summary delivery
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-purple-400" />
              <div>
                <Label className="text-sm font-medium text-slate-200">
                  Enable Scheduled Delivery
                </Label>
                <p className="text-xs text-slate-400">
                  Automatically receive news summaries
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-200">
              Frequency
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-200">
              <Clock className="h-4 w-4 inline mr-2" />
              Delivery Time
            </Label>
            <Input
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Delivery Channels */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-200">
              Delivery Channels
            </Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-slate-300">In-App Notification</span>
                <Switch
                  checked={channels.inApp}
                  onCheckedChange={(checked) =>
                    setChannels({ ...channels, inApp: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300">Email</span>
                  <span className="text-xs text-slate-500">Receive summaries via Resend</span>
                </div>
                <Switch
                  checked={channels.email}
                  onCheckedChange={(checked) =>
                    setChannels({ ...channels, email: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-slate-300">SMS</span>
                <Switch
                  checked={channels.sms}
                  onCheckedChange={(checked) =>
                    setChannels({ ...channels, sms: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={saveSchedule}
            disabled={loading}
            className="w-full btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Schedule
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
