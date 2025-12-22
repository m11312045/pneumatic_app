// src/components/Results.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Question, Answer, COMPONENT_NAMES } from "../types";
import { CheckCircle, XCircle, RotateCcw, TrendingUp, Loader2 } from "lucide-react";
import { submitAttempt } from "../lib/api";

interface ResultsProps {
  attemptId: string;
  questions: Question[];
  answers: Answer[];
  onRestart: () => void;
}

function formatLogicEquation(raw?: string): string[] {
  if (!raw) return [];
  const s = raw.replaceAll("。", ";").replaceAll("\n", ";");
  return s
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .replace(/\s*=\s*/g, " = ")
        .replace(/\s*\*\s*/g, " * ")
        .replace(/\s*\+\s*/g, " + ")
    );
}

export function Results({ attemptId, questions, answers, onRestart }: ResultsProps) {
  const [isSubmitting, setIsSubmitting] = useState(true);

  const submittedRef = useRef(false);

  const answerMap = useMemo(() => new Map(answers.map((a) => [a.questionId, a])), [answers]);

  const totalScore = useMemo(
    () => answers.reduce((sum, a) => sum + (a.score ?? 0), 0),
    [answers]
  );

  const correctCount = useMemo(() => answers.filter((a) => a.isCorrect).length, [answers]);

  const percentage = Math.round(totalScore);
  const progress = Math.max(0, Math.min(100, percentage));

  useEffect(() => {
    if (!attemptId) return;
    if (questions.length > 0 && answers.length < questions.length) return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    (async () => {
      try {
        await submitAttempt(attemptId, totalScore);
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [attemptId, answers.length, questions.length, totalScore]);

  if (isSubmitting) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">提交測驗中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <TrendingUp className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-indigo-600 mb-2">測驗完成！</h2>
          <div className="text-gray-900 mb-2">您的得分：{percentage} 分</div>
          <p className="text-gray-600">
            答對 {correctCount} 題，共 {questions.length} 題
          </p>
        </div>

        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          再測驗一次
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-gray-900 mb-6">答題詳情與解析</h3>

        <div className="space-y-6">
          {questions.map((question, index) => {
            const answer = answerMap.get(question.id);
            const isCorrect = answer?.isCorrect ?? false;
            const isAdvanced = question.question_type === "ADVANCED";

            // 基本題範例圖：COPY 用 prompt_image_url；TEXT 用 answer_image_url
            const exampleUrl =
              question.question_type === "COPY"
                ? question.prompt_image_url
                : question.question_type === "TEXT"
                ? question.answer_image_url
                : null;

            const ai = answer?.aiResult as any;

            return (
              <div
                key={question.id}
                className={`p-6 rounded-lg border-2 ${
                  isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-gray-900">第 {index + 1} 題</span>
                        <span className="ml-2 px-2 py-1 bg-white rounded text-gray-700">
                          {question.question_type === "COPY"
                            ? "照圖抄繪"
                            : question.question_type === "TEXT"
                            ? "文字描述 + 畫符號"
                            : "進階迴路設計"}
                        </span>
                      </div>
                    </div>

                    {question.title && <h4 className="text-gray-800 mb-2">{question.title}</h4>}
                    {question.prompt_text && (
                      <p className="text-gray-700 mb-3 whitespace-pre-line">{question.prompt_text}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {exampleUrl && (
                        <div>
                          <p className="text-gray-600 mb-2">
                            {question.question_type === "COPY" ? "範例圖：" : "正解範例圖："}
                          </p>
                          <img
                            src={exampleUrl}
                            alt="範例/正解"
                            className="rounded border-2 border-gray-300 w-full"
                          />
                        </div>
                      )}

                      {answer?.imageData && (
                        <div>
                          <p className="text-gray-600 mb-2">您的作答：</p>
                          <img
                            src={answer.imageData}
                            alt="作答"
                            className="rounded border-2 border-gray-300 w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* ✅ 分流顯示 */}
                    {isAdvanced ? (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                        <div className="text-gray-800">
                          <strong>題幹：</strong>{ai?.isCorrect ? "正確" : "不正確"}　
                          <strong className="ml-4">加分：</strong>{ai?.bonusCorrect ? "達成" : "未達成"}
                        </div>

                        <div>
                          <div className="text-gray-800 font-semibold mb-1">邏輯式（格式化）</div>
                          <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto">
{formatLogicEquation(ai?.logicEquation).join("\n") || "—"}
                          </pre>
                        </div>

                        <div className="text-gray-800">
                          <strong>改進（20字內）：</strong>{ai?.advice || "—"}
                        </div>

                        {/* 進階題如果你有放最佳答案在 explanation，也可顯示 */}
                        {question.explanation ? (
                          <details className="bg-gray-50 p-3 rounded border">
                            <summary className="cursor-pointer text-gray-700 font-medium">
                              顯示參考最佳答案（老師）
                            </summary>
                            <div className="mt-2 whitespace-pre-line text-gray-800">{question.explanation}</div>
                          </details>
                        ) : null}
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-700 mb-2">
                          <strong>正確答案：</strong>
                          {(question.expected_labels ?? [])
                            .map(
                              (label) =>
                                COMPONENT_NAMES[label as keyof typeof COMPONENT_NAMES] || label
                            )
                            .join("、")}
                        </p>

                        {answer?.detectedLabels && answer.detectedLabels.length > 0 && (
                          <p className="text-gray-700 mb-2">
                            <strong>您的答案：</strong>
                            {answer.detectedLabels
                              .map(
                                (label) =>
                                  COMPONENT_NAMES[label as keyof typeof COMPONENT_NAMES] || label
                              )
                              .join("、")}
                          </p>
                        )}

                        {!isCorrect && question.explanation && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-red-700">
                              <strong>解析：</strong>
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
