import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const AIUsageResetTimer = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(null);
  const [resetTime, setResetTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    const calculateResetTime = async () => {
      try {
        // Get user's timezone from profile, default to UTC
        const { data: profile } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id', user.id)
          .single();

        const userTimezone = profile?.timezone || 'UTC';

        // Get today's AI usage to find first action time
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const { data: todayUsage } = await supabase
          .from('ai_usage')
          .select('used_at')
          .eq('user_id', user.id)
          .gte('used_at', startOfDay.toISOString())
          .order('used_at', { ascending: true })
          .limit(1);

        let resetDateTime: Date;

        if (todayUsage && todayUsage.length > 0) {
          // If there's usage today, reset 24 hours from first action
          const firstActionTime = new Date(todayUsage[0].used_at);
          resetDateTime = new Date(firstActionTime.getTime() + 24 * 60 * 60 * 1000);
        } else {
          // If no usage today, reset at next midnight in user's timezone
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          resetDateTime = tomorrow;
        }

        setResetTime(resetDateTime);
      } catch (error) {
        console.error('Error calculating reset time:', error);
        // Fallback to next midnight UTC
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setResetTime(tomorrow);
      }
    };

    calculateResetTime();
  }, [user]);

  useEffect(() => {
    if (!resetTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = resetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0 });
        // Timer has reached 0, could trigger a refresh or reset here
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ hours, minutes });
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [resetTime]);

  if (!timeLeft) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-xs text-white/60">Reset in</p>
              <p className="text-sm font-medium text-white">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = () => {
    if (timeLeft.hours === 0 && timeLeft.minutes === 0) {
      return "Now";
    }
    
    if (timeLeft.hours === 0) {
      return `${timeLeft.minutes}m`;
    }
    
    return `${timeLeft.hours}h ${timeLeft.minutes}m`;
  };

  const isNearReset = timeLeft.hours === 0 && timeLeft.minutes < 30;

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 text-purple-400 ${isNearReset ? 'pulse' : ''}`} />
          <div>
            <p className="text-xs text-white/60">Reset in</p>
            <p className={`text-sm font-medium text-white ${isNearReset ? 'pulse' : ''}`}>
              {formatTime()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};