// src/components/QuestionCard.tsx
import { useEffect, useRef, useState } from "react";
import { Question, Answer, GeminiAnalysisResult } from "../types";
import { Upload, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { analyzeWithGeminiEdge } from "../utils/gemini";
import { uploadAnswerImage, updateAttemptItem } from "../lib/api";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  attemptId: string | null;
  seq: number;
  onAnswer: (answer: Answer) => void;
}

function dataUrlToBase64AndMime(dataUrl: string): { base64: string; mime: string } {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*);base64/);
  return {
    base64,
    mime: mimeMatch?.[1] || "image/jpeg",
  };
}

/** dataURL -> Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*);base64/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
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

export function QuestionCard({
  question,
  questionNumber,
  attemptId,
  seq,
  onAnswer,
}: QuestionCardProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 進階題：即時分析結果（提交後顯示）
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [seq, question.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!capturedImage || !attemptId) return;

    setIsProcessing(true);
    try {
      // 1) 上傳圖片（存 storage url）
      const blob = dataUrlToBlob(capturedImage);
      const file = new File([blob], `attempt-${attemptId}-q${seq}.jpg`, {
        type: blob.type || "image/jpeg",
      });
      const imageUrl = await uploadAnswerImage(attemptId, seq, file);

      // 2) 呼叫 Edge Function（Gemini key 不在前端）
      const { base64, mime } = dataUrlToBase64AndMime(capturedImage);

      const promptText = question.prompt_text || "";
      const bestAnswerText = question.question_type === "ADVANCED" ? (question.explanation || "") : undefined;

      const geminiResult = await analyzeWithGeminiEdge({
        questionType: question.question_type,
        promptText,
        answerImageUrl: imageUrl,
        bestAnswerText,
      });

      // 防呆補齊欄位
      const normalized: GeminiAnalysisResult = {
        isCorrect: !!geminiResult.isCorrect,
        detectedComponents: Array.isArray(geminiResult.detectedComponents) ? geminiResult.detectedComponents : [],
        bonusCorrect: !!geminiResult.bonusCorrect,
        logicEquation: geminiResult.logicEquation || "",
        advice: geminiResult.advice || "",
        ai_model: geminiResult.ai_model,
      };

      setAnalysisResult(normalized);

      // 3) 計分（你原邏輯保留）
      let score = 0;
      if (question.question_type === "ADVANCED") {
        if (normalized.isCorrect) score += 5;
        if (normalized.bonusCorrect) score += 5;
      } else {
        score = normalized.isCorrect ? 5 : 0;
      }

      const answer: Answer = {
        questionId: question.id,
        imageData: capturedImage,
        detectedLabels: normalized.detectedComponents,
        aiResult: normalized,
        isCorrect: normalized.isCorrect,
        confidence: 1.0,
        score,
      };

      // 4) 更新 DB（ai_result/ai_provider）
      await updateAttemptItem(attemptId, seq, {
        answer_image_url: imageUrl,
        detected_labels: normalized.detectedComponents || [],
        match_pass: normalized.isCorrect,
        score,
        feedback:
          question.question_type === "ADVANCED"
            ? (normalized.advice || "—")
            : (question.explanation || normalized.advice || null),

        ai_result: normalized,
        ai_provider: "GEMINI",
        ai_model: normalized.ai_model || null,
      });

      // 5) 交給 Quiz 流程換題
      onAnswer(answer);
    } catch (error) {
      console.error("AI 分析錯誤:", error);
      alert("AI 分析過程發生錯誤，請重試");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isAdvanced = question.question_type === "ADVANCED";

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            {question.question_type === "COPY"
              ? "照圖抄繪"
              : question.question_type === "TEXT"
              ? "依文字描述畫符號"
              : "進階迴路設計"}
          </span>
        </div>

        <h2 className="text-gray-900 mb-4">第 {questionNumber} 題</h2>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <h3 className="font-bold text-gray-700 mb-2">題目需求：</h3>
          <p className="text-gray-800 text-lg whitespace-pre-line">{question.prompt_text}</p>
        </div>

        {/* 基本題 COPY：顯示範例圖 */}
        {question.question_type === "COPY" && question.prompt_image_url && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-gray-600 mb-2">範例符號：</p>
            <div className="flex items-center justify-center bg-white rounded border-2 border-dashed border-gray-300 p-2">
              <img
                src={question.prompt_image_url}
                alt="範例符號"
                className="max-h-48 w-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* 進階題：分析結果顯示 */}
      {analysisResult && isAdvanced && (
        <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-100 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5" /> AI 分析結果
          </h3>

          <div className="grid gap-4">
            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
              <span className="text-gray-700">1. 題幹正確性</span>
              {analysisResult.isCorrect ? (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 正確
                </span>
              ) : (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> 錯誤
                </span>
              )}
            </div>

            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
              <span className="text-gray-700">2. 加分題判定</span>
              {analysisResult.bonusCorrect ? (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 達成 (+5分)
                </span>
              ) : (
                <span className="text-gray-500 font-bold">未達成</span>
              )}
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="text-gray-700 block mb-1">3. 邏輯方程式（格式化）：</span>
              <pre className="block bg-gray-100 p-2 rounded text-sm font-mono text-blue-900 overflow-auto">
{formatLogicEquation(analysisResult.logicEquation).join("\n") || "未偵測到邏輯式"}
              </pre>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-yellow-400">
              <span className="text-gray-700 block mb-1">4. AI 老師建議（20字內）：</span>
              <p className="text-gray-900 font-medium">
                {analysisResult.advice || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 上傳 / 送出 */}
      {!capturedImage ? (
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-600 text-white py-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            上傳圖片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border-2 border-gray-200">
            <img src={capturedImage} alt="作答圖片" className="w-full" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  送出分析
                </>
              )}
            </button>

            <button
              onClick={handleRetake}
              disabled={isProcessing}
              className="px-6 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300"
            >
              重選
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
