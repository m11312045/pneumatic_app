// src/lib/api.ts
import { supabase } from "./supabase";
import type { Answer, Question, AttemptWithDetails, User } from "../types";
import { analyzeWithGeminiEdge } from "../utils/gemini";

// ---------- utils ----------
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, Math.max(0, n));
}

// ---------- 抽題策略 ----------
export function selectQuestionsByStrategy(all: Question[]) {
  const active = all.filter((q) => q.is_active !== false);
  const basicPool = active.filter(q => q.question_type === "COPY" || q.question_type === "TEXT");
  const advPool = active.filter(q => q.question_type === "ADVANCED");

  const basicNeed = 3;
  const advNeed = 7;
  const advHardCap = 3;

  const basicPick = take(shuffle(basicPool), basicNeed);
  const advHard = advPool.filter((q) => (q.difficulty ?? 1) === 3);
  const advNonHard = advPool.filter((q) => (q.difficulty ?? 1) !== 3);

  const advHardPick = take(shuffle(advHard), advHardCap);
  const advRestPick = take(shuffle(advNonHard), Math.max(0, advNeed - advHardPick.length));
  
  return {
    selected: [...basicPick, ...advHardPick, ...advRestPick],
    shortage: { /* 保持原樣供 UI 提示 */ }
  };
}

// ---------- 身份驗證 ----------
export async function loginOrRegisterStudent(studentNo: string, name: string): Promise<User> {
  const sn = studentNo.trim();
  const nm = name.trim();
  if (!sn || !nm) throw new Error("請輸入學號與姓名");

  const { data: found, error: e1 } = await supabase
    .from("students")
    .select("*")
    .eq("student_no", sn)
    .eq("name", nm)
    .maybeSingle();

  if (found) return { id: found.id, student_no: found.student_no, name: found.name };

  const { data: created, error: e2 } = await supabase
    .from("students")
    .insert({ student_no: sn, name: nm })
    .select("*")
    .single();

  if (e2) throw e2;
  return { id: created.id, student_no: created.student_no, name: created.name };
}

// ---------- 測驗流程 (關鍵修改：初始化 Attempt) ----------
export async function createInitialAttempt(studentId: string, questions: Question[]): Promise<string> {
  // 1. 先建立主記錄
  const { data: attempt, error: e1 } = await supabase
    .from("attempts")
    .insert({
      student_id: studentId,
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
      copy_count: questions.filter(q => q.question_type === "COPY").length,
      text_count: questions.filter(q => q.question_type === "TEXT").length,
      advanced_count: questions.filter(q => q.question_type === "ADVANCED").length,
    })
    .select("id")
    .single();

  if (e1) throw e1;

  // 2. 預建項目，這樣 QuestionCard 上傳時才知道要 Update 哪一筆
  const items = questions.map((q, idx) => ({
    attempt_id: attempt.id,
    question_id: q.id,
    seq: idx + 1,
    ai_provider: "GEMINI",
  }));

  const { error: e2 } = await supabase.from("attempt_items").insert(items);
  if (e2) throw e2;

  return attempt.id;
}

// ---------- 核心分析 (圖片已由前端上傳到 Storage) ----------
export async function analyzeAllAnswers(args: {
  attemptId: string;
  studentId: string;
  questions: Question[];
  answers: Answer[];
}): Promise<{ analyzedAnswers: Answer[] }> {
  const { attemptId, questions, answers } = args;
  const analyzed: Answer[] = [];
  let totalScore = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers.find((x) => x.questionId === q.id);

    if (!a?.imageUrl) throw new Error(`第 ${i + 1} 題圖片未完成上傳`);

    const referenceUrl = q.question_type === 'COPY' ? q.prompt_image_url : q.answer_image_url;

    // 呼叫 Edge Function
    const ai = await analyzeWithGeminiEdge({
      questionType: q.question_type,
      promptText: q.prompt_text ?? "",
      answerImageUrl: a.imageUrl,       // 已在 Storage 的網址
      referenceImageUrl: referenceUrl ?? undefined,
      bestAnswerText: q.explanation ?? undefined,
    });

    const isCorrect = !!ai?.isCorrect;
    const score = isCorrect ? 10 : 0;
    totalScore += score;

    const updatePayload: any = {
      answer_image_url: a.imageUrl,
      match_pass: isCorrect,
      score,
      answered_at: new Date().toISOString(),
      ai_model: ai?.ai_model || "gemini-2.0-flash-exp",
      ai_result: ai,
      detected_labels: Array.isArray(ai?.detectedComponents) ? ai.detectedComponents : [],
      feedback: q.question_type === "ADVANCED" ? ai?.advice : (isCorrect ? null : q.explanation)
    };

    await supabase.from("attempt_items").update(updatePayload).eq("attempt_id", attemptId).eq("seq", i + 1);

    analyzed.push({ ...a, isCorrect, score, aiResult: ai, detectedLabels: updatePayload.detected_labels });
  }

  // 更新最終分數與狀態
  await supabase.from("attempts").update({
    status: "SUBMITTED",
    total_score: totalScore,
    submitted_at: new Date().toISOString()
  }).eq("id", attemptId);

  return { analyzedAnswers: analyzed };
}

export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from("questions").select("*").eq("is_active", true);
  if (error) throw error;
  return data as any;
}

export async function getAttemptHistory(limit = 50): Promise<AttemptWithDetails[]> {
  const { data, error } = await supabase
    .from("attempts")
    .select(`
      *,
      students!attempts_student_id_fkey ( student_no, name ),
      attempt_items (
        *,
        questions ( * )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((a: any) => ({
    id: a.id,
    student_no: a.students?.student_no,
    student_name: a.students?.name,
    total_score: a.total_score,
    started_at: a.started_at,
    submitted_at: a.submitted_at,
    items: a.attempt_items.map((it: any) => ({ ...it, question: it.questions })).sort((x: any, y: any) => x.seq - y.seq)
  })) as any;
}
