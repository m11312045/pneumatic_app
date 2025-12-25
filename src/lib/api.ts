// src/lib/api.ts
import { supabase } from "./supabase";
import type { Answer, Question, AttemptWithDetails, User } from "../types";
import { analyzeWithGeminiEdge } from "../utils/gemini";

// ---------- utils ----------
function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string; mime: string } {
  const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!m) throw new Error("Invalid image dataURL");
  const mime = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });

  const ext =
    mime.includes("png") ? "png" :
    mime.includes("webp") ? "webp" :
    "jpg";

  return { blob, ext, mime };
}

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

function isBasic(q: Question) {
  return q.question_type === "COPY" || q.question_type === "TEXT";
}
function isAdvanced(q: Question) {
  return q.question_type === "ADVANCED";
}

/** 新策略：基本3、進階7、difficulty=3 最多3 */
export function selectQuestionsByStrategy(all: Question[]) {
  const active = all.filter((q) => q.is_active !== false);
  const basicPool = active.filter(isBasic);
  const advPool = active.filter(isAdvanced);

  const basicNeed = 3;
  const advNeed = 7;
  const advHardCap = 3;

  const basicPick = take(shuffle(basicPool), basicNeed);

  const advHard = advPool.filter((q) => (q.difficulty ?? 1) === 3);
  const advNonHard = advPool.filter((q) => (q.difficulty ?? 1) !== 3);

  const advHardPick = take(shuffle(advHard), advHardCap);
  const advRestPick = take(shuffle(advNonHard), Math.max(0, advNeed - advHardPick.length));
  const advPick = [...advHardPick, ...advRestPick];

  return {
    selected: [...basicPick, ...advPick],
    shortage: {
      basicHave: basicPool.length,
      advHave: advPool.length,
      advHardHave: advHard.length,
      basicNeed,
      advNeed,
      advHardCap,
      basicPicked: basicPick.length,
      advPicked: advPick.length,
    },
  };
}

// ---------- auth/student ----------
export async function loginOrRegisterStudent(studentNo: string, name: string): Promise<User> {
  const sn = safeTrim(studentNo);
  const nm = safeTrim(name);

  if (!sn || !nm) throw new Error("請輸入學號與姓名");

  // 先找
  const { data: found, error: e1 } = await supabase
    .from("students")
    .select("*")
    .eq("student_no", sn)
    .eq("name", nm)
    .maybeSingle();

  if (e1) throw e1;
  if (found) {
    return { id: found.id, student_no: found.student_no, name: found.name };
  }

  // 沒找到就建
  const { data: created, error: e2 } = await supabase
    .from("students")
    .insert({ student_no: sn, name: nm })
    .select("*")
    .single();

  if (e2) throw e2;

  return { id: created.id, student_no: created.student_no, name: created.name };
}

// ---------- questions ----------
export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as any;
}

// ---------- attempts (created ONLY when finished) ----------
export async function createAttemptAfterFinished(studentId: string, questions: Question[]) {
  const copyCount = questions.filter((q) => q.question_type === "COPY").length;
  const textCount = questions.filter((q) => q.question_type === "TEXT").length;
  const advancedCount = questions.filter((q) => q.question_type === "ADVANCED").length;

  const { data: attempt, error: e1 } = await supabase
    .from("attempts")
    .insert({
      student_id: studentId,
      status: "IN_PROGRESS",
      copy_count: copyCount,
      text_count: textCount,
      advanced_count: advancedCount,
      exam_type: "PRACTICE_PNEUMATIC",
    })
    .select("*")
    .single();

  if (e1) throw e1;

  const items = questions.map((q, idx) => ({
    attempt_id: attempt.id,
    question_id: q.id,
    seq: idx + 1,
    ai_provider: "GEMINI",
    ai_model: null,
  }));

  const { error: e2 } = await supabase.from("attempt_items").insert(items);
  if (e2) throw e2;

  return attempt.id as string;
}

