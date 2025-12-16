import { supabase } from './supabase';
import { User, Question, AttemptWithDetails, AttemptItem } from '../types';

// 學生登入或註冊
export async function loginOrRegisterStudent(
  studentNo: string,
  name: string
): Promise<User | null> {
  try {
    const { data: existing, error: selectError } = await supabase
      .from("students")
      .select("*")
      .eq("student_no", studentNo)
      .eq("name", name)
      .maybeSingle(); // ✅ 改這個：查不到不會丟錯

    if (selectError) throw selectError;

    if (existing) {
      return {
        id: existing.id,                // uuid
        studentId: existing.student_no, // 顯示用
        name: existing.name,
      };
    }

    const { data: newStudent, error: insertError } = await supabase
      .from("students")
      .insert({ student_no: studentNo, name })
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      id: newStudent.id,
      studentId: newStudent.student_no,
      name: newStudent.name,
    };
  } catch (error) {
    console.error("登入錯誤:", error);
    return null;
  }
}

// 獲取所有題目
export async function getQuestions(): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (error) throw error;

    return data.map((q) => ({
      id: q.id,
      question_type: q.question_type,
      title: q.title || undefined,
      prompt_text: q.prompt_text || undefined,
      prompt_image_url: q.prompt_image_url || undefined,
      explanation: q.explanation || undefined,
      expected_labels: q.expected_labels,
      expected_counts: q.expected_counts as Record<string, number> | undefined,
      difficulty: q.difficulty,
      is_active: q.is_active,
      answer_image_url: q.answer_image_url || undefined,
    }));
  } catch (error) {
    console.error('獲取題目錯誤:', error);
    return [];
  }
}

// 隨機選擇題目
export function getRandomQuestions(
  allQuestions: Question[],
  totalCount: number = 20,
  copyCount: number = 8
): Question[] {
  const copyQuestions = allQuestions.filter((q) => q.question_type === "COPY");
  const textQuestions = allQuestions.filter((q) => q.question_type === "TEXT");

  const actualCopyCount = Math.min(copyCount, copyQuestions.length);
  const textCount = Math.max(0, totalCount - actualCopyCount);

  const pickedCopy = [...copyQuestions].sort(() => Math.random() - 0.5).slice(0, actualCopyCount);
  const pickedText = [...textQuestions].sort(() => Math.random() - 0.5).slice(0, textCount);

  const picked = [...pickedCopy, ...pickedText].sort(() => Math.random() - 0.5); // ✅ 再洗一次

  if (picked.length < totalCount) {
    console.warn(
      `[QuestionPick] want=${totalCount}, got=${picked.length}, COPY=${copyQuestions.length}, TEXT=${textQuestions.length}`
    );
  }

  return picked;
}

// 建立新的測驗
export async function createAttempt(
  studentUuid: string,
  questions: Question[],
): Promise<string | null> {
  try {
    const copyCount = questions.filter(q => q.question_type === "COPY").length;
    const textCount = questions.filter(q => q.question_type === "TEXT").length;

    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .insert({
        student_id: studentUuid,
        status: "IN_PROGRESS",
        copy_count: copyCount,
        text_count: textCount,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    const items = questions.map((q, index) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      seq: index + 1,
      // ✅ 這些欄位若 DB 沒預設，保險給值
      detected_labels: [],
      score: 0,
    }));

    const { error: itemsError } = await supabase.from("attempt_items").insert(items);
    if (itemsError) throw itemsError;

    return attempt.id;
  } catch (error) {
    console.error("建立測驗錯誤:", error);
    return null;
  }
}


