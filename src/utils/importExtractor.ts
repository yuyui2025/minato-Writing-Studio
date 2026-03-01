import { callAnthropic } from "./ai";
import type { AiExtractResult } from "../types";

/**
 * Sends the first ~3000 characters of a manuscript to Claude and extracts
 * character and world-building information as plain Japanese text.
 *
 * Returns null if the AI response is malformed or a network error occurs.
 * The caller should handle null gracefully (e.g. show an empty-state message).
 */
export async function extractImportMetadata(
  text: string
): Promise<AiExtractResult | null> {
  const sample = text.slice(0, 3000);

  const prompt = `あなたは小説原稿の解析アシスタントです。以下の原稿の冒頭を読み、登場人物と世界観の情報を抽出してください。

# 原稿（冒頭抜粋）
${sample}

# 指示
上記の原稿から以下の情報を抽出し、必ずJSON形式のみで回答してください。JSON以外のテキストは一切含めないでください。

{"characters":"登場人物の名前・性格・役割などを箇条書きまたは短い説明文でまとめたもの（日本語）","world":"作品の世界観・舞台設定・時代背景などを短い説明文でまとめたもの（日本語）"}

情報が不足している場合は確認できた範囲の情報のみを記述してください。`;

  try {
    const raw = await callAnthropic(prompt, 800);
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<AiExtractResult>;
    return {
      characters: typeof parsed.characters === "string" ? parsed.characters : "",
      world: typeof parsed.world === "string" ? parsed.world : "",
    };
  } catch {
    return null;
  }
}
