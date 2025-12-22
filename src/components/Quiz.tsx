import { useState, useEffect } from 'react';
import { User, Question, Answer, AttemptWithDetails } from '../types';
import { getQuestions, getRandomQuestions, createAttempt } from '../lib/api';
import { QuestionCard } from './QuestionCard';
import { Results } from './Results';
import { Loader2 } from 'lucide-react';

interface QuizProps {
  user: User;
}

export function Quiz({ user }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startNewQuiz();
  }, []);

  const startNewQuiz = async () => {
    setIsLoading(true);

    const allQuestions = await getQuestions();

    if (allQuestions.length === 0) {
      alert("題庫為空，請先新增題目");
      setIsLoading(false);
      return;
    }

    // ✅ 20題：COPY 8 + TEXT 12
    const selectedQuestions = getRandomQuestions(allQuestions, 20);

    // ✅ 若題庫不足 20，直接提示你缺什麼（不會默默變10）
    if (selectedQuestions.length < 20) {
      const basicCount = allQuestions.filter(q => q.question_type === "COPY" || q.question_type === "TEXT").length;
      const advCount = allQuestions.filter(q => q.question_type === "ADVANCED").length;

      alert(
        `題庫數量不足以組成20題（基本10 + 進階10）\n` +
        `目前題庫：基本=${basicCount}, 進階=${advCount}, total=${allQuestions.length}\n` +
        `這次只抽到：${selectedQuestions.length} 題`
      );
    }

    setQuestions(selectedQuestions);
    setCurrentIndex(0);
    setAnswers([]);
    setIsCompleted(false);

    // 建立新的測驗會話
    const newAttemptId = await createAttempt(user.id, selectedQuestions);
    setAttemptId(newAttemptId);
    
    setIsLoading(false);
  };

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">載入題目中...</div>
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
      <Results
        attemptId={attemptId}
        questions={questions}
        answers={answers}
        onRestart={startNewQuiz}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">
            題目 {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-gray-700">
            {currentQuestion.question_type === 'COPY' ? '照圖抄繪' : '依文字描述畫符號'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        attemptId={attemptId}
        seq={currentIndex + 1}
        onAnswer={handleAnswer}
      />
    </div>
  );
}