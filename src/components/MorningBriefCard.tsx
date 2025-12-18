import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";

const MorningBriefCard = () => {
  const { currentStreak, isLoading: streakLoading } = useFocusStreaks();
  const { sessions, isLoading: sessionsLoading } = useFocusSessions();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const isLoading = streakLoading || sessionsLoading || tasksLoading;

  // Cleanup audio on unmount or navigation
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Stop playback when component unmounts (navigation away)
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Stop playback on app backgrounding (mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current) {
        stopAudio();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopAudio]);

  // Stop playback on scroll (mobile-friendly: only cancel if significant scroll)
  useEffect(() => {
    let scrollStartY = 0;
    let isTracking = false;

    const handleScrollStart = () => {
      if (audioRef.current && !isTracking) {
        scrollStartY = window.scrollY;
        isTracking = true;
      }
    };

    const handleScroll = () => {
      if (audioRef.current && isTracking) {
        const scrollDelta = Math.abs(window.scrollY - scrollStartY);
        // Cancel audio after 100px of scroll (intentional scroll, not micro-adjustments)
        if (scrollDelta > 100) {
          stopAudio();
          isTracking = false;
        }
      }
    };

    const handleScrollEnd = () => {
      isTracking = false;
    };

    window.addEventListener('touchstart', handleScrollStart, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchend', handleScrollEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleScrollStart);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchend', handleScrollEnd);
    };
  }, [stopAudio]);

  // Get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate sessions today
  const today = new Date().toISOString().split('T')[0];
  const sessionsToday = sessions.filter(s => 
    s.start_time && s.start_time.startsWith(today) && s.is_completed
  ).length;

  // Get urgent tasks (high priority, pending)
  const urgentTasks = tasks.filter(t => 
    t.priority === 'high' && t.status === 'pending'
  );

  // Generate priorities (max 2, one protective)
  const generatePriorities = () => {
    const priorities: string[] = [];

    // Protective priority first - always add one
    if (sessionsToday === 0) {
      priorities.push("Start with a short focus session to build momentum.");
    } else if (currentStreak > 0) {
      priorities.push("Protect your focus streak. One session keeps it alive.");
    } else {
      priorities.push("Take things one step at a time today.");
    }

    // Action priority second (if urgent items exist)
    if (urgentTasks.length > 0) {
      const taskTitle = urgentTasks[0].title;
      const truncated = taskTitle.length > 40 ? taskTitle.slice(0, 40) + "…" : taskTitle;
      priorities.push(`Address: ${truncated}`);
    } else if (sessionsToday >= 2) {
      priorities.push("You've made good progress. Consider wrapping up intentionally.");
    }

    return priorities.slice(0, 2);
  };

  const priorities = generatePriorities();

  // Build the brief text for TTS
  const buildBriefText = useCallback(() => {
    const greeting = getGreeting();
    const streakText = currentStreak > 0 
      ? `Focus streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}.`
      : "No active focus streak.";
    const sessionsText = sessionsToday > 0 
      ? `Sessions today: ${sessionsToday}.`
      : "No sessions completed today.";
    const urgentText = urgentTasks.length > 0 
      ? `Urgent items: ${urgentTasks.length}.`
      : "No urgent items.";
    const prioritiesText = priorities.length > 0 
      ? `Priorities: ${priorities.join(' ')}` 
      : '';
    const closeText = "You're in control. Take it at your pace.";

    return `${greeting}. Here's your brief. ${streakText} ${sessionsText} ${urgentText} ${prioritiesText} ${closeText}`;
  }, [currentStreak, sessionsToday, urgentTasks.length, priorities]);

  // Play the brief using TTS
  const handlePlayBrief = async () => {
    // Stop any existing playback first (allows restart)
    stopAudio();

    setIsPlaying(true);

    try {
      const text = buildBriefText();
      
      const response = await fetch(
        `https://aihlehujbzkkugzmcobn.supabase.co/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaGxlaHVqYnpra3Vnem1jb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2Mjc5MzMsImV4cCI6MjA2NzIwMzkzM30.ynMPVsQsz9W-SuyZmP84spoRsxp5GBWRbGvOpNFx7KI',
          },
          body: JSON.stringify({ text }),
        }
      );

      // Handle 204 or non-ok responses silently
      if (response.status === 204 || !response.ok) {
        setIsPlaying(false);
        return;
      }

      const audioBlob = await response.blob();
      
      // Check if we actually got audio content
      if (audioBlob.size === 0) {
        setIsPlaying(false);
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        stopAudio();
      };

      audio.onerror = () => {
        stopAudio();
      };

      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card/30 border border-border/20 rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted/30 rounded w-48" />
          <div className="h-4 bg-muted/20 rounded w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card/40 to-card/20 border border-border/20 rounded-xl p-6 space-y-5">
      {/* Header with greeting and play button */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">
          {getGreeting()}. Here's your brief.
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayBrief}
          className="text-muted-foreground/60 hover:text-foreground/80 gap-1.5 h-8 px-2.5"
        >
          <Volume2 className={`h-3.5 w-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="text-xs">{isPlaying ? 'Playing…' : 'Play brief'}</span>
        </Button>
      </div>

      {/* State Snapshot */}
      <div className="space-y-2 text-sm text-muted-foreground">
        {/* Focus Streak */}
        <p>
          {currentStreak > 0 
            ? `Focus streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}.`
            : "No active focus streak."
          }
        </p>

        {/* Sessions Today */}
        <p>
          {sessionsToday > 0 
            ? `Sessions today: ${sessionsToday}.`
            : "No sessions completed today."
          }
        </p>

        {/* Urgent Items */}
        <p>
          {urgentTasks.length > 0 
            ? `Urgent items: ${urgentTasks.length}.`
            : "No urgent items."
          }
        </p>
      </div>

      {/* Priority Compression */}
      {priorities.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/10">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/60">
            Priorities
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            {priorities.map((priority, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground/40 select-none">—</span>
                <span>{priority}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calm Reassurance Close */}
      <p className="text-sm text-muted-foreground/70 pt-2">
        You're in control. Take it at your pace.
      </p>
    </div>
  );
};

export default MorningBriefCard;
