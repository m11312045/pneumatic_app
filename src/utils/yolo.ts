const YOLO_API_URL = "https://predict.ultralytics.com";
const MODEL_URL = "https://hub.ultralytics.com/models/5E3pSobX578NWpW0bSig";
import { supabase } from "../lib/supabase";

type UltralyticsResult = {
  class: number;
  name: string;
  confidence: number;
  // box / mask 等欄位可能存在，但我們這裡不依賴
};

type UltralyticsResponse = {
  images?: Array<{
    results?: UltralyticsResult[];
    shape?: [number, number];
    speed?: Record<string, number>;
  }>;
  metadata?: any;
};

function dataUrlToFile(dataUrl: string, filename = "capture.jpg"): File {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*);base64/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function mapClassToComponentType(className: string): string {
  const normalized = className.toLowerCase().trim();
  const classMap: Record<string, string> = {
    "32-way nc valve": "32-way NC valve",
    "32-way no valve": "32-way NO valve",
    "52-way valve": "52-way valve",
    "double-acting cylinder": "Double-acting cylinder",
    "single-acting cylinder": "Single-acting cylinder",
    "one-way flow control valve": "One-way flow control valve",
    "shuttle valve": "Shuttle valve",
    "two-pressure valve": "Two-pressure valve",
    "two pressure valve": "Two-pressure valve",
  };
  return classMap[normalized] ?? className;
}

export async function detectComponent(file: File): Promise<{
  detectedLabels: string[];
  confidence: number;
  rawResult: any;
}> {
  const form = new FormData();
  form.append("file", file);
  form.append("imgsz", "640");
  form.append("conf", "0.25");
  form.append("iou", "0.45");

  const { data, error } = await supabase.functions.invoke("yolo-predict", {
    body: form,
  });

  if (error) throw error;

  const json = data as UltralyticsResponse;
  const results = json.images?.[0]?.results ?? [];

  if (results.length === 0) {
    return { detectedLabels: [], confidence: 0, rawResult: json };
  }

  const best = results.reduce((a, b) => (b.confidence > a.confidence ? b : a));
  const detectedLabels = Array.from(new Set(results.map((r) => mapClassToComponentType(r.name))));

  return { detectedLabels, confidence: best.confidence, rawResult: json };
}
