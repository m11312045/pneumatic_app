// src/components/History.tsx
import { useEffect, useState } from "react";
import { User, AttemptWithDetails, COMPONENT_NAMES } from "../types";
import { getAttemptHistory } from "../lib/api";
import { Calendar, TrendingUp, Award, Eye, Loader2, CheckCircle, XCircle } from "lucide-react";

interface HistoryProps {
  user: User;
}

export function History({ user }: HistoryProps) {
  const [history, setHistory] = useState<AttemptWithDetails[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setIsLoading(true);
    const allHistory = await getAttemptHistory(100);

    // ✅ 顯示：自己的優先 + 新到舊
    const sorted = allHistory.sort((a, b) => {
      if (a.student_id === user.id && b.student_id !== user.id) return -1;
      if (a.student_id !== user.id && b.student_id === user.id) return 1;
      return new Date(b.submitted_at || b.started_at).getTime() - new Date(a.submitted_at || a.started_at).getTime();
    });

    setHistory(sorted);
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (selectedAttempt) {
    return (
      <div>
        <button
          onClick={() => setSelectedAttempt(null)}
          className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← 返回歷史記錄
        </button>
        <AttemptDetails attempt={selectedAttempt} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">載入歷史記錄中...</div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <Calendar className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-gray-900 mb-2">尚無測驗記錄</h3>
        <p className="text-gray-600">完成第一次測驗後，記錄將顯示在這裡</p>
      </div>
    );
  }

  const myHistory = history.filter((a) => a.student_id === user.id);
  const othersHistory = history.filter((a) => a.student_id !== user.id);

  return (
    <div className="space-y-6">
      {myHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-indigo-600" />
            <h2 className="text-gray-900">我的測驗記錄</h2>
          </div>

          <div className="grid gap-4">
            {myHistory.map((attempt) => (
              <AttemptCard
                key={attempt.id}
                attempt={attempt}
                formatDate={formatDate}
                getScoreColor={getScoreColor}
                onViewDetails={() => setSelectedAttempt(attempt)}
                isOwner={true}
              />
            ))}
          </div>
        </div>
      )}

      {othersHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-gray-600" />
            <h2 className="text-gray-900">其他學生的測驗記錄</h2>
          </div>

          <div className="grid gap-4">
            {othersHistory.map((attempt) => (
              <AttemptCard
                key={attempt.id}
                attempt={attempt}
                formatDate={formatDate}
                getScoreColor={getScoreColor}
                onViewDetails={() => setSelectedAttempt(attempt)}
                isOwner={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AttemptCard({
  attempt,
  formatDate,
  getScoreColor,
  onViewDetails,
  isOwner,
}: {
  attempt: AttemptWithDetails;
  formatDate: (date: string) => string;
  getScoreColor: (score: number) => string;
  onViewDetails: () => void;
  isOwner: boolean;
}) {
  const correctCount = attempt.items.filter((item) => item.match_pass).length;
  const totalQuestions = (attempt.copy_count ?? 0) + (attempt.text_count ?? 0) + (attempt.advanced_count ?? 0);

  return (
    <div
      className={`p-6 border-2 rounded-lg hover:bg-opacity-50 transition-colors ${
        isOwner ? "border-indigo-200 hover:bg-indigo-50" : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{formatDate(attempt.submitted_at || attempt.started_at)}</span>
          </div>
          <div className="text-gray-700">
            {attempt.student_name} ({attempt.student_no})
          </div>
        </div>

        <div className="text-right">
          <div className={`inline-block px-4 py-2 rounded-lg ${getScoreColor(attempt.total_score)}`}>
            <TrendingUp className="w-5 h-5 inline mr-1" />
            <span>{Math.round(attempt.total_score)} 分</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-600">
          答對 {correctCount} / {totalQuestions} 題
        </span>
        <button
          onClick={onViewDetails}
          className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
            isOwner ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          <Eye className="w-4 h-4" />
          查看詳情
        </button>
      </div>
    </div>
  );
}

function AttemptDetails({ attempt }: { attempt: AttemptWithDetails }) {
  const correctCount = attempt.items.filter((item) => item.match_pass).length;
  const totalQuestions = (attempt.copy_count ?? 0) + (attempt.text_count ?? 0) + (attempt.advanced_count ?? 0);
  const percentage = Math.round(attempt.total_score);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <TrendingUp className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-indigo-600 mb-2">測驗記錄</h2>
          <div className="text-gray-900 mb-2">
            {attempt.student_name} ({attempt.student_no})
          </div>
          <div className="text-gray-900 mb-2">得分：{percentage} 分</div>
          <p className="text-gray-600">
            答對 {correctCount} 題，共 {totalQuestions} 題
          </p>
        </div>

        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-gray-900 mb-6">答題詳情</h3>

        <div className="space-y-6">
          {attempt.items.map((item) => {
            const q = item.question;
            const isCorrect = !!item.match_pass;
            const isAdvanced = q?.question_type === "ADVANCED";

            const referenceImageUrl =
              q?.question_type === "COPY"
                ? q?.prompt_image_url
                : q?.answer_image_url;
            
            const referenceLabel = 
              q?.question_type === "COPY" 
                ? "範例圖：" 
                : "參考解答圖：";

            const ai = item.ai_result as any;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-lg border-2 ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
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
                        <span className="text-gray-900">第 {item.seq} 題</span>
                        <span className="ml-2 px-2 py-1 bg-white rounded text-gray-700">
                          {q?.question_type === "COPY"
                            ? "照圖抄繪"
                            : q?.question_type === "TEXT"
                            ? "文字描述"
                            : "進階迴路"}
                        </span>
                      </div>
                    </div>

                    {q?.title && <h4 className="text-gray-800 mb-2">{q.title}</h4>}
                    {q?.prompt_text && <p className="text-gray-700 mb-3 whitespace-pre-line">{q.prompt_text}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {referenceImageUrl && (
                        <div>
                          <p className="text-gray-600 mb-2">{referenceLabel}</p>
                          <img src={referenceImageUrl} alt="example" className="rounded border-2 border-gray-300 w-full" />
                        </div>
                      )}

                      {item.answer_image_url && (
                        <div>
                          <p className="text-gray-600 mb-2">學生作答：</p>
                          <img src={item.answer_image_url} alt="answer" className="rounded border-2 border-gray-300 w-full" />
                        </div>
                      )}
                    </div>

                    {isAdvanced ? (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2">
                        <div className="text-gray-800">
                          <strong>題幹：</strong>{ai?.isCorrect ? "正確" : "不正確"}　
                          <strong className="ml-4">加分：</strong>{ai?.bonusCorrect ? "達成" : "未達成"}
                        </div>
                        <div className="text-gray-800">
                          <strong>改進：</strong>{item.feedback || ai?.advice || "—"}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-700 mb-2">
                          <strong>正確答案：</strong>
                          {(q?.expected_labels ?? []).map((label) => COMPONENT_NAMES[label] || label).join("、")}
                        </p>

                        {item.detected_labels && item.detected_labels.length > 0 && (
                          <p className="text-gray-700 mb-2">
                            <strong>識別結果：</strong>
                            {item.detected_labels.map((label) => COMPONENT_NAMES[label] || label).join("、")}
                          </p>
                        )}

                        {!isCorrect && item.feedback && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-red-700">
                              <strong>解析：</strong>
                              {item.feedback}
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
