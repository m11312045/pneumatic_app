// src/components/QuestionCard.tsx
import { useEffect, useState } from "react";
import { Question, Answer } from "../types";
import { Camera, Upload, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  attemptId: string | null;
  seq: number;
  onAnswer: (answer: Answer) => void;
}

export function QuestionCard({ question, questionNumber, attemptId, seq, onAnswer }: QuestionCardProps) {
  const [imageData, setImageData] = useState<string>(""); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setImageData("");
    setSelectedFile(null);
  }, [question.id]);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !attemptId) {
      alert("請選擇照片");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const path = `${attemptId}/${seq}_${Date.now()}.${fileExt}`;
      
      const { error: upErr } = await supabase.storage
        .from("pneumatic-answers")
        .upload(path, selectedFile);

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("pneumatic-answers")
        .getPublicUrl(path);

      onAnswer({
        questionId: question.id,
        seq,
        imageData,
        imageUrl: publicUrl,
      });
    } catch (err) {
      alert("上傳失敗，請重試");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-4 text-lg font-bold">第 {questionNumber} 題</div>
      <div className="bg-gray-50 p-4 mb-6 rounded border text-gray-700 whitespace-pre-line">
        {question.prompt_text}
      </div>

      {question.question_type === "COPY" && question.prompt_image_url && (
        <img src={question.prompt_image_url} className="mb-6 rounded border w-full" alt="範例" />
      )}

      <div className="mb-6">
        <label className={`flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer w-fit ${isUploading ? 'opacity-50' : ''}`}>
          <Upload className="w-5 h-5" />
          {imageData ? "重新選擇照片" : "上傳作答照片"}
          <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
        {imageData && <img src={imageData} className="mt-4 rounded w-full border" alt="預覽" />}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!imageData || isUploading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg disabled:bg-gray-400 flex justify-center items-center gap-2"
      >
        {isUploading ? <><Loader2 className="animate-spin" /> 傳送中...</> : "下一題"}
      </button>
    </div>
  );
}
