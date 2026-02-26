import { useRef, useEffect, useState } from "react";
import { callAnthropic, AiError } from "../../utils/ai";

type AiPanelProps = {
  label: string;
  prompt: string;
  onAppend: (text: string) => void;
  compact?: boolean;
  result?: string;
  onResult: (value: string) => void;
  loading?: boolean;
  onLoading: (value: boolean) => void;
  error?: string;
  onError: (value: string) => void;
};

export function AiPanel({
  label,
  prompt,
  onAppend,
  compact = false,
  result = "",
  onResult,
  loading = false,
  onLoading,
  error = "",
  onError,
}: AiPanelProps) {
  const [instruction, setInstruction] = useState("");
  const onAppendRef = useRef(onAppend);
  useEffect(() => {
    onAppendRef.current = onAppend;
  });

  const run = async () => {
    onLoading(true);
    onResult("");
    onError("");
    try {
      const fullPrompt = instruction 
        ? `${prompt}\n\n追加の指示: ${instruction}`
        : prompt;
      const text = await callAnthropic(fullPrompt);
      onResult(text);
    } catch (e) {
      if (e instanceof AiError) {
        onError(e.message);
      } else {
        onError("不明なエラーが発生しました");
      }
    }
    onLoading(false);
  };

  return (
    <div style={{ marginTop: compact ? 0 : 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="AIへの追加指示（任意）"
          style={{
            flex: compact ? "1 1 120px" : "1 1 100%",
            padding: "4px 8px",
            background: "#0a0f1a",
            border: "1px solid #1a2535",
            borderRadius: 4,
            color: "#c8d8e8",
            fontSize: 11,
            outline: "none",
            marginBottom: compact ? 0 : 4,
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            padding: compact ? "4px 10px" : "6px 16px",
            background: loading ? "rgba(74,111,165,0.05)" : "rgba(74,111,165,0.1)",
            border: "1px solid #2a4060",
            color: loading ? "#2a4060" : "#4a6fa5",
            cursor: loading ? "default" : "pointer",
            borderRadius: 4,
            fontSize: compact ? 11 : 12,
            fontFamily: "inherit",
            letterSpacing: 1,
          }}
        >
          {loading ? "生成中…" : error ? "再試行" : `✦ ${label}`}
        </button>
        {result && !compact && (
          <button
            onClick={() => {
              onAppendRef.current(result);
              onResult("");
            }}
            style={{
              padding: "4px 10px",
              background: "rgba(42,128,96,0.15)",
              border: "1px solid #2a8060",
              color: "#5ab090",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "inherit",
            }}
          >
            追記
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#e05555", display: "flex", alignItems: "center", gap: 6 }}>
          <span>⚠ {error}</span>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            background: "#070a14",
            border: "1px solid #1a2535",
            borderRadius: 4,
            fontSize: 12,
            color: "#8ab0cc",
            lineHeight: 1.9,
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
          {compact && (
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  onAppendRef.current(result);
                  onResult("");
                }}
                style={{
                  padding: "3px 10px",
                  background: "rgba(42,128,96,0.15)",
                  border: "1px solid #2a8060",
                  color: "#5ab090",
                  cursor: "pointer",
                  borderRadius: 3,
                  fontSize: 11,
                  fontFamily: "inherit",
                }}
              >
                追記
              </button>
              <button
                onClick={() => onResult("")}
                style={{
                  padding: "3px 10px",
                  background: "transparent",
                  border: "1px solid #1e2d42",
                  color: "#3a5570",
                  cursor: "pointer",
                  borderRadius: 3,
                  fontSize: 11,
                  fontFamily: "inherit",
                }}
              >
                閉じる
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
