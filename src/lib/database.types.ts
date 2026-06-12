export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          criteria: Json
          description: string
          icon: string | null
          id: string
          is_active: boolean
          slug: string
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          criteria: Json
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          slug: string
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      chapter_progress: {
        Row: {
          chapter_id: string
          completed_at: string | null
          id: string
          started_at: string
          status: Database['public']['Enums']['progress_status']
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chapter_progress_chapter_id_fkey'
            columns: ['chapter_id']
            isOneToOne: false
            referencedRelation: 'chapters'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chapter_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          slug: string
          title: string
          updated_at: string
          week_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position: number
          slug: string
          title: string
          updated_at?: string
          week_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          slug?: string
          title?: string
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chapters_week_id_fkey'
            columns: ['week_id']
            isOneToOne: false
            referencedRelation: 'weeks'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_problems: {
        Row: {
          is_required: boolean
          lesson_id: string
          position: number
          problem_id: string
        }
        Insert: {
          is_required?: boolean
          lesson_id: string
          position?: number
          problem_id: string
        }
        Update: {
          is_required?: boolean
          lesson_id?: string
          position?: number
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_problems_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_problems_problem_id_fkey'
            columns: ['problem_id']
            isOneToOne: false
            referencedRelation: 'problems'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          quiz_score: number | null
          started_at: string
          status: Database['public']['Enums']['progress_status']
          time_spent_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          quiz_score?: number | null
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          time_spent_seconds?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          quiz_score?: number | null
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          time_spent_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          chapter_id: string
          content: Json
          created_at: string
          estimated_minutes: number
          id: string
          position: number
          slug: string
          title: string
          type: Database['public']['Enums']['lesson_type']
          updated_at: string
          xp_reward: number
        }
        Insert: {
          chapter_id: string
          content?: Json
          created_at?: string
          estimated_minutes?: number
          id?: string
          position: number
          slug: string
          title: string
          type: Database['public']['Enums']['lesson_type']
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          chapter_id?: string
          content?: Json
          created_at?: string
          estimated_minutes?: number
          id?: string
          position?: number
          slug?: string
          title?: string
          type?: Database['public']['Enums']['lesson_type']
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_chapter_id_fkey'
            columns: ['chapter_id']
            isOneToOne: false
            referencedRelation: 'chapters'
            referencedColumns: ['id']
          },
        ]
      }
      phase_progress: {
        Row: {
          completed_at: string | null
          id: string
          phase_id: string
          started_at: string
          status: Database['public']['Enums']['progress_status']
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          phase_id: string
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          phase_id?: string
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'phase_progress_phase_id_fkey'
            columns: ['phase_id']
            isOneToOne: false
            referencedRelation: 'phases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'phase_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      phases: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          position: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          position: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'phases_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      problem_attempts: {
        Row: {
          code: string
          created_at: string
          id: string
          language: string
          memory_kb: number | null
          passed_count: number
          problem_id: string
          runtime_ms: number | null
          test_results: Json | null
          total_count: number
          user_id: string
          verdict: Database['public']['Enums']['attempt_verdict']
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          language?: string
          memory_kb?: number | null
          passed_count?: number
          problem_id: string
          runtime_ms?: number | null
          test_results?: Json | null
          total_count?: number
          user_id: string
          verdict: Database['public']['Enums']['attempt_verdict']
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          language?: string
          memory_kb?: number | null
          passed_count?: number
          problem_id?: string
          runtime_ms?: number | null
          test_results?: Json | null
          total_count?: number
          user_id?: string
          verdict?: Database['public']['Enums']['attempt_verdict']
        }
        Relationships: [
          {
            foreignKeyName: 'problem_attempts_problem_id_fkey'
            columns: ['problem_id']
            isOneToOne: false
            referencedRelation: 'problems'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'problem_attempts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      problems: {
        Row: {
          created_at: string
          description_md: string
          difficulty: Database['public']['Enums']['difficulty']
          function_name: string
          hints: Json
          id: string
          is_published: boolean
          slug: string
          solution_code: Json
          starter_code: Json
          tags: string[]
          test_cases: Json
          time_limit_ms: number
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description_md: string
          difficulty: Database['public']['Enums']['difficulty']
          function_name: string
          hints?: Json
          id?: string
          is_published?: boolean
          slug: string
          solution_code?: Json
          starter_code?: Json
          tags?: string[]
          test_cases?: Json
          time_limit_ms?: number
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description_md?: string
          difficulty?: Database['public']['Enums']['difficulty']
          function_name?: string
          hints?: Json
          id?: string
          is_published?: boolean
          slug?: string
          solution_code?: Json
          starter_code?: Json
          tags?: string[]
          test_cases?: Json
          time_limit_ms?: number
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          level: number
          role: Database['public']['Enums']['user_role']
          timezone: string
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          level?: number
          role?: Database['public']['Enums']['user_role']
          timezone?: string
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          level?: number
          role?: Database['public']['Enums']['user_role']
          timezone?: string
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          pass_threshold: number
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          pass_threshold?: number
          questions?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          pass_threshold?: number
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quizzes_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: true
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      review_queue: {
        Row: {
          created_at: string
          due_at: string
          id: string
          interval_index: number
          lapses: number
          last_reviewed_at: string | null
          problem_id: string
          status: Database['public']['Enums']['mastery_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at: string
          id?: string
          interval_index?: number
          lapses?: number
          last_reviewed_at?: string | null
          problem_id: string
          status?: Database['public']['Enums']['mastery_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string
          id?: string
          interval_index?: number
          lapses?: number
          last_reviewed_at?: string | null
          problem_id?: string
          status?: Database['public']['Enums']['mastery_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'review_queue_problem_id_fkey'
            columns: ['problem_id']
            isOneToOne: false
            referencedRelation: 'problems'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'review_queue_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'streaks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey'
            columns: ['achievement_id']
            isOneToOne: false
            referencedRelation: 'achievements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_achievements_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      week_progress: {
        Row: {
          completed_at: string | null
          id: string
          started_at: string
          status: Database['public']['Enums']['progress_status']
          user_id: string
          week_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          user_id: string
          week_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database['public']['Enums']['progress_status']
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'week_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'week_progress_week_id_fkey'
            columns: ['week_id']
            isOneToOne: false
            referencedRelation: 'weeks'
            referencedColumns: ['id']
          },
        ]
      }
      weeks: {
        Row: {
          created_at: string
          description: string | null
          goal: string | null
          id: string
          phase_id: string
          position: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          phase_id: string
          position: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          phase_id?: string
          position?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'weeks_phase_id_fkey'
            columns: ['phase_id']
            isOneToOne: false
            referencedRelation: 'phases'
            referencedColumns: ['id']
          },
        ]
      }
      xp_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'xp_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_lesson: {
        Args: { p_lesson_id: string; p_quiz_score?: number; p_user_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      level_from_xp: { Args: { p_xp: number }; Returns: number }
      submit_problem_attempt: {
        Args: {
          p_code: string
          p_language: string
          p_passed: number
          p_problem_id: string
          p_runtime_ms?: number
          p_test_results?: Json
          p_total: number
          p_user_id: string
          p_verdict: Database['public']['Enums']['attempt_verdict']
        }
        Returns: Json
      }
      touch_streak: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: {
      attempt_verdict: 'passed' | 'failed' | 'error' | 'timeout'
      difficulty: 'easy' | 'medium' | 'hard'
      lesson_type: 'theory' | 'example' | 'quiz' | 'practice' | 'revision'
      mastery_status: 'new' | 'learning' | 'practicing' | 'mastered'
      progress_status: 'not_started' | 'in_progress' | 'completed'
      user_role: 'student' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attempt_verdict: ['passed', 'failed', 'error', 'timeout'],
      difficulty: ['easy', 'medium', 'hard'],
      lesson_type: ['theory', 'example', 'quiz', 'practice', 'revision'],
      mastery_status: ['new', 'learning', 'practicing', 'mastered'],
      progress_status: ['not_started', 'in_progress', 'completed'],
      user_role: ['student', 'admin'],
    },
  },
} as const
