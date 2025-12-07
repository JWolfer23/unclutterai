export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          id: string
          type: string
          updated_at: string
          used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: string
          updated_at?: string
          used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_levels: {
        Row: {
          level: number
          updated_at: string
          user_id: string
          xp_to_next: number
          xp_total: number
        }
        Insert: {
          level?: number
          updated_at?: string
          user_id: string
          xp_to_next?: number
          xp_total?: number
        }
        Update: {
          level?: number
          updated_at?: string
          user_id?: string
          xp_to_next?: number
          xp_total?: number
        }
        Relationships: []
      }
      focus_rewards_history: {
        Row: {
          created_at: string
          id: string
          reward_value: number
          session_id: string | null
          streak_value: number
          tier_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward_value?: number
          session_id?: string | null
          streak_value?: number
          tier_value?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reward_value?: number
          session_id?: string | null
          streak_value?: number
          tier_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_rewards_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_session_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          mode: string
          session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          mode: string
          session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          mode?: string
          session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_session_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_minutes: number | null
          created_at: string | null
          end_time: string | null
          focus_score: number | null
          goal: string | null
          id: string
          interruptions: number | null
          is_completed: boolean | null
          mode: string | null
          notes: string | null
          planned_minutes: number
          start_time: string
          uct_reward: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string | null
          end_time?: string | null
          focus_score?: number | null
          goal?: string | null
          id?: string
          interruptions?: number | null
          is_completed?: boolean | null
          mode?: string | null
          notes?: string | null
          planned_minutes: number
          start_time: string
          uct_reward?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string | null
          end_time?: string | null
          focus_score?: number | null
          goal?: string | null
          id?: string
          interruptions?: number | null
          is_completed?: boolean | null
          mode?: string | null
          notes?: string | null
          planned_minutes?: number
          start_time?: string
          uct_reward?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      focus_streaks: {
        Row: {
          current_streak: number | null
          last_session: string | null
          longest_streak: number | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          last_session?: string | null
          longest_streak?: number | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          last_session?: string | null
          longest_streak?: number | null
          user_id?: string
        }
        Relationships: []
      }
      interruptions: {
        Row: {
          created_at: string | null
          id: string
          session_id: string | null
          source: string | null
          timestamp: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          source?: string | null
          timestamp?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          source?: string | null
          timestamp?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interruptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_goals: {
        Row: {
          created_at: string | null
          current_value: number
          description: string | null
          end_date: string | null
          goal_type: Database["public"]["Enums"]["learning_goal_type"]
          id: string
          is_completed: boolean | null
          start_date: string | null
          target_value: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number
          description?: string | null
          end_date?: string | null
          goal_type: Database["public"]["Enums"]["learning_goal_type"]
          id?: string
          is_completed?: boolean | null
          start_date?: string | null
          target_value?: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number
          description?: string | null
          end_date?: string | null
          goal_type?: Database["public"]["Enums"]["learning_goal_type"]
          id?: string
          is_completed?: boolean | null
          start_date?: string | null
          target_value?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          note_type: Database["public"]["Enums"]["learning_note_type"] | null
          source_id: string | null
          tags: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          note_type?: Database["public"]["Enums"]["learning_note_type"] | null
          source_id?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          note_type?: Database["public"]["Enums"]["learning_note_type"] | null
          source_id?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_notes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "learning_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_schedules: {
        Row: {
          channels: Json | null
          created_at: string | null
          days_of_week: Json | null
          delivery_time: string
          frequency: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          days_of_week?: Json | null
          delivery_time?: string
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          days_of_week?: Json | null
          delivery_time?: string
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_sources: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          isbn: string | null
          notes: string | null
          progress_percent: number | null
          source_type: Database["public"]["Enums"]["learning_source_type"]
          title: string
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          isbn?: string | null
          notes?: string | null
          progress_percent?: number | null
          source_type: Database["public"]["Enums"]["learning_source_type"]
          title: string
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          isbn?: string | null
          notes?: string | null
          progress_percent?: number | null
          source_type?: Database["public"]["Enums"]["learning_source_type"]
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_streaks: {
        Row: {
          current_streak: number | null
          last_session: string | null
          longest_streak: number | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          last_session?: string | null
          longest_streak?: number | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          last_session?: string | null
          longest_streak?: number | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          ai_summary: string | null
          content: string
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          metadata: Json | null
          platform: string
          preview: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          received_at: string | null
          sender_avatar: string | null
          sender_email: string | null
          sender_name: string
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          subject: string
          type: Database["public"]["Enums"]["message_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          platform: string
          preview?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          received_at?: string | null
          sender_avatar?: string | null
          sender_email?: string | null
          sender_name: string
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          subject: string
          type: Database["public"]["Enums"]["message_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          platform?: string
          preview?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          received_at?: string | null
          sender_avatar?: string | null
          sender_email?: string | null
          sender_name?: string
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          subject?: string
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      news_prompts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          prompt_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          prompt_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          prompt_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_schedules: {
        Row: {
          channels: Json | null
          created_at: string
          delivery_time: string
          frequency: string
          id: string
          is_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: Json | null
          created_at?: string
          delivery_time?: string
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: Json | null
          created_at?: string
          delivery_time?: string
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_summaries: {
        Row: {
          created_at: string
          id: string
          prompt_id: string | null
          summary_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_id?: string | null
          summary_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_id?: string | null
          summary_text?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          preferences: Json | null
          timezone: string | null
          updated_at: string | null
          wallet_address: string | null
          wallet_provider: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_provider?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_provider?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          importance: string | null
          message_id: string | null
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          score: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          importance?: string | null
          message_id?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          score?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          importance?: string | null
          message_id?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          score?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          balance: number | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      uct_claim_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          network: string
          status: string
          tx_hash: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          network?: string
          status?: string
          tx_hash?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          network?: string
          status?: string
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_ai_dashboard: {
        Row: {
          daily_summaries: number | null
          email: string | null
          focus_streak: number | null
          tasks_generated: number | null
          tokens_earned: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_focus_minutes_by_day: {
        Args: { p_user_id: string }
        Returns: {
          day: string
          total_minutes: number
        }[]
      }
      get_focus_minutes_today: { Args: { p_user_id: string }; Returns: number }
      get_focus_minutes_week: { Args: { p_user_id: string }; Returns: number }
      get_lifetime_uct: { Args: { p_user_id: string }; Returns: number }
      get_mode_usage_breakdown: {
        Args: { p_user_id: string }
        Returns: {
          mode: string
          session_count: number
          total_minutes: number
        }[]
      }
      get_sessions_this_week: { Args: { p_user_id: string }; Returns: number }
      get_uct_earned_month: { Args: { p_user_id: string }; Returns: number }
      get_uct_earned_week: { Args: { p_user_id: string }; Returns: number }
      get_user_weekly_stats: {
        Args: never
        Returns: {
          daily_summaries: number
          email: string
          focus_streak: number
          tasks_generated: number
          tokens_earned: number
        }[]
      }
      get_weekly_tier: {
        Args: { p_user_id: string }
        Returns: {
          bonus_percent: number
          sessions_count: number
          tier: string
        }[]
      }
    }
    Enums: {
      learning_goal_type: "daily" | "weekly" | "milestone"
      learning_note_type: "note" | "flashcard" | "summary"
      learning_source_type:
        | "course"
        | "book"
        | "pdf"
        | "video"
        | "audio"
        | "article"
      message_type: "email" | "text" | "social" | "voice"
      priority_level: "low" | "medium" | "high"
      sentiment_type: "positive" | "negative" | "neutral"
      task_status: "pending" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      learning_goal_type: ["daily", "weekly", "milestone"],
      learning_note_type: ["note", "flashcard", "summary"],
      learning_source_type: [
        "course",
        "book",
        "pdf",
        "video",
        "audio",
        "article",
      ],
      message_type: ["email", "text", "social", "voice"],
      priority_level: ["low", "medium", "high"],
      sentiment_type: ["positive", "negative", "neutral"],
      task_status: ["pending", "completed", "cancelled"],
    },
  },
} as const
