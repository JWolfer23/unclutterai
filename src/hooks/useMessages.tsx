
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export const useMessages = () => {
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('received_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create message
  const createMessage = useMutation({
    mutationFn: async (message: MessageInsert) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "Message added",
        description: "New message has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add message: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update message
  const updateMessage = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MessageUpdate }) => {
      const { data, error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update message: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete message
  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "Message deleted",
        description: "Message has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete message: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    messages,
    isLoading,
    error,
    createMessage: createMessage.mutate,
    updateMessage: updateMessage.mutate,
    deleteMessage: deleteMessage.mutate,
    isCreating: createMessage.isPending,
    isUpdating: updateMessage.isPending,
    isDeleting: deleteMessage.isPending,
  };
};
