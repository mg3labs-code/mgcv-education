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
    PostgrestVersion: "14.1"
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
