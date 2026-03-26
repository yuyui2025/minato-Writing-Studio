import type { Settings } from "../types";

const MANUSCRIPT_CONTEXT_LIMIT = 1200;

export function buildOpeningPrompt(
  worldInput: string,
  characterInput: string,
  freeInstruction: string,
): string {
  const parts = ["小説の書き出しを日本語で生成してください。"];
  if (worldInput.trim()) parts.push(`【世界観】\n${worldInput.trim()}`);
  if (characterInput.trim()) parts.push(`【登場人物】\n${characterInput.trim()}`);
  if (freeInstruction.trim()) parts.push(`【指示】\n${freeInstruction.trim()}`);
  parts.push("冒頭100〜300字の書き出しを1パターンのみ出力してください。余分な説明は不要です。");
  return parts.join("\n\n");
}

export function buildSettingExpansionPrompt(
  settingsTab: "world" | "characters" | "theme",
  settings: Settings,
  manuscriptText: string,
): string {
  const tabLabel = settingsTab === "world" ? "世界観" : settingsTab === "characters" ? "キャラクター" : "テーマ";
  const targetText = settings[settingsTab];

  if (settingsTab === "theme") {
    const manuscriptContext = manuscriptText.slice(-MANUSCRIPT_CONTEXT_LIMIT);
    return [
      "あなたは小説のテーマ設計アシスタントです。以下の本文・世界観・キャラクター設定をもとに、既存テーマから読み取れる含意を類推してください。", 
      "本文の流れと矛盾しないことを最優先し、テーマを深める観点で提案してください。箇条書きで3〜5点。",
      "",
      `【テーマ】\n${targetText}`,
      `【世界観】\n${settings.world}`,
      `【キャラクター】\n${settings.characters}`,
      `【本文（末尾${MANUSCRIPT_CONTEXT_LIMIT}字）】\n${manuscriptContext}`,
    ].join("\n\n");
  }

  return `以下の創作設定メモを読んで、含意・伏線の可能性・派生しうる要素・見落とされがちな矛盾を簡潔に指摘してください。箇条書きで3〜5点。\n\n【${tabLabel}】\n${targetText}`;
}
