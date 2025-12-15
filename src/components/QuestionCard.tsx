import { useEffect, useRef, useState } from "react";
import { Question, Answer, COMPONENT_NAMES } from "../types";
import { Camera, Upload, Send, Loader2 } from "lucide-react";
import { detectComponent } from "../utils/yolo";
import { uploadAnswerImage, updateAttemptItem } from "../lib/api";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  attemptId: string | null;
  seq: number;
  onAnswer: (answer: Answer) => void;
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

export function QuestionCard({
  question,
  questionNumber,
  attemptId,
  seq,
  onAnswer,
}: QuestionCardProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 離開元件時確保關掉相機
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error("無法啟動相機:", error);
      alert("無法啟動相機，請確認已授予相機權限");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!capturedImage || !attemptId) return;

    setIsProcessing(true);
    try {
      // 1) base64 -> File（同一份檔案同時拿去上傳 + YOLO）
      const blob = dataUrlToBlob(capturedImage);
      const file = new File([blob], `attempt-${attemptId}-q${seq}.jpg`, {
        type: blob.type || "image/jpeg",
      });

      // 2) 先上傳到 Supabase Storage（pneumatic-answers bucket）
      //    ⚠️ 建議你把 uploadAnswerImage 改成吃 File，而不是 base64
      const imageUrl = await uploadAnswerImage(attemptId, seq, file);

      if (!imageUrl) throw new Error("圖片上傳失敗");

      // 3) 呼叫 YOLO（也用 file）
      const result = await detectComponent(file);

      const detected = result.detectedLabels ?? [];
      const expected = question.expected_labels ?? [];

      // 4) 判斷是否正確：期望類別「全部」都要出現才算對
      const isCorrect =
        expected.length > 0 && expected.every((label) => detected.includes(label));

      // 5) 分數：每題 5 分（20題總分100）
      const score = isCorrect ? 5 : 0;

      const answer: Answer = {
        questionId: question.id,
        imageData: capturedImage, // 前端仍可用 base64 顯示預覽
        detectedLabels: detected,
        yoloResult: result.rawResult,
        isCorrect,
        confidence: result.confidence,
        score,
      };

      // 6) 更新資料庫
      await updateAttemptItem(attemptId, seq, {
        answer_image_url: imageUrl,
        yolo_result: result.rawResult,
        detected_labels: detected,
        match_pass: isCorrect,
        score,
        feedback: question.explanation,
      });

      onAnswer(answer);
    } catch (error) {
      console.error("識別錯誤:", error);
      alert("識別過程發生錯誤，請重試");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-6">
        <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full mb-4">
          {question.question_type === "COPY" ? "照圖抄繪" : "依文字描述畫符號"}
        </div>

        <h2 className="text-gray-900 mb-4">第 {questionNumber} 題</h2>

        {question.prompt_text && <p className="text-gray-700">{question.prompt_text}</p>}

        {question.question_type === "COPY" && question.prompt_image_url && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-gray-600 mb-2">範例符號：</p>
            <div className="flex items-center justify-center bg-white rounded border-2 border-dashed border-gray-300">
              <img
                src={question.prompt_image_url}
                alt="範例符號"
                className="max-h-48 object-contain"
              />
            </div>
          </div>
        )}

        {question.question_type === "COPY" && !question.prompt_image_url && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-gray-600 mb-2">範例符號：</p>
            <div className="flex items-center justify-center h-48 bg-white rounded border-2 border-dashed border-gray-300">
              <span className="text-gray-400">
                {(question.expected_labels || [])
                  .map((label) => COMPONENT_NAMES[label as keyof typeof COMPONENT_NAMES] || label)
                  .join("、")}
              </span>
            </div>
          </div>
        )}
      </div>

      {!capturedImage ? (
        <div className="space-y-4">
          {showCamera ? (
            <div className="space-y-4">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  拍攝照片
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={startCamera}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                開啟相機拍攝
              </button>

              <div className="relative">
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
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border-2 border-gray-200">
            <img src={capturedImage} alt="拍攝的圖片" className="w-full" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  送出答案
                </>
              )}
            </button>
            <button
              onClick={handleRetake}
              disabled={isProcessing}
              className="px-6 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400"
            >
              重拍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
