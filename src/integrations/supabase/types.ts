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
      admin_profiles: {
        Row: {
          boards: string[]
          created_at: string
          full_name: string
          grades: number[]
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          boards?: string[]
          created_at?: string
          full_name?: string
          grades?: number[]
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          boards?: string[]
          created_at?: string
          full_name?: string
          grades?: number[]
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          board: string | null
          class_name: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          is_published: boolean
          max_total_score: number | null
          schedule_date: string | null
          schedule_topic_key: string | null
          section: string | null
          source: string
          subject: string
          teacher_id: string
          title: string
          unlock_date: string | null
          updated_at: string
        }
        Insert: {
          board?: string | null
          class_name: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_total_score?: number | null
          schedule_date?: string | null
          schedule_topic_key?: string | null
          section?: string | null
          source?: string
          subject?: string
          teacher_id: string
          title: string
          unlock_date?: string | null
          updated_at?: string
        }
        Update: {
          board?: string | null
          class_name?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_total_score?: number | null
          schedule_date?: string | null
          schedule_topic_key?: string | null
          section?: string | null
          source?: string
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
          board: string | null
          class_name: string
          created_at: string
          date: string
          id: string
          section: string | null
          status: string
          student_id: string
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          board?: string | null
          class_name: string
          created_at?: string
          date?: string
          id?: string
          section?: string | null
          status?: string
          student_id: string
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          board?: string | null
          class_name?: string
          created_at?: string
          date?: string
          id?: string
          section?: string | null
          status?: string
          student_id?: string
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      boards: {
        Row: {
          code: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      calendar: {
        Row: {
          board: string | null
          chapter_color: string | null
          chapter_id: string | null
          chapter_name: string | null
          chapter_ref_id: string | null
          class_name: string
          created_at: string
          date: string
          entry_type: string
          id: string
          is_national_holiday: boolean
          label: string | null
          notes: string | null
          school_name: string | null
          section: string | null
          subject: string
          teacher_id: string
          topic_key: string | null
          topic_title: string | null
          updated_at: string
        }
        Insert: {
          board?: string | null
          chapter_color?: string | null
          chapter_id?: string | null
          chapter_name?: string | null
          chapter_ref_id?: string | null
          class_name: string
          created_at?: string
          date: string
          entry_type: string
          id?: string
          is_national_holiday?: boolean
          label?: string | null
          notes?: string | null
          school_name?: string | null
          section?: string | null
          subject: string
          teacher_id: string
          topic_key?: string | null
          topic_title?: string | null
          updated_at?: string
        }
        Update: {
          board?: string | null
          chapter_color?: string | null
          chapter_id?: string | null
          chapter_name?: string | null
          chapter_ref_id?: string | null
          class_name?: string
          created_at?: string
          date?: string
          entry_type?: string
          id?: string
          is_national_holiday?: boolean
          label?: string | null
          notes?: string | null
          school_name?: string | null
          section?: string | null
          subject?: string
          teacher_id?: string
          topic_key?: string | null
          topic_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_chapter_ref_id_fkey"
            columns: ["chapter_ref_id"]
            isOneToOne: false
            referencedRelation: "calendar_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_chapters: {
        Row: {
          board: string | null
          chapter_color: string | null
          chapter_id: string
          chapter_name: string
          class_name: string
          created_at: string
          id: string
          section: string | null
          sort_order: number
          subject: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          board?: string | null
          chapter_color?: string | null
          chapter_id: string
          chapter_name: string
          class_name: string
          created_at?: string
          id?: string
          section?: string | null
          sort_order?: number
          subject: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          board?: string | null
          chapter_color?: string | null
          chapter_id?: string
          chapter_name?: string
          class_name?: string
          created_at?: string
          id?: string
          section?: string | null
          sort_order?: number
          subject?: string
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
      concept_rungs: {
        Row: {
          chapter_id: string
          concept_key: string
          created_at: string
          episode_id: string
          id: string
          region: string | null
          rung_1: Json
          rung_2: Json
          rung_3: Json
          rung_4: Json
          rung_5: Json
          source: string
          subject: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          concept_key: string
          created_at?: string
          episode_id: string
          id?: string
          region?: string | null
          rung_1?: Json
          rung_2?: Json
          rung_3?: Json
          rung_4?: Json
          rung_5?: Json
          source?: string
          subject: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          concept_key?: string
          created_at?: string
          episode_id?: string
          id?: string
          region?: string | null
          rung_1?: Json
          rung_2?: Json
          rung_3?: Json
          rung_4?: Json
          rung_5?: Json
          source?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          block_type: string
          content: Json
          created_at: string
          depth: string
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
          depth?: string
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
          depth?: string
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
      curiosity_arc_progress: {
        Row: {
          concept_key: string
          created_at: string
          current_day: number
          current_step: string
          day1_completed_at: string | null
          day1_first_thought: string | null
          day1_guess: string | null
          day2_belief: string | null
          day2_completed_at: string | null
          day2_own_words: string | null
          day3_case_answers: Json | null
          day3_completed_at: string | null
          day3_teach_line: string | null
          id: string
          interest_tag: string | null
          signals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_key: string
          created_at?: string
          current_day?: number
          current_step?: string
          day1_completed_at?: string | null
          day1_first_thought?: string | null
          day1_guess?: string | null
          day2_belief?: string | null
          day2_completed_at?: string | null
          day2_own_words?: string | null
          day3_case_answers?: Json | null
          day3_completed_at?: string | null
          day3_teach_line?: string | null
          id?: string
          interest_tag?: string | null
          signals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_key?: string
          created_at?: string
          current_day?: number
          current_step?: string
          day1_completed_at?: string | null
          day1_first_thought?: string | null
          day1_guess?: string | null
          day2_belief?: string | null
          day2_completed_at?: string | null
          day2_own_words?: string | null
          day3_case_answers?: Json | null
          day3_completed_at?: string | null
          day3_teach_line?: string | null
          id?: string
          interest_tag?: string | null
          signals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      doc_glossary: {
        Row: {
          created_at: string
          domain: string | null
          english: string
          id: string
          rule: string
          target_lang: string
          translation: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          english: string
          id?: string
          rule?: string
          target_lang?: string
          translation: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          english?: string
          id?: string
          rule?: string
          target_lang?: string
          translation?: string
        }
        Relationships: []
      }
      doc_translation_cache: {
        Row: {
          created_at: string
          hits: number
          source_hash: string
          target_lang: string
          term_style: string
          translated: Json
        }
        Insert: {
          created_at?: string
          hits?: number
          source_hash: string
          target_lang: string
          term_style: string
          translated: Json
        }
        Update: {
          created_at?: string
          hits?: number
          source_hash?: string
          target_lang?: string
          term_style?: string
          translated?: Json
        }
        Relationships: []
      }
      doc_translation_chunks: {
        Row: {
          created_at: string
          error: string | null
          id: string
          idx: number
          job_id: string
          kind: string
          source: Json
          source_hash: string | null
          status: string
          translated: Json | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          idx: number
          job_id: string
          kind?: string
          source: Json
          source_hash?: string | null
          status?: string
          translated?: Json | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          idx?: number
          job_id?: string
          kind?: string
          source?: Json
          source_hash?: string | null
          status?: string
          translated?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_translation_chunks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "doc_translation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_translation_jobs: {
        Row: {
          content_hash: string | null
          created_at: string
          doc_type: string
          done_chunks: number
          error: string | null
          failed_chunks: number
          file_name: string
          file_path: string | null
          file_size: number | null
          guest_id: string | null
          id: string
          source_lang: string
          status: string
          target_lang: string
          term_style: string
          total_chunks: number
          updated_at: string
          user_id: string | null
          validation: Json
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          doc_type?: string
          done_chunks?: number
          error?: string | null
          failed_chunks?: number
          file_name: string
          file_path?: string | null
          file_size?: number | null
          guest_id?: string | null
          id?: string
          source_lang?: string
          status?: string
          target_lang?: string
          term_style?: string
          total_chunks?: number
          updated_at?: string
          user_id?: string | null
          validation?: Json
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          doc_type?: string
          done_chunks?: number
          error?: string | null
          failed_chunks?: number
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          guest_id?: string | null
          id?: string
          source_lang?: string
          status?: string
          target_lang?: string
          term_style?: string
          total_chunks?: number
          updated_at?: string
          user_id?: string | null
          validation?: Json
        }
        Relationships: []
      }
      episode_interactions: {
        Row: {
          answer_changes: number
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
          answer_changes?: number
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
          answer_changes?: number
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
      grades: {
        Row: {
          grade: number
          label: string
        }
        Insert: {
          grade: number
          label: string
        }
        Update: {
          grade?: number
          label?: string
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
      m_calendar: {
        Row: {
          board: string
          calendar_data: Json
          class_name: string
          created_at: string
          id: string
          section: string
          subject: string
          updated_at: string
        }
        Insert: {
          board: string
          calendar_data?: Json
          class_name: string
          created_at?: string
          id?: string
          section: string
          subject: string
          updated_at?: string
        }
        Update: {
          board?: string
          calendar_data?: Json
          class_name?: string
          created_at?: string
          id?: string
          section?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      m_calendar_audit: {
        Row: {
          board: string
          calendar_id: string
          changed_at: string
          class_name: string
          id: number
          new_data: Json
          old_data: Json | null
          section: string
          subject: string
          teacher: string
        }
        Insert: {
          board: string
          calendar_id: string
          changed_at?: string
          class_name: string
          id?: number
          new_data: Json
          old_data?: Json | null
          section: string
          subject: string
          teacher: string
        }
        Update: {
          board?: string
          calendar_id?: string
          changed_at?: string
          class_name?: string
          id?: number
          new_data?: Json
          old_data?: Json | null
          section?: string
          subject?: string
          teacher?: string
        }
        Relationships: []
      }
      m_holidays: {
        Row: {
          created_at: string
          date: string
          id: number
          label: string
          scope: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: number
          label: string
          scope?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: number
          label?: string
          scope?: string
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
      national_holidays: {
        Row: {
          created_at: string
          date: string
          label: string
        }
        Insert: {
          created_at?: string
          date: string
          label: string
        }
        Update: {
          created_at?: string
          date?: string
          label?: string
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
      reasoning_visuals: {
        Row: {
          created_at: string
          grade: string
          id: string
          quiz: Json | null
          search_tokens: unknown
          slug: string
          steps: Json
          subject: string
          topic: string
        }
        Insert: {
          created_at?: string
          grade?: string
          id?: string
          quiz?: Json | null
          search_tokens?: unknown
          slug: string
          steps?: Json
          subject?: string
          topic: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          quiz?: Json | null
          search_tokens?: unknown
          slug?: string
          steps?: Json
          subject?: string
          topic?: string
        }
        Relationships: []
      }
      retention_predictions: {
        Row: {
          chapter_id: string
          concept_key: string
          concept_label: string
          confidence: number
          episode_id: string
          generated_at: string
          id: string
          predicted_for_date: string
          recommended_action: string
          risk_level: string
          risk_score: number
          signals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          concept_key: string
          concept_label: string
          confidence?: number
          episode_id: string
          generated_at?: string
          id?: string
          predicted_for_date?: string
          recommended_action?: string
          risk_level?: string
          risk_score?: number
          signals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          concept_key?: string
          concept_label?: string
          confidence?: number
          episode_id?: string
          generated_at?: string
          id?: string
          predicted_for_date?: string
          recommended_action?: string
          risk_level?: string
          risk_score?: number
          signals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          code: string
          is_default: boolean
          school_name: string | null
        }
        Insert: {
          code: string
          is_default?: boolean
          school_name?: string | null
        }
        Update: {
          code?: string
          is_default?: boolean
          school_name?: string | null
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
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assignment_questions_student"
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
          interest_domains: string[]
          interests: string[] | null
          learning_style: string | null
          milestones_seen: Json | null
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
          interest_domains?: string[]
          interests?: string[] | null
          learning_style?: string | null
          milestones_seen?: Json | null
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
          interest_domains?: string[]
          interests?: string[] | null
          learning_style?: string | null
          milestones_seen?: Json | null
          onboarding_completed?: boolean
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          board: string
          created_at: string
          full_name: string
          grade: number
          phone: string | null
          school_name: string | null
          section: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board: string
          created_at?: string
          full_name?: string
          grade: number
          phone?: string | null
          school_name?: string | null
          section: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board?: string
          created_at?: string
          full_name?: string
          grade?: number
          phone?: string | null
          school_name?: string | null
          section?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_rung_state: {
        Row: {
          chapter_id: string
          concept_key: string
          created_at: string
          current_rung: number
          depth_track: string
          episode_id: string
          id: string
          last_signal: Json
          updated_at: string
          user_id: string
          vibe_check_shown_today: boolean
        }
        Insert: {
          chapter_id: string
          concept_key: string
          created_at?: string
          current_rung?: number
          depth_track?: string
          episode_id: string
          id?: string
          last_signal?: Json
          updated_at?: string
          user_id: string
          vibe_check_shown_today?: boolean
        }
        Update: {
          chapter_id?: string
          concept_key?: string
          created_at?: string
          current_rung?: number
          depth_track?: string
          episode_id?: string
          id?: string
          last_signal?: Json
          updated_at?: string
          user_id?: string
          vibe_check_shown_today?: boolean
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
      subjects_catalog: {
        Row: {
          code: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tb_chapters: {
        Row: {
          board: string | null
          color: string | null
          created_at: string
          grade: number | null
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
          board?: string | null
          color?: string | null
          created_at?: string
          grade?: number | null
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
          board?: string | null
          color?: string | null
          created_at?: string
          grade?: number | null
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
          subject: string | null
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
          subject?: string | null
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
          subject?: string | null
          suggested_action?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          created_at: string
          full_name: string
          phone: string | null
          school_name: string | null
          sections: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          phone?: string | null
          school_name?: string | null
          sections?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          phone?: string | null
          school_name?: string | null
          sections?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_teaching_map: {
        Row: {
          board: string
          created_at: string
          grade: number
          id: string
          section: string
          subject: string
          teacher_id: string
        }
        Insert: {
          board: string
          created_at?: string
          grade: number
          id?: string
          section: string
          subject: string
          teacher_id: string
        }
        Update: {
          board?: string
          created_at?: string
          grade?: number
          id?: string
          section?: string
          subject?: string
          teacher_id?: string
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
      teacher_world_digests: {
        Row: {
          board: string
          class_name: string
          expires_at: string
          generated_at: string
          id: string
          payload: Json
          subject: string
        }
        Insert: {
          board?: string
          class_name: string
          expires_at?: string
          generated_at?: string
          id?: string
          payload: Json
          subject: string
        }
        Update: {
          board?: string
          class_name?: string
          expires_at?: string
          generated_at?: string
          id?: string
          payload?: Json
          subject?: string
        }
        Relationships: []
      }
      teaching_schedules: {
        Row: {
          board: string | null
          chapters_data: Json
          class_name: string
          created_at: string
          id: string
          schedule_data: Json
          section: string | null
          subject: string
          subject_norm: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          board?: string | null
          chapters_data?: Json
          class_name?: string
          created_at?: string
          id?: string
          schedule_data?: Json
          section?: string | null
          subject?: string
          subject_norm?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          board?: string | null
          chapters_data?: Json
          class_name?: string
          created_at?: string
          id?: string
          schedule_data?: Json
          section?: string | null
          subject?: string
          subject_norm?: string | null
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
      assignment_questions_student: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          id: string | null
          max_score: number | null
          question_number: number | null
          question_text: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string | null
          max_score?: number | null
          question_number?: number | null
          question_text?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string | null
          max_score?: number | null
          question_number?: number | null
          question_text?: string | null
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
      my_teachers: {
        Row: {
          board: string | null
          full_name: string | null
          grade: number | null
          section: string | null
          subject: string | null
          teacher_id: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class_name: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          interest_tag: string | null
          interests: string[] | null
          interests_set_at: string | null
          profile_kind: string | null
          region: string | null
          school_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
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
      get_my_student_phone: { Args: never; Returns: string }
      get_my_teacher_phone: { Args: never; Returns: string }
      get_student_streak: { Args: { _user_id: string }; Returns: number }
      get_user_class: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_weekly_interest_summary: {
        Args: { _user_id: string }
        Returns: {
          avg_time_after_seconds: number
          avg_time_before_seconds: number
          cutover_at: string
          episodes_after: number
          episodes_before: number
          first_try_rate_after: number
          first_try_rate_before: number
          has_interests: boolean
          high_risk_after: number
          high_risk_before: number
          top_interest: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      m_fn_validate_calendar_entry: {
        Args: { p_entry: Json }
        Returns: boolean
      }
      m_generate_weekends: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: undefined
      }
      m_get_calendar_range: {
        Args: {
          p_board: string
          p_class_name: string
          p_end_date: string
          p_section: string
          p_start_date: string
          p_subject: string
          p_teacher: string
        }
        Returns: {
          chapter_name: string
          date: string
          entry_type: string
          holiday_label: string
          notes: string
          topic_title: string
        }[]
      }
      m_set_calendar_day: {
        Args: {
          p_board: string
          p_class_name: string
          p_date: string
          p_day_entry: Json
          p_section: string
          p_subject: string
          p_teacher: string
        }
        Returns: string
      }
      m_upsert_calendar: {
        Args: {
          p_board: string
          p_calendar_data: Json
          p_class_name: string
          p_section: string
          p_subject: string
          p_teacher: string
        }
        Returns: string
      }
      recalculate_retention_predictions: { Args: never; Returns: number }
      student_context: {
        Args: { _user_id: string }
        Returns: {
          board: string
          grade: number
          section: string
        }[]
      }
      teacher_covers: {
        Args: {
          _board: string
          _grade: number
          _section: string
          _subject: string
          _teacher_id: string
        }
        Returns: boolean
      }
      teacher_manages_class: {
        Args: { _class_name: string; _teacher_id: string }
        Returns: boolean
      }
      teacher_teaches: {
        Args: { _class_name: string; _subject: string; _teacher_id: string }
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
