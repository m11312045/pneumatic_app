export interface User {
  id: string;
  studentId: string;
  name: string;
}

export type QuestionType = 'COPY' | 'TEXT' | 'ADVANCED';

export interface Question {
  id: string;
  question_type: QuestionType;
  title?: string;
  prompt_text?: string;
  prompt_image_url?: string;
  explanation?: string;
  expected_labels?: string[];
  expected_counts?: Record<string, number>;
  difficulty: number;
  is_active: boolean;
  answer_image_url?: string;
}

export type ComponentType =
  | '32-way NC valve'
  | '32-way NO valve'
  | '52-way valve'
  | 'Double-acting cylinder'
  | 'Single-acting cylinder'
  | 'One-way flow control valve'
  | 'Shuttle valve'
  | 'Two-pressure valve';

export interface GeminiAnalysisResult {
  isCorrect: boolean;           // 題幹正確性
  bonusCorrect?: boolean;       // 加分題正確性 (進階題用)
  logicEquation?: string;       // 邏輯式 (進階題用)
  advice?: string;              // 改進之道 (20字內)
  detectedComponents?: string[]; // 偵測到的元件 (基本題用)
}

// 更新 Answer 介面
export interface Answer {
  questionId: string;
  imageData: string;
  detectedLabels?: string[];
  aiResult?: GeminiAnalysisResult; // 統一用這個欄位接 AI 結果
  isCorrect: boolean;
  score: number;
}

export interface AttemptWithDetails {
  id: string;
  student_id: string;
  student_name: string;
  student_no: string;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  copy_count: number;
  text_count: number;
  advanced_count: number;
  total_score: number;
  started_at: string;
  submitted_at: string | null;
  questions: Question[];
  items: AttemptItem[];
}

export interface AttemptItem {
  id: string;
  attempt_id: string;
  question_id: string;
  question?: Question;
  seq: number;
  answer_image_url: string | null;

  detected_labels: string[];
  match_pass: boolean | null;
  score: number;
  feedback: string | null;
  answered_at: string | null;

  ai_provider: string;   // default 'GEMINI'
  ai_model?: string | null;
  ai_result?: any;       // GeminiAnalysisResult
}

export const COMPONENT_NAMES: Record<ComponentType, string> = {
  '32-way NC valve': '三口二位常閉氣壓閥',
  '32-way NO valve': '三口二位常開氣壓閥',
  '52-way valve': '五口二位氣壓閥',
  'Double-acting cylinder': '雙動缸',
  'Single-acting cylinder': '單動缸',
  'One-way flow control valve': '單向節流閥',
  'Shuttle valve': '梭動閥',
  'Two-pressure valve': '雙壓閥',
};