export async function submitAttempt(attemptId: string, totalScore: number) {
  const { error } = await supabase
    .from("attempts")
    .update({
      status: "SUBMITTED",
      total_score: totalScore,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (error) throw error;
}

// ---------- storage upload ----------
async function uploadAnswerImage(attemptId: string, seq: number, imageData: string): Promise<string> {
  const { blob, ext, mime } = dataUrlToBlob(imageData);
  const path = `attempts/${attemptId}/${seq}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("pneumatic-answers")
    .upload(path, blob, { contentType: mime, upsert: true });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from("pneumatic-answers").getPublicUrl(path);
  return data.publicUrl;
}

// ---------- core: analyze after all answered ----------
export async function analyzeAllAnswers(args: {
  studentId: string;
  questions: Question[];
  answers: Answer[]; // must include imageData
  expectedLabels: q.expected_labels,
}): Promise<{ attemptId: string; analyzedAnswers: Answer[]; totalScore: number }> {
  const { studentId, questions, answers } = args;

  if (questions.length !== 10) {
    // 你現在固定 10 題（3+7）
    // 若未來改題數，這行可拿掉
    console.warn("Expected 10 questions, got:", questions.length);
  }

  // 1) 建 attempt（此時才會有紀錄）
  const attemptId = await createAttemptAfterFinished(studentId, questions);

  // 2) 逐題上傳圖片 + AI 分析 + 回寫 attempt_items
  const analyzed: Answer[] = [];
  let total = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers.find((x) => x.questionId === q.id);

    if (!a?.imageData) {
      // 理論上不會發生：你 UI 會強制要有圖才能送出
      throw new Error(`第 ${i + 1} 題沒有作答圖片`);
    }

    // upload image
    const publicUrl = await uploadAnswerImage(attemptId, i + 1, a.imageData);

    // call edge
    const ai = await analyzeWithGeminiEdge({
      questionType: q.question_type,
      promptText: q.prompt_text ?? "",
      answerImageUrl: publicUrl,
      bestAnswerText: q.question_type === "ADVANCED" ? (q.explanation ?? "") : undefined,
    });

    // normalize scoring
    const isCorrect = !!ai?.isCorrect;
    const detectedLabels =
      Array.isArray(ai?.detectedComponents) ? ai.detectedComponents.map(String) :
      Array.isArray(ai?.detectedLabels) ? ai.detectedLabels.map(String) :
      [];

    const score = isCorrect ? 10 : 0;
    total += score;

    // write attempt_items
    const updatePayload: any = {
      answer_image_url: publicUrl,
      match_pass: isCorrect,
      score,
      answered_at: new Date().toISOString(),
      ai_provider: (ai?.ai_provider ?? "gemini").toString().toUpperCase(),
      ai_model: ai?.ai_model ?? null,
      ai_result: ai ?? null,
    };

    // basic: detected_labels
    if (q.question_type !== "ADVANCED") {
      updatePayload.detected_labels = detectedLabels;
      updatePayload.feedback = isCorrect ? null : (q.explanation ?? null);
    } else {
      // advanced: put advice into feedback (optional)
      updatePayload.detected_labels = [];
      updatePayload.feedback = ai?.advice ? String(ai.advice) : null;
    }

    const { error: upErr } = await supabase
      .from("attempt_items")
      .update(updatePayload)
      .eq("attempt_id", attemptId)
      .eq("seq", i + 1);

    if (upErr) throw upErr;

    analyzed.push({
      questionId: q.id,
      seq: i + 1,
      imageData: a.imageData,
      imageUrl: publicUrl,
      detectedLabels: updatePayload.detected_labels ?? [],
      isCorrect,
      score,
      aiResult: ai,
    });
  }

  // 3) submit attempt
  await submitAttempt(attemptId, total);

  return { attemptId, analyzedAnswers: analyzed, totalScore: total };
}

// ---------- history ----------
export async function getAttemptHistory(limit = 50): Promise<AttemptWithDetails[]> {
  // attempts + students + attempt_items + questions
  const { data, error } = await supabase
    .from("attempts")
    .select(
      `
      id, student_id, total_score, started_at, submitted_at, copy_count, text_count, advanced_count,
      students!attempts_student_id_fkey ( student_no, name ),
      attempt_items (
        id, attempt_id, question_id, seq, answer_image_url, detected_labels, match_pass, score, feedback, answered_at,
        ai_provider, ai_model, ai_result,
        questions ( id, question_type, title, prompt_text, prompt_image_url, answer_image_url, explanation, expected_labels, difficulty, is_active )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((a: any) => {
    const items = (a.attempt_items ?? [])
      .map((it: any) => ({
        ...it,
        question: it.questions ?? null,
      }))
      .sort((x: any, y: any) => (x.seq ?? 0) - (y.seq ?? 0));

    return {
      id: a.id,
      student_id: a.student_id,
      student_no: a.students?.student_no ?? "",
      student_name: a.students?.name ?? "",
      total_score: Number(a.total_score ?? 0),
      started_at: a.started_at,
      submitted_at: a.submitted_at,
      copy_count: a.copy_count ?? 0,
      text_count: a.text_count ?? 0,
      advanced_count: a.advanced_count ?? 0,
      items,
    } as AttemptWithDetails;
  });
}
