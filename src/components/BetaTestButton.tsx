import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const BetaTestButton = () => {
  const queryClient = useQueryClient();

  const resetWithMockData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Clear existing data and add mock data
      await Promise.all([
        // Add mock messages
        supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        // Clear focus sessions
        supabase.from('focus_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        // Reset tokens
        supabase.from('tokens').upsert({
          user_id: user.user.id,
          balance: 1247,
          updated_at: new Date().toISOString()
        }),
        // Reset streaks
        supabase.from('focus_streaks').upsert({
          user_id: user.user.id,
          current_streak: 5,
          longest_streak: 12,
          last_session: new Date().toISOString().split('T')[0]
        })
      ]);

      // Add mock messages
      const mockMessages = [
        {
          user_id: user.user.id,
          type: 'email' as const,
          sender_name: 'Sarah Johnson',
          sender_email: 'sarah@company.com',
          subject: 'Urgent: Project deadline moved up',
          content: 'Hi, we need to discuss the project timeline. The client wants delivery by Friday instead of next week.',
          preview: 'Hi, we need to discuss the project timeline...',
          priority: 'high' as const,
          platform: 'email',
          sentiment: 'neutral' as const,
          is_read: false
        },
        {
          user_id: user.user.id,
          type: 'social' as const,
          sender_name: 'LinkedIn Recruiter',
          subject: 'Quick question about your availability',
          content: 'Hi! I have a great opportunity that matches your skills. Are you open to a 15-min chat?',
          preview: 'Hi! I have a great opportunity...',
          priority: 'medium' as const,
          platform: 'linkedin',
          sentiment: 'positive' as const,
          is_read: false
        },
        {
          user_id: user.user.id,
          type: 'text' as const,
          sender_name: 'Jessica Martinez',
          subject: 'Lunch tomorrow?',
          content: 'Hey! Want to grab lunch tomorrow at 12:30? The new Italian place downtown?',
          preview: 'Hey! Want to grab lunch tomorrow...',
          priority: 'low' as const,
          platform: 'whatsapp',
          sentiment: 'positive' as const,
          is_read: true
        }
      ];

      await supabase.from('messages').insert(mockMessages);

      // Add mock tasks
      const mockTasks = [
        {
          user_id: user.user.id,
          title: 'Review project timeline',
          description: 'Discuss new deadline with team',
          priority: 'high' as const,
          status: 'pending' as const,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: user.user.id,
          title: 'Respond to recruiter',
          description: 'Schedule 15-min call',
          priority: 'medium' as const,
          status: 'pending' as const
        }
      ];

      await supabase.from('tasks').insert(mockTasks);

      // Add mock focus session
      await supabase.from('focus_sessions').insert({
        user_id: user.user.id,
        start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        planned_minutes: 60,
        actual_minutes: 55,
        interruptions: 1,
        focus_score: 87
      });

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      toast({
        title: "🧪 Beta Test Data Loaded",
        description: "Dashboard reset with mock data for testing",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset with test data",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={resetWithMockData}
      variant="outline"
      size="sm"
      className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
    >
      <RefreshCw className="w-4 h-4" />
      Test as Beta User
    </Button>
  );
};

export default BetaTestButton;