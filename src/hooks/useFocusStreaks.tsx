import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type FocusStreak = Database['public']['Tables']['focus_streaks']['Row'];

export const useFocusStreaks = () => {
  const queryClient = useQueryClient();

  // Fetch user's focus streak data
  const { data: streakData, isLoading, error } = useQuery({
    queryKey: ['focus_streaks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_streaks')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Update streak after successful focus session
  const updateStreak = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const currentStreak = streakData?.current_streak || 0;
      const lastSession = streakData?.last_session;
      
      let newStreak = 1;
      
      // If last session was yesterday, increment streak
      if (lastSession === yesterday) {
        newStreak = currentStreak + 1;
      }
      // If last session was today, keep current streak
      else if (lastSession === today) {
        newStreak = currentStreak;
      }
      // Otherwise, reset to 1
      
      const longestStreak = Math.max(streakData?.longest_streak || 0, newStreak);
      
      const { data, error } = await supabase
        .from('focus_streaks')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_session: today,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['focus_streaks'] });
      
      if (data.current_streak > (streakData?.current_streak || 0)) {
        toast({
          title: "🔥 Streak Extended!",
          description: `${data.current_streak} day focus streak! Keep it up!`,
        });
      }
    },
  });

  return {
    streakData,
    currentStreak: streakData?.current_streak || 0,
    longestStreak: streakData?.longest_streak || 0,
    lastSession: streakData?.last_session,
    isLoading,
    error,
    updateStreak: updateStreak.mutate,
    isUpdating: updateStreak.isPending,
  };
};
