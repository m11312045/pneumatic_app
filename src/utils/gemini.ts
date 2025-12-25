// src/lib/gemini.ts
import { supabase } from "../lib/supabase";

export async function analyzeWithGeminiEdge(body: {
  questionType: "COPY" | "TEXT" | "ADVANCED";
  promptText: string;
  answerImageUrl: string;
  referenceImageUrl?: string | null;
  bestAnswerText?: string;
}) {
  const { data, error } = await supabase.functions.invoke("gemini-analyze", {
    body,
  });

  if (error) {
    // supabase-js 會把 response body 放在 error.context?.response
    throw error;
  }

  return data;
}
