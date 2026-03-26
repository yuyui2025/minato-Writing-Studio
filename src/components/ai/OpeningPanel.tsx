import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { callAnthropic, AiError } from "../../utils/ai";
import { buildOpeningPrompt } from "../../utils/aiPrompts";
import type { AiMode } from "../../types";

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#070a14",
  border: "1px solid #1a2535",
  color: "#8ab0cc",
  fontSize: 11,
  fontFamily: "inherit",
  borderRadius: 4,
  padding: "8px 10px",
  resize: "vertical" as const,
  outline: "none",
  lineHeight: 1.7,
};

type Props = {
  aiMode: AiMode;
  byokLocalKey: string;
  initialWorld?: string;
  initialCharacters?: string;
  result: string;
  onResult: (text: string) => void;
  loading: boolean;
  onLoading: (v: boolean) => void;
  error: string;
  onError: (v: string) => void;
  onInsert: (text: string) => void;
  onAppend: (text: string) => void;
};

export function OpeningPanel({
  aiMode,
  byokLocalKey,
  initialWorld = "",
  initialCharacters = "",
  result,
  onResult,
  loading,
  onLoading,
  error,
  onError,
  onInsert,
  onAppend,
}: Props) {
  const [worldInput, setWorldInput] = useState(initialWorld);
  const [characterInput, setCharacterInput] = useState(initialCharacters);
  const [freeInstruction, setFreeInstruction] = useState("");

  // Settings が更新されたとき、未編集なら反映する
  const [prevInitialWorld, setPrevInitialWorld] = useState(initialWorld);
  const [prevInitialCharacters, setPrevInitialCharacters] = useState(initialCharacters);
  if (initialWorld !== prevInitialWorld) {
    setPrevInitialWorld(initialWorld);
    if (worldInput === prevInitialWorld) setWorldInput(initialWorld);
  }
  if (initialCharacters !== prevInitialCharacters) {
    setPrevInitialCharacters(initialCharacters);
    if (characterInput === prevInitialCharacters) setCharacterInput(initialCharacters);
  }

  const mutation = useMutation({
    mutationFn: () => {
      const prompt = buildOpeningPrompt(worldInput, characterInput, freeInstruction);
      return callAnthropic(prompt, 800, aiMode, byokLocalKey);
    },
    onMutate: () => {
      onResult("");
      onError("");
      onLoading(true);
    },
    onSuccess: (text) => onResult(text),
    onError: (e) => {
      onError(e instanceof AiError ? e.message : "不明なエラーが発生しました");
    },
    onSettled: () => onLoading(false),
    retry: (count, e) => {
      if (e instanceof AiError) return false;
      return count < 2;
    },
    retryDelay: (attempt) => [1000, 2000][attempt] ?? 2000,
  });

  const canRun = !loading && (worldInput.trim() || characterInput.trim() || freeInstruction.trim());

  return (
    <div style={{ borderBottom: "1px solid #1a2535", paddingBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 10 }}>✦ 書き出し生成</div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 4, letterSpacing: 1 }}>世界観</div>
        <textarea
          value={worldInput}
          onChange={e => setWorldInput(e.target.value)}
          placeholder="舞台・時代・雰囲気など…"
          rows={2}
          style={textareaStyle}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 4, letterSpacing: 1 }}>登場人物</div>
        <textarea
          value={characterInput}
          onChange={e => setCharacterInput(e.target.value)}
          placeholder="主人公・関係者など…"
          rows={2}
          style={textareaStyle}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 4, letterSpacing: 1 }}>自由指示</div>
        <textarea
          value={freeInstruction}
          onChange={e => setFreeInstruction(e.target.value)}
          placeholder="ジャンル・視点・トーンなど…"
          rows={2}
          style={textareaStyle}
        />
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          onClick={() => mutation.mutate()}
          disabled={!canRun}
          style={{
            padding: "4px 12px",
            background: canRun ? "rgba(74,111,165,0.1)" : "rgba(74,111,165,0.05)",
            border: "1px solid #2a4060",
            color: canRun ? "#4a6fa5" : "#2a4060",
            cursor: canRun ? "pointer" : "default",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "inherit",
            letterSpacing: 1,
          }}
        >
          {loading ? "生成中…" : error ? "再試行" : "書き出しを生成"}
        </button>
        {result && (
          <button
            onClick={() => onResult("")}
            style={{ padding: "4px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 4, fontSize: 11, fontFamily: "inherit" }}
          >
            クリア
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#e05555" }}>⚠ {error}</div>
      )}

      {result && (
        <div style={{ marginTop: 8, padding: "10px 12px", background: "#070a14", border: "1px solid #1a2535", borderRadius: 4, fontSize: 12, color: "#8ab0cc", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
          {result}
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <button
              onClick={() => onInsert(result)}
              style={{ padding: "3px 10px", background: "rgba(74,111,165,0.15)", border: "1px solid #2a4060", color: "#4a8fcc", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}
            >
              先頭に挿入
            </button>
            <button
              onClick={() => onAppend(result)}
              style={{ padding: "3px 10px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a8060", color: "#5ab090", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}
            >
              追記
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
