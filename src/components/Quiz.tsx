// src/components/Quiz.tsx
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { User, Question, Answer } from "../types";
import { getQuestions, selectQuestionsByStrategy, analyzeAllAnswers, createInitialAttempt } from "../lib/api";
import { QuestionCard } from "./QuestionCard";
import { Results } from "./Results";

export function Quiz({ user }: { user: User }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => { startNewQuiz(); }, []);

  const startNewQuiz = async () => {
    setIsLoading(true);
    setLoadingText("正在為您準備題目...");
    try {
      const all = await getQuestions();
      const { selected } = selectQuestionsByStrategy(all);
      // 關鍵：先在 DB 佔位取得 ID
      const newId = await createInitialAttempt(user.id, selected);
      
      setQuestions(selected);
      setAttemptId(newId);
      setCurrentIndex(0);
      setAnswers([]);
      setIsCompleted(false);
    } catch (e) {
      alert("初始化失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answer: Answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 最後一題，開始 AI 分析
      setIsLoading(true);
      setLoadingText("AI 正在評分中，請稍候...");
      try {
        const { analyzedAnswers } = await analyzeAllAnswers({
          attemptId: attemptId!,
          studentId: user.id,
          questions,
          answers: newAnswers,
        });
        setAnswers(analyzedAnswers);
        setIsCompleted(true);
      } catch (e) {
        alert("分析失敗");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center py-20">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-gray-600">{loadingText}</p>
    </div>
  );

  if (isCompleted && attemptId) {
    return <Results attemptId={attemptId} questions={questions} answers={answers} onRestart={startNewQuiz} />;
  }

  const currentQuestion = questions[currentIndex];
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-4 flex justify-between items-center text-sm text-gray-500">
        <span>進度：{currentIndex + 1} / {questions.length}</span>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all" style={{ width: `${((currentIndex+1)/questions.length)*100}%` }} />
        </div>
      </div>
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
