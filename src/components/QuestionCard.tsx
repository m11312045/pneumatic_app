// src/components/QuestionCard.tsx
import { useEffect, useState } from "react";
import { Question, Answer } from "../types";
import { Camera, Upload, CheckCircle } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  attemptId: string | null; // 目前不使用，但保留 props 兼容
  seq: number;
  onAnswer: (answer: Answer) => void;
}

export function QuestionCard({ question, questionNumber, seq, onAnswer }: QuestionCardProps) {
  const [imageData, setImageData] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ✅ 切題就清暫存
    setImageData("");
    setIsReady(false);
  }, [question.id]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;

    // 讀成 dataURL 供預覽
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      setImageData(url);
      setIsReady(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!imageData) {
      alert("請先上傳作答照片");
      return;
    }

    onAnswer({
      questionId: question.id,
      seq,
      imageData,
    });
  };

  const promptLabel =
    question.question_type === "COPY"
      ? "請照著範例圖抄繪"
      : question.question_type === "TEXT"
      ? "請依文字描述繪製符號"
      : "請完成進階迴路設計";

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-900">
          第 {questionNumber} 題
          <span className="ml-3 text-sm text-gray-500">{promptLabel}</span>
        </div>
      </div>

      {/* ✅ 題目文字（不顯示 title） */}
      {question.prompt_text && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <div className="text-gray-700 whitespace-pre-line">{question.prompt_text}</div>
        </div>
      )}

      {/* 題目範例圖（COPY 顯示 prompt_image_url；TEXT 可不顯示或顯示 answer_image_url 作為參考，看你需求） */}
      {question.question_type === "COPY" && question.prompt_image_url && (
        <div className="mb-6">
          <div className="text-gray-600 mb-2">範例圖：</div>
          <img
            src={question.prompt_image_url}
            alt="prompt"
            className="rounded border-2 border-gray-300 w-full"
          />
        </div>
      )}

      {/* ✅ 上傳作答照片 */}
      <div className="mb-6">
        <div className="text-gray-600 mb-2">上傳作答照片：</div>

        <label className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 w-fit">
          <Upload className="w-5 h-5" />
          選擇照片
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          建議：照片要清楚、避免反光、不要裁掉符號
        </p>

        {imageData && (
          <div className="mt-4">
            <div className="text-gray-600 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              已選擇照片（預覽）
            </div>
            <img src={imageData} alt="answer" className="rounded border-2 border-gray-300 w-full" />
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isReady}
        className={`w-full py-3 rounded-lg text-white transition-colors ${
          isReady ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        下一題
      </button>
    </div>
  );
}
