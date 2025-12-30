// src/components/Quiz.tsx
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { User, Question, Answer } from "../types";
import { getQuestions, selectQuestionsByStrategy, analyzeAllAnswers } from "../lib/api";
import { QuestionCard } from "./QuestionCard";
import { Results } from "./Results";

interface QuizProps {
  user: User;
}

export function Quiz({ user }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // ✅ attemptId 改成「完成後才有」
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("載入題目中...");

  useEffect(() => {
    startNewQuiz();
  }, []);

  const startNewQuiz = async () => {
    setIsLoading(true);
    setLoadingText("載入題目中...");

    const all = await getQuestions();
    if (!all || all.length === 0) {
      alert("題庫為空，請先新增題目");
      setIsLoading(false);
      return;
    }

    const { selected, shortage } = selectQuestionsByStrategy(all);

    if (selected.length === 0) {
      alert("題庫沒有可用題目（is_active=true 且包含 COPY/TEXT/ADVANCED）");
      setIsLoading(false);
      return;
    }

    const basicMissing = Math.max(0, shortage.basicNeed - shortage.basicPicked);
    const advMissing = Math.max(0, shortage.advNeed - shortage.advPicked);
    if (basicMissing > 0 || advMissing > 0) {
      alert(
        `題庫不足以組成「基本3 + 進階2」\n\n` +
          `目前題庫：\n` +
          `- 基本(COPY/TEXT)：${shortage.basicHave}（缺 ${basicMissing}）\n` +
          `- 進階(ADVANCED)：${shortage.advHave}（缺 ${advMissing}）\n` +
          `本次實際抽到：${selected.length} 題`
      );
    }

    setQuestions(selected);
    setCurrentIndex(0);
    setAnswers([]);
    setIsCompleted(false);
    setAttemptId(null); // ✅ 重測也清掉
    setIsLoading(false);
  };

  const handleAnswer = async (answer: Answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    const isLast = currentIndex >= questions.length - 1;

    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    // ✅ 全部答完才：建立 attempt + 上傳 + 分析 + 寫 DB
    setIsLoading(true);
    setLoadingText("AI 分析中（5題）...");

    try {
      const { attemptId: newAttemptId, analyzedAnswers } = await analyzeAllAnswers({
        studentId: user.id,
        questions,
        answers: newAnswers,
      });

      setAttemptId(newAttemptId);
      setAnswers(analyzedAnswers);
      setIsCompleted(true);
    } catch (e: any) {
      console.error(e);
      alert(`AI 分析失敗：${String(e?.message ?? e)}`);
      // 失敗時不建立 Results，留在同頁面（你可自行調整 UX）
    } finally {
      setIsLoading(false);
      setLoadingText("載入題目中...");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">{loadingText}</div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <h3 className="text-gray-900 mb-2">題庫為空</h3>
        <p className="text-gray-600">請聯繫管理員新增題目</p>
      </div>
    );
  }

  if (isCompleted && attemptId) {
    return (
      <Results attemptId={attemptId} questions={questions} answers={answers} onRestart={startNewQuiz} />
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const typeLabel =
    currentQuestion.question_type === "COPY"
      ? "基本｜照圖抄繪"
      : currentQuestion.question_type === "TEXT"
      ? "基本｜依文字描述"
      : "進階｜迴路設計";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">
            題目 {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-gray-700">{typeLabel}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ✅ key 用 question.id，確保切題時整個元件重建、暫存清乾淨 */}
      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        attemptId={attemptId}
        seq={currentIndex + 1}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
