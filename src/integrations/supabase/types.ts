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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      assignment_questions: {
        Row: {
          assignment_id: string
          created_at: string
          expected_answer_hints: string | null
          id: string
          max_score: number
          question_number: number
          question_text: string
          rubric: Json
        }
        Insert: {
          assignment_id: string
          created_at?: string
          expected_answer_hints?: string | null
          id?: string
          max_score?: number
          question_number: number
          question_text: string
          rubric?: Json
        }
        Update: {
          assignment_id?: string
          created_at?: string
          expected_answer_hints?: string | null
          id?: string
          max_score?: number
          question_number?: number
          question_text?: string
          rubric?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assignment_questions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_name: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          is_published: boolean
          max_total_score: number | null
          subject: string
          teacher_id: string
          title: string
          unlock_date: string | null
          updated_at: string
        }
        Insert: {
          class_name: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_total_score?: number | null
          subject?: string
          teacher_id: string
          title: string
          unlock_date?: string | null
          updated_at?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_total_score?: number | null
          subject?: string
          teacher_id?: string
          title?: string
          unlock_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_name: string
          created_at: string
          date: string
          id: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_name: string
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          context: Json | null
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          context?: Json | null
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          context?: Json | null
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          block_type: string
          content: Json
          created_at: string
          episode_id: string
          icon: string | null
          id: string
          sort_order: number
          title: string | null
        }
        Insert: {
          block_type: string
          content?: Json
          created_at?: string
          episode_id: string
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string | null
        }
        Update: {
          block_type?: string
          content?: Json
          created_at?: string
          episode_id?: string
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "tb_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity: {
        Row: {
          activity_date: string
          created_at: string
          episodes_completed: number
          id: string
          layers_completed: number
          methods_used: number
          time_spent_seconds: number
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          episodes_completed?: number
          id?: string
          layers_completed?: number
          methods_used?: number
          time_spent_seconds?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          episodes_completed?: number
          id?: string
          layers_completed?: number
          methods_used?: number
          time_spent_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      episode_interactions: {
        Row: {
          block_index: number
          block_type: string
          chapter_id: string
          completed_at: string | null
          comprehension_attempts: number
          comprehension_result: string | null
          correct_on_first_try: boolean | null
          created_at: string
          episode_id: string
          id: string
          time_spent_seconds: number
          user_id: string
          wrong_attempts: number
        }
        Insert: {
          block_index: number
          block_type: string
          chapter_id: string
          completed_at?: string | null
          comprehension_attempts?: number
          comprehension_result?: string | null
          correct_on_first_try?: boolean | null
          created_at?: string
          episode_id: string
          id?: string
          time_spent_seconds?: number
          user_id: string
          wrong_attempts?: number
        }
        Update: {
          block_index?: number
          block_type?: string
          chapter_id?: string
          completed_at?: string | null
          comprehension_attempts?: number
          comprehension_result?: string | null
          correct_on_first_try?: boolean | null
          created_at?: string
          episode_id?: string
          id?: string
          time_spent_seconds?: number
          user_id?: string
          wrong_attempts?: number
        }
        Relationships: []
      }
      episode_progress: {
        Row: {
          chapter_id: string
          completed_at: string | null
          completion_pct: number
          episode_id: string
          id: string
          layer_scores: Json
          started_at: string
          time_spent_seconds: number
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          completion_pct?: number
          episode_id: string
          id?: string
          layer_scores?: Json
          started_at?: string
          time_spent_seconds?: number
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          completion_pct?: number
          episode_id?: string
          id?: string
          layer_scores?: Json
          started_at?: string
          time_spent_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      language_progress: {
        Row: {
          created_at: string
          grammar_patterns_mastered: number
          id: string
          passages_read: number
          progress_date: string
          sentences_written: number
          subject_name: string
          user_id: string
          words_learned: number
        }
        Insert: {
          created_at?: string
          grammar_patterns_mastered?: number
          id?: string
          passages_read?: number
          progress_date?: string
          sentences_written?: number
          subject_name: string
          user_id: string
          words_learned?: number
        }
        Update: {
          created_at?: string
          grammar_patterns_mastered?: number
          id?: string
          passages_read?: number
          progress_date?: string
          sentences_written?: number
          subject_name?: string
          user_id?: string
          words_learned?: number
        }
        Relationships: []
      }
      method_sessions: {
        Row: {
          chapter_id: string | null
          completed: boolean
          created_at: string
          duration_seconds: number
          episode_id: string | null
          id: string
          method_type: string
          score: number | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          episode_id?: string | null
          id?: string
          method_type: string
          score?: number | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          episode_id?: string | null
          id?: string
          method_type?: string
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      parent_messages: {
        Row: {
          class_name: string
          id: string
          message: string
          parent_email: string | null
          sent_at: string
          student_id: string
          subject: string
          teacher_id: string
        }
        Insert: {
          class_name: string
          id?: string
          message: string
          parent_email?: string | null
          sent_at?: string
          student_id: string
          subject: string
          teacher_id: string
        }
        Update: {
          class_name?: string
          id?: string
          message?: string
          parent_email?: string | null
          sent_at?: string
          student_id?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class_name: string | null
          created_at: string
          full_name: string
          id: string
          school_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          school_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          class_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          school_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          ai_confidence: number | null
          ai_feedback: Json | null
          ai_score: number | null
          created_at: string
          extracted_text: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_teacher_reviewed: boolean
          processing_error: string | null
          processing_status: string
          question_id: string
          retry_count: number
          student_id: string
          submission_id: string
          teacher_feedback: string | null
          teacher_score: number | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_feedback?: Json | null
          ai_score?: number | null
          created_at?: string
          extracted_text?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_teacher_reviewed?: boolean
          processing_error?: string | null
          processing_status?: string
          question_id: string
          retry_count?: number
          student_id: string
          submission_id: string
          teacher_feedback?: string | null
          teacher_score?: number | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_feedback?: Json | null
          ai_score?: number | null
          created_at?: string
          extracted_text?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_teacher_reviewed?: boolean
          processing_error?: string | null
          processing_status?: string
          question_id?: string
          retry_count?: number
          student_id?: string
          submission_id?: string
          teacher_feedback?: string | null
          teacher_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assignment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "student_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_breakthroughs: {
        Row: {
          created_at: string
          description: string | null
          dimension: string | null
          icon: string
          id: string
          title: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          dimension?: string | null
          icon?: string
          id?: string
          title: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          dimension?: string | null
          icon?: string
          id?: string
          title?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      student_inner_os: {
        Row: {
          attention_score: number
          character_score: number
          clarity_score: number
          created_at: string
          id: string
          level: number
          momentum_score: number
          overall_score: number
          streak_days: number
          thinking_score: number
          updated_at: string
          user_id: string
          weekly_growth: number
        }
        Insert: {
          attention_score?: number
          character_score?: number
          clarity_score?: number
          created_at?: string
          id?: string
          level?: number
          momentum_score?: number
          overall_score?: number
          streak_days?: number
          thinking_score?: number
          updated_at?: string
          user_id: string
          weekly_growth?: number
        }
        Update: {
          attention_score?: number
          character_score?: number
          clarity_score?: number
          created_at?: string
          id?: string
          level?: number
          momentum_score?: number
          overall_score?: number
          streak_days?: number
          thinking_score?: number
          updated_at?: string
          user_id?: string
          weekly_growth?: number
        }
        Relationships: []
      }
      student_preferences: {
        Row: {
          created_at: string
          difficulty_level: string
          grade: number | null
          id: string
          interests: string[] | null
          learning_style: string | null
          onboarding_completed: boolean
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_level?: string
          grade?: number | null
          id?: string
          interests?: string[] | null
          learning_style?: string | null
          onboarding_completed?: boolean
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_level?: string
          grade?: number | null
          id?: string
          interests?: string[] | null
          learning_style?: string | null
          onboarding_completed?: boolean
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          status: string
          student_id: string
          submitted_at: string | null
          teacher_remarks: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          teacher_remarks?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          teacher_remarks?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          board: string
          color: string | null
          created_at: string
          grade: number
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          board?: string
          color?: string | null
          created_at?: string
          grade?: number
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          board?: string
          color?: string | null
          created_at?: string
          grade?: number
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tb_chapters: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_published: boolean
          number: number
          page_range: string | null
          periods: number | null
          slug: string
          sort_order: number
          subject_id: string
          subtitle: string | null
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          number: number
          page_range?: string | null
          periods?: number | null
          slug: string
          sort_order?: number
          subject_id: string
          subtitle?: string | null
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          number?: number
          page_range?: string | null
          periods?: number | null
          slug?: string
          sort_order?: number
          subject_id?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_episodes: {
        Row: {
          chapter_id: string
          created_at: string
          duration: string | null
          id: string
          is_published: boolean
          number: number
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          type: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          duration?: string | null
          id?: string
          is_published?: boolean
          number: number
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          type?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          duration?: string | null
          id?: string
          is_published?: boolean
          number?: number
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_episodes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "tb_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_alerts: {
        Row: {
          alert_type: string
          class_name: string
          created_at: string
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string
          student_id: string
          suggested_action: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          alert_type: string
          class_name: string
          created_at?: string
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message: string
          student_id: string
          suggested_action?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          alert_type?: string
          class_name?: string
          created_at?: string
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string
          student_id?: string
          suggested_action?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: []
      }
      teacher_todos: {
        Row: {
          class_name: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          priority: string
          status: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_name?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      teaching_schedules: {
        Row: {
          chapters_data: Json
          class_name: string
          created_at: string
          id: string
          schedule_data: Json
          subject: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          chapters_data?: Json
          class_name?: string
          created_at?: string
          id?: string
          schedule_data?: Json
          subject?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          chapters_data?: Json
          class_name?: string
          created_at?: string
          id?: string
          schedule_data?: Json
          subject?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_class_averages: {
        Args: { _class_name: string }
        Returns: {
          avg_attention: number
          avg_character: number
          avg_clarity: number
          avg_momentum: number
          avg_overall: number
          avg_thinking: number
          student_count: number
        }[]
      }
      get_student_streak: { Args: { _user_id: string }; Returns: number }
      get_user_class: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      teacher_manages_class: {
        Args: { _class_name: string; _teacher_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
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
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const
