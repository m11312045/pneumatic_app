// src/utils/gemini.ts
import { supabase } from "../lib/supabase";

export type GeminiAnalysisResult = {
  isCorrect: boolean;
  detectedComponents: string[];
  bonusCorrect?: boolean;
  logicEquation?: string;
  advice?: string;
  ai_model?: string;
};

export async function analyzeWithGeminiEdge(input: {
  questionType: "COPY" | "TEXT" | "ADVANCED";
  promptText: string;
  answerImageUrl?: string;
  bestAnswerText?: string;
}) {
  const { data, error } = await supabase.functions.invoke("gemini-analyze", {
    body: input,
  });

  if (error) {
    // @ts-ignore
    const res: Response | undefined = error.context?.response;
    if (res) console.error("Edge error body:", await res.text());
    throw error;
  }
  return data;
}