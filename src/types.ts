export interface User {
  id: string;
  studentId: string;
  name: string;
}

export type QuestionType = 'COPY' | 'TEXT';

export interface Question {
  id: string;
  question_type: QuestionType;
  title?: string;
  prompt_text?: string;
  prompt_image_url?: string;
  explanation?: string;
  expected_labels: string[];
  expected_counts?: Record<string, number>;
  difficulty: number;
  is_active: boolean;
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

export interface Answer {
  questionId: string;
  imageData: string;
  detectedLabels: string[];
  yoloResult: any;
  isCorrect: boolean;
  confidence?: number;
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
  yolo_result: any;
  detected_labels: string[];
  match_pass: boolean | null;
  score: number;
  feedback: string | null;
  answered_at: string | null;
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
