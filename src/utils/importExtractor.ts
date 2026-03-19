import { callAnthropic } from "./ai";
import type { AiExtractResult, AiMode } from "../types";

type ImportSectionLike = {
  chapter?: string;
  title?: string;
  content: string;
};

const MAX_SECTION_CHARS = 1200;
const MAX_ANALYSIS_CHARS = 3600;

function normalizeHeading(section: ImportSectionLike, index: number): string {
  const chapter = section.chapter?.trim();
  const title = section.title?.trim();
  if (chapter && title) return `${chapter} / ${title}`;
  if (chapter) return chapter;
  if (title) return title;
  return `セクション${index + 1}`;
}

export function buildImportAnalysisExcerpt(sections: ImportSectionLike[]): string {
  let used = 0;
  const blocks: string[] = [];

  sections.some((section, index) => {
    if (used >= MAX_ANALYSIS_CHARS) return true;
    const remaining = MAX_ANALYSIS_CHARS - used;
    const sectionLimit = Math.min(MAX_SECTION_CHARS, remaining);
    const body = section.content.trim().slice(0, sectionLimit);
    if (!body) return false;

    blocks.push(`## ${normalizeHeading(section, index)}\n${body}`);
    used += body.length;
    return false;
  });

  return blocks.join("\n\n");
}

/**
 * Sends the first ~3000 characters of a manuscript to Claude and extracts
 * character and world-building information as plain Japanese text.
 *
 * Returns null if the AI response is malformed or a network error occurs.
 * The caller should handle null gracefully (e.g. show an empty-state message).
 */
export async function extractImportMetadata(
  text: string,
  aiMode: AiMode = "standard",
  byokLocalKey = ""
): Promise<AiExtractResult | null> {
  const sample = text.slice(0, MAX_ANALYSIS_CHARS);

  const prompt = `あなたは小説原稿の解析アシスタントです。以下の原稿の冒頭を読み、登場人物と世界観の情報を抽出してください。

# 原稿（冒頭抜粋）
${sample}

# 指示
上記の原稿から以下の情報を抽出し、必ずJSON形式のみで回答してください。JSON以外のテキストは一切含めないでください。

{"characters":"登場人物の名前・性格・役割などを箇条書きまたは短い説明文でまとめたもの（日本語）","world":"作品の世界観・舞台設定・時代背景などを短い説明文でまとめたもの（日本語）"}

情報が不足している場合は確認できた範囲の情報のみを記述してください。`;

  try {
    const raw = await callAnthropic(prompt, 800, aiMode, byokLocalKey);
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

export async function extractImportMetadataBySections(
  sections: ImportSectionLike[],
  fallbackText: string,
  aiMode: AiMode = "standard",
  byokLocalKey = ""
): Promise<AiExtractResult | null> {
  const excerpt = buildImportAnalysisExcerpt(sections);
  if (!excerpt) {
    return extractImportMetadata(fallbackText, aiMode, byokLocalKey);
  }
  return extractImportMetadata(excerpt, aiMode, byokLocalKey);
}