// 上傳圖片到 Supabase Storage
export async function uploadAnswerImage(
  attemptId: string,
  seq: number,
  file: File
): Promise<string> {
  const filePath = `${attemptId}/q${seq}.jpg`;

  const { error } = await supabase.storage
    .from("pneumatic-answers")
    .upload(filePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
      cacheControl: "0", // ✅ 避免重拍後拿到舊快取
    });

  if (error) {
    console.error("上傳圖片錯誤:", error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from("pneumatic-answers")
    .getPublicUrl(filePath);

  // ✅ 強制 bust cache（保險）
  return `${urlData.publicUrl}?t=${Date.now()}`;
}


// 更新答題項目
export async function updateAttemptItem(
  attemptId: string,
  seq: number,
  data: {
    answer_image_url: string;
    yolo_result: any;
    detected_labels: string[];
    match_pass: boolean;
    score: number;
    feedback?: string;
    yolo_model_id?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("attempt_items")
      .update({
        ...data,
        yolo_model_id: data.yolo_model_id ?? "5E3pSobX578NWpW0bSig",
        answered_at: new Date().toISOString(),
      })
      .eq("attempt_id", attemptId)
      .eq("seq", seq);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("更新答題項目錯誤:", error);
    return false;
  }
}

// 提交測驗
export async function submitAttempt(attemptId: string, totalScore: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('attempts')
      .update({
        status: 'SUBMITTED',
        total_score: totalScore,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('提交測驗錯誤:', error);
    return false;
  }
}

// 獲取測驗詳情
export async function getAttemptDetails(attemptId: string): Promise<AttemptWithDetails | null> {
  try {
    // 獲取 attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select(
        `
        *,
        students (
          id,
          student_no,
          name
        )
      `
      )
      .eq('id', attemptId)
      .single();

    if (attemptError) throw attemptError;

    // 獲取 items 和 questions
    const { data: items, error: itemsError } = await supabase
      .from('attempt_items')
      .select(
        `
        *,
        questions (*)
      `
      )
      .eq('attempt_id', attemptId)
      .order('seq');

    if (itemsError) throw itemsError;

    const student = attempt.students as any;

    return {
      id: attempt.id,
      student_id: attempt.student_id,
      student_name: student.name,
      student_no: student.student_no,
      status: attempt.status,
      copy_count: attempt.copy_count,
      text_count: attempt.text_count,
      total_score: attempt.total_score,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      questions: items.map((item: any) => ({
        id: item.questions.id,
        question_type: item.questions.question_type,
        title: item.questions.title || undefined,
        prompt_text: item.questions.prompt_text || undefined,
        prompt_image_url: item.questions.prompt_image_url || undefined,
        explanation: item.questions.explanation || undefined,
        expected_labels: item.questions.expected_labels,
        expected_counts: item.questions.expected_counts as Record<string, number> | undefined,
        difficulty: item.questions.difficulty,
        is_active: item.questions.is_active,
      })),
      items: items.map((item: any) => ({
        id: item.id,
        attempt_id: item.attempt_id,
        question_id: item.question_id,
        question: {
          id: item.questions.id,
          question_type: item.questions.question_type,
          title: item.questions.title || undefined,
          prompt_text: item.questions.prompt_text || undefined,
          prompt_image_url: item.questions.prompt_image_url || undefined,
          explanation: item.questions.explanation || undefined,
          expected_labels: item.questions.expected_labels,
          expected_counts: item.questions.expected_counts as Record<string, number> | undefined,
          difficulty: item.questions.difficulty,
          is_active: item.questions.is_active,
        },
        seq: item.seq,
        answer_image_url: item.answer_image_url,
        yolo_result: item.yolo_result,
        detected_labels: item.detected_labels,
        match_pass: item.match_pass,
        score: item.score,
        feedback: item.feedback,
        answered_at: item.answered_at,
      })),
    };
  } catch (error) {
    console.error('獲取測驗詳情錯誤:', error);
    return null;
  }
}

// 獲取歷史記錄
export async function getAttemptHistory(limit: number = 50): Promise<AttemptWithDetails[]> {
  try {
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select(
        `
        *,
        students (
          id,
          student_no,
          name
        )
      `
      )
      .eq('status', 'SUBMITTED')
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 獲取每個 attempt 的詳細資訊
    const detailsPromises = attempts.map((attempt) => getAttemptDetails(attempt.id));
    const details = await Promise.all(detailsPromises);

    return details.filter((d) => d !== null) as AttemptWithDetails[];
  } catch (error) {
    console.error('獲取歷史記錄錯誤:', error);
    return [];
  }
}
