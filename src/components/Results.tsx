import { useState, useEffect } from 'react';
import { Question, Answer, COMPONENT_NAMES } from '../types';
import { CheckCircle, XCircle, RotateCcw, TrendingUp, Loader2 } from 'lucide-react';
import { submitAttempt } from '../lib/api';

interface ResultsProps {
  attemptId: string;
  questions: Question[];
  answers: Answer[];
  onRestart: () => void;
}

export function Results({ attemptId, questions, answers, onRestart }: ResultsProps) {
  const [isSubmitting, setIsSubmitting] = useState(true);

  useEffect(() => {
    handleSubmit();
  }, []);

  const handleSubmit = async () => {
    // 計算總分
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    
    // 提交測驗
    await submitAttempt(attemptId, totalScore);
    setIsSubmitting(false);
  };

  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
  const percentage = Math.round(totalScore);

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
          <div className="text-gray-900 mb-2">
            您的得分：{percentage} 分
          </div>
          <p className="text-gray-600">
            答對 {correctCount} 題，共 {questions.length} 題
          </p>
        </div>

        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                percentage >= 80 ? 'bg-green-500' :
                percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
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
            const answer = answers[index];
            const isCorrect = answer?.isCorrect;

            return (
              <div
                key={question.id}
                className={`p-6 rounded-lg border-2 ${
                  isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
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
                        <span className="text-gray-900">
                          第 {index + 1} 題
                        </span>
                        <span className="ml-2 px-2 py-1 bg-white rounded text-gray-700">
                          {question.question_type === 'COPY' ? '照圖抄繪' : '文字描述'}
                        </span>
                      </div>
                      {answer?.confidence && (
                        <span className="text-gray-600">
                          信心度：{Math.round(answer.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    
                    {question.title && (
                      <h4 className="text-gray-800 mb-2">{question.title}</h4>
                    )}
                    {question.prompt_text && (
                      <p className="text-gray-700 mb-3">{question.prompt_text}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {question.question_type === 'COPY' && question.prompt_image_url && (
                        <div>
                          <p className="text-gray-600 mb-2">範例圖：</p>
                          <img
                            src={question.prompt_image_url}
                            alt="範例"
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

                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-700 mb-2">
                        <strong>正確答案：</strong>
                        {question.expected_labels.map(label => 
                          COMPONENT_NAMES[label as keyof typeof COMPONENT_NAMES] || label
                        ).join('、')}
                      </p>
                      {answer?.detectedLabels && answer.detectedLabels.length > 0 && (
                        <p className="text-gray-700 mb-2">
                          <strong>您的答案：</strong>
                          {answer.detectedLabels.map(label => 
                            COMPONENT_NAMES[label as keyof typeof COMPONENT_NAMES] || label
                          ).join('、')}
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
