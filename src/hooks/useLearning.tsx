import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useLearning = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch learning sources
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["learning-sources"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_sources")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch learning goals
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ["learning-goals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch learning notes
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["learning-notes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_notes")
        .select("*, learning_sources(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch learning schedule
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["learning-schedule"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_schedules")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch learning streak
  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ["learning-streak"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data || { current_streak: 0, longest_streak: 0 };
    },
  });

  // Add source mutation
  const addSource = useMutation({
    mutationFn: async (source: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_sources")
        .insert({ ...source, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-sources"] });
      toast({ title: "Source added successfully" });
    },
  });

  // Update source mutation
  const updateSource = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("learning_sources")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-sources"] });
      toast({ title: "Source updated successfully" });
    },
  });

  // Delete source mutation
  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("learning_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-sources"] });
      toast({ title: "Source deleted successfully" });
    },
  });

  // Add goal mutation
  const addGoal = useMutation({
    mutationFn: async (goal: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_goals")
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-goals"] });
      toast({ title: "Goal added successfully" });
    },
  });

  // Update goal mutation
  const updateGoal = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("learning_goals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-goals"] });
      toast({ title: "Goal updated successfully" });
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("learning_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-goals"] });
      toast({ title: "Goal deleted successfully" });
    },
  });

  // Add note mutation
  const addNote = useMutation({
    mutationFn: async (note: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("learning_notes")
        .insert({ ...note, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-notes"] });
      toast({ title: "Note saved successfully" });
    },
  });

  // Update note mutation
  const updateNote = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("learning_notes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-notes"] });
      toast({ title: "Note updated successfully" });
    },
  });

  // Delete note mutation
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("learning_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-notes"] });
      toast({ title: "Note deleted successfully" });
    },
  });

  // Upsert schedule mutation
  const upsertSchedule = useMutation({
    mutationFn: async (scheduleData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("learning_schedules")
        .upsert({ ...scheduleData, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-schedule"] });
      toast({ title: "Schedule saved successfully" });
    },
  });

  return {
    // Data
    sources,
    goals,
    notes,
    schedule,
    streak,
    // Loading states
    isLoading: sourcesLoading || goalsLoading || notesLoading || scheduleLoading || streakLoading,
    // Mutations
    addSource: addSource.mutate,
    updateSource: updateSource.mutate,
    deleteSource: deleteSource.mutate,
    addGoal: addGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    addNote: addNote.mutate,
    updateNote: updateNote.mutate,
    deleteNote: deleteNote.mutate,
    upsertSchedule: upsertSchedule.mutate,
    // Mutation states
    isAddingSource: addSource.isPending,
    isAddingGoal: addGoal.isPending,
    isAddingNote: addNote.isPending,
  };
};