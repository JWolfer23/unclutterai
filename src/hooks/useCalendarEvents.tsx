import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  external_event_id: string;
  provider: string;
  title: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  show_as: string | null;
  location: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  is_cancelled: boolean;
}

interface CalendarSyncResult {
  success: boolean;
  synced?: number;
  todayEventCount?: number;
  hasMeetingsToday?: boolean;
  todayMeetings?: Array<{
    title: string;
    startTime: string;
    endTime: string;
    showAs: string;
  }>;
  error?: string;
  needsReconnect?: boolean;
}

interface CreateEventResult {
  success: boolean;
  eventId?: string;
  webLink?: string;
  error?: string;
  needsReconnect?: boolean;
}

export const useCalendarEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasMeetingsToday, setHasMeetingsToday] = useState(false);

  // Fetch cached calendar events from database
  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setTodayEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      // Fetch events for the next 7 days (supports both outlook and outlook_calendar)
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfToday.toISOString())
        .lte('start_time', endOfWeek.toISOString())
        .eq('is_cancelled', false)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching calendar events:', error);
        return;
      }

      const allEvents = (data || []) as CalendarEvent[];
      setEvents(allEvents);

      // Filter today's events
      const todayEnd = new Date(startOfToday);
      todayEnd.setHours(23, 59, 59, 999);

      const todaysEvents = allEvents.filter(event => {
        const eventStart = new Date(event.start_time);
        return eventStart >= startOfToday && eventStart <= todayEnd;
      });

      setTodayEvents(todaysEvents);
      setHasMeetingsToday(todaysEvents.some(e => e.show_as === 'busy' || e.show_as === 'tentative'));
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sync calendar from Microsoft
  const syncCalendar = useCallback(async (): Promise<CalendarSyncResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke('microsoft-calendar-sync');

      if (response.error) {
        throw new Error(response.error.message || 'Calendar sync failed');
      }

      const result = response.data as CalendarSyncResult;

      if (result.needsReconnect) {
        return result;
      }

      if (result.success) {
        // Refresh local events after sync
        await fetchEvents();
      }

      return result;
    } catch (err) {
      console.error('Calendar sync failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
    } finally {
      setIsSyncing(false);
    }
  }, [user, fetchEvents]);

  // Create a focus block in the calendar
  const createFocusBlock = useCallback(async (
    title: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ): Promise<CreateEventResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsCreating(true);
    try {
      const response = await supabase.functions.invoke('microsoft-calendar-create-event', {
        body: {
          title,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create focus block');
      }

      const result = response.data as CreateEventResult;

      if (result.success) {
        toast({
          title: "Focus block created",
          description: `"${title}" added to your Outlook calendar`,
        });
        // Refresh local events
        await fetchEvents();
      }

      return result;
    } catch (err) {
      console.error('Failed to create focus block:', err);
      toast({
        title: "Failed to create focus block",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive"
      });
      return { success: false, error: err instanceof Error ? err.message : 'Failed' };
    } finally {
      setIsCreating(false);
    }
  }, [user, fetchEvents]);

  // Check if a time range overlaps with any busy events
  const hasConflict = useCallback((startTime: Date, endTime: Date): boolean => {
    return events.some(event => {
      if (event.show_as !== 'busy' && event.show_as !== 'tentative') {
        return false;
      }

      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      // Check for overlap
      return startTime < eventEnd && endTime > eventStart;
    });
  }, [events]);

  // Get conflicting events for a time range
  const getConflictingEvents = useCallback((startTime: Date, endTime: Date): CalendarEvent[] => {
    return events.filter(event => {
      if (event.show_as !== 'busy' && event.show_as !== 'tentative') {
        return false;
      }

      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      return startTime < eventEnd && endTime > eventStart;
    });
  }, [events]);

  // Get upcoming events within the next N minutes
  const getUpcomingEvents = useCallback((minutes: number = 60): CalendarEvent[] => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + minutes * 60 * 1000);

    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      return eventStart >= now && eventStart <= cutoff;
    });
  }, [events]);

  // Get next meeting (for context display)
  const getNextMeeting = useCallback((): CalendarEvent | null => {
    const now = new Date();
    
    const upcoming = events.find(event => {
      const eventStart = new Date(event.start_time);
      return eventStart >= now && (event.show_as === 'busy' || event.show_as === 'tentative');
    });

    return upcoming || null;
  }, [events]);

  // Get time until next meeting in minutes
  const getMinutesUntilNextMeeting = useCallback((): number | null => {
    const next = getNextMeeting();
    if (!next) return null;

    const now = new Date();
    const eventStart = new Date(next.start_time);
    const diffMs = eventStart.getTime() - now.getTime();
    
    return Math.floor(diffMs / (1000 * 60));
  }, [getNextMeeting]);

  // Get calendar context for Morning Brief
  const getCalendarContext = useCallback(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(startOfToday);
    todayEnd.setHours(23, 59, 59, 999);

    const todaysMeetings = events.filter(event => {
      const eventStart = new Date(event.start_time);
      return eventStart >= startOfToday && eventStart <= todayEnd && !event.is_cancelled;
    });

    const busyBlocks = todaysMeetings.filter(e => e.show_as === 'busy' || e.show_as === 'tentative');
    
    // Calculate total busy time today
    const totalBusyMinutes = busyBlocks.reduce((acc, event) => {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);

    // Find free time slots
    const freeSlots: { start: Date; end: Date; durationMinutes: number }[] = [];
    const workdayStart = new Date(startOfToday);
    workdayStart.setHours(9, 0, 0, 0);
    const workdayEnd = new Date(startOfToday);
    workdayEnd.setHours(18, 0, 0, 0);

    // Simple free slot calculation between meetings
    let lastEnd = workdayStart;
    const sortedBusy = busyBlocks.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    for (const event of sortedBusy) {
      const eventStart = new Date(event.start_time);
      if (eventStart > lastEnd) {
        const slotEnd = eventStart < workdayEnd ? eventStart : workdayEnd;
        const durationMinutes = (slotEnd.getTime() - lastEnd.getTime()) / (1000 * 60);
        if (durationMinutes >= 30) { // Only count slots >= 30 min
          freeSlots.push({ start: lastEnd, end: slotEnd, durationMinutes });
        }
      }
      lastEnd = new Date(event.end_time);
    }

    // Check for free time after last meeting
    if (lastEnd < workdayEnd) {
      const durationMinutes = (workdayEnd.getTime() - lastEnd.getTime()) / (1000 * 60);
      if (durationMinutes >= 30) {
        freeSlots.push({ start: lastEnd, end: workdayEnd, durationMinutes });
      }
    }

    return {
      totalMeetings: todaysMeetings.length,
      busyMeetings: busyBlocks.length,
      totalBusyMinutes,
      freeSlots,
      nextMeeting: getNextMeeting(),
      minutesUntilNextMeeting: getMinutesUntilNextMeeting(),
      source: 'outlook_calendar'
    };
  }, [events, getNextMeeting, getMinutesUntilNextMeeting]);

  return {
    events,
    todayEvents,
    isLoading,
    isSyncing,
    isCreating,
    hasMeetingsToday,
    syncCalendar,
    createFocusBlock,
    hasConflict,
    getConflictingEvents,
    getUpcomingEvents,
    getNextMeeting,
    getMinutesUntilNextMeeting,
    getCalendarContext,
    refetch: fetchEvents,
  };
};
