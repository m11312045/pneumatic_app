// Auto-generated-ish types for Supabase.
// NOTE: This file was rewritten to match the SQL schema you pasted (attempts/attempt_items/questions/students).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          student_no: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_no: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_no?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      questions: {
        Row: {
          id: string
          question_type: Database['public']['Enums']['question_type']
          title: string | null
          prompt_text: string | null
          prompt_image_url: string | null
          answer_image_url: string | null
          explanation: string | null
          expected_labels: string[]
          expected_counts: Json | null
          difficulty: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_type: Database['public']['Enums']['question_type']
          title?: string | null
          prompt_text?: string | null
          prompt_image_url?: string | null
          answer_image_url?: string | null
          explanation?: string | null
          expected_labels: string[]
          expected_counts?: Json | null
          difficulty?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_type?: Database['public']['Enums']['question_type']
          title?: string | null
          prompt_text?: string | null
          prompt_image_url?: string | null
          answer_image_url?: string | null
          explanation?: string | null
          expected_labels?: string[]
          expected_counts?: Json | null
          difficulty?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      attempts: {
        Row: {
          id: string
          student_id: string
          status: Database['public']['Enums']['attempt_status']
          copy_count: number
          text_count: number
          advanced_count: number
          total_score: number
          started_at: string
          submitted_at: string | null
          created_at: string
          updated_at: string
          exam_type: string
          mode: string | null
        }
        Insert: {
          id?: string
          student_id: string
          status?: Database['public']['Enums']['attempt_status']
          copy_count?: number
          text_count?: number
          advanced_count?: number
          total_score?: number
          started_at?: string
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          exam_type?: string
          mode?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          status?: Database['public']['Enums']['attempt_status']
          copy_count?: number
          text_count?: number
          advanced_count?: number
          total_score?: number
          started_at?: string
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          exam_type?: string
          mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attempts_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }

      attempt_items: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          seq: number
          answer_image_url: string | null
          detected_labels: string[] | null
          match_pass: boolean | null
          score: number
          feedback: string | null
          answered_at: string | null
          created_at: string
          updated_at: string
          ai_provider: string
          ai_model: string | null
          ai_result: Json | null
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          seq: number
          answer_image_url?: string | null
          detected_labels?: string[] | null
          match_pass?: boolean | null
          score?: number
          feedback?: string | null
          answered_at?: string | null
          created_at?: string
          updated_at?: string
          ai_provider?: string
          ai_model?: string | null
          ai_result?: Json | null
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          seq?: number
          answer_image_url?: string | null
          detected_labels?: string[] | null
          match_pass?: boolean | null
          score?: number
          feedback?: string | null
          answered_at?: string | null
          created_at?: string
          updated_at?: string
          ai_provider?: string
          ai_model?: string | null
          ai_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'attempt_items_attempt_id_fkey'
            columns: ['attempt_id']
            referencedRelation: 'attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attempt_items_question_id_fkey'
            columns: ['question_id']
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      }

      pneumatic_classes: {
        Row: {
          id: number
          label_en: string
          label_zh: string
          is_active: boolean
        }
        Insert: {
          id?: number
          label_en: string
          label_zh: string
          is_active?: boolean
        }
        Update: {
          id?: number
          label_en?: string
          label_zh?: string
          is_active?: boolean
        }
        Relationships: []
      }
    }

    Enums: {
      attempt_status: 'IN_PROGRESS' | 'SUBMITTED' | 'CANCELLED'
      question_type: 'COPY' | 'TEXT' | 'ADVANCED'
    }
  }
}
