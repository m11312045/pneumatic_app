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
      }
      questions: {
        Row: {
          id: string
          question_type: 'COPY' | 'TEXT'
          title: string | null
          prompt_text: string | null
          prompt_image_url: string | null
          explanation: string | null
          expected_labels: string[]
          expected_counts: Json
          difficulty: number
          is_active: boolean
          created_at: string
          updated_at: string
          answer_image_url: string | null
        }
        Insert: {
          id?: string
          question_type: 'COPY' | 'TEXT'
          title?: string | null
          prompt_text?: string | null
          prompt_image_url?: string | null
          explanation?: string | null
          expected_labels: string[]
          expected_counts?: Json
          difficulty?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          answer_image_url: string | null
        }
        Update: {
          id?: string
          question_type?: 'COPY' | 'TEXT'
          title?: string | null
          prompt_text?: string | null
          prompt_image_url?: string | null
          explanation?: string | null
          expected_labels?: string[]
          expected_counts?: Json
          difficulty?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          answer_image_url: string | null
        }
      }
      attempts: {
        Row: {
          id: string
          student_id: string
          status: 'IN_PROGRESS' | 'SUBMITTED'
          copy_count: number
          text_count: number
          total_score: number
          started_at: string
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          status?: 'IN_PROGRESS' | 'SUBMITTED'
          copy_count?: number
          text_count?: number
          total_score?: number
          started_at?: string
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          status?: 'IN_PROGRESS' | 'SUBMITTED'
          copy_count?: number
          text_count?: number
          total_score?: number
          started_at?: string
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attempt_items: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          seq: number
          answer_image_url: string | null
          yolo_model_id: string | null
          yolo_result: Json | null
          detected_labels: string[]
          match_pass: boolean | null
          score: number
          feedback: string | null
          answered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          seq: number
          answer_image_url?: string | null
          yolo_model_id?: string | null
          yolo_result?: Json | null
          detected_labels?: string[]
          match_pass?: boolean | null
          score?: number
          feedback?: string | null
          answered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          seq?: number
          answer_image_url?: string | null
          yolo_model_id?: string | null
          yolo_result?: Json | null
          detected_labels?: string[]
          match_pass?: boolean | null
          score?: number
          feedback?: string | null
          answered_at?: string | null
          created_at?: string
          updated_at?: string
        }
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
      }
    }
  }
}
