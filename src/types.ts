// src/types.ts

export type QuestionType = "COPY" | "TEXT" | "ADVANCED";

export interface User {
  id: string;
  student_no: string;
  name: string;
}

export interface Question {
  id: string;
  question_type: QuestionType;
  title?: string | null;
  prompt_text?: string | null;
  prompt_image_url?: string | null;
  answer_image_url?: string | null;
  explanation?: string | null;
  expected_labels: string[];
  expected_counts?: any;
  difficulty?: number | null;
  is_active?: boolean;
}

export interface Answer {
  questionId: string;
  seq: number;
  imageData: string; // base64 dataURL (for preview)
  imageUrl?: string; // public URL (storage)
  detectedLabels?: string[];
  isCorrect?: boolean;
  score?: number;
  aiResult?: any;
}

export const COMPONENT_NAMES: Record<string, string> = {
  // 你原本就有的 mapping 保留即可（此處放示意，請保留你的完整版本）
  // e.g.
  // "PB": "按鈕",
};
export interface AttemptItemDetail {
  id: string;
  attempt_id: string;
  question_id: string;
  seq: number;
  answer_image_url: string | null;
  detected_labels: string[] | null;
  match_pass: boolean | null;
  score: number;
  feedback: string | null;
  answered_at: string | null;
  ai_provider: string;
  ai_model: string | null;
  ai_result: any | null;
  question: Question | null;
}

export interface AttemptWithDetails {
  id: string;
  student_id: string;
  student_no: string;
  student_name: string;
  total_score: number;
  started_at: string;
  submitted_at: string | null;
  copy_count: number;
  text_count: number;
  advanced_count: number;
  items: AttemptItemDetail[];
}
