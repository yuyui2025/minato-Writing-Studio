import type { TextMetrics } from "../types";

type WasmRaw = {
  char_count: number;
  sentence_count: number;
  paragraph_count: number;
  kanji_rate: number;
  reading_time_sec: number;
  free: () => void;
};
type WasmAnalyze = (text: string) => WasmRaw;

let analyzeFunc: WasmAnalyze | null = null;

export async function analyzeText(text: string): Promise<TextMetrics | null> {
  try {
    if (!analyzeFunc) {
      const mod = await import("../wasm/text_analyzer/text_analyzer.js");
      analyzeFunc = (mod as unknown as { analyze: WasmAnalyze }).analyze;
    }
    const raw = analyzeFunc(text);
    const metrics: TextMetrics = {
      char_count: raw.char_count,
      sentence_count: raw.sentence_count,
      paragraph_count: raw.paragraph_count,
      kanji_rate: raw.kanji_rate,
      reading_time_sec: raw.reading_time_sec,
    };
    raw.free();
    return metrics;
  } catch {
    return null;
  }
}
