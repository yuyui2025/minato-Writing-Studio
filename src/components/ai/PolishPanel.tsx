import { useMemo, Dispatch, SetStateAction, useState } from "react";
import { PolishSuggestion, AppliedState } from "../../types";
import { callAnthropic, AiError } from "../../utils/ai";

type PolishPanelProps = {
  manuscriptText: string;
  onApply: (original: string, suggestion: string) => void;
  result: string;
  onResult: (value: string) => void;
  loading: boolean;
  onLoading: (value: boolean) => void;
  error?: string;
  onError: (value: string) => void;
  applied: AppliedState;
  onApplied: Dispatch<SetStateAction<AppliedState>>;
};

export function PolishPanel({
  manuscriptText,
  onApply,
  result,
  onResult,
  loading,
  onLoading,
  error = "",
  onError,
  applied,
  onApplied,
}: PolishPanelProps) {
  const [instruction, setInstruction] = useState("");
  const suggestions = useMemo(() => {
    if (!result) return null;
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      return JSON.parse(clean) as PolishSuggestion[];
    } catch {
      return null;
    }
  }, [result]);

  const run = async () => {
    onLoading(true);
    onResult("");
    onError("");
    onApplied({});
    try {
      const prompt = `以下の文章を推敲してください。改善点を3つ見つけ、必ずJSONのみで返してください。余分なテキスト不要。\n形式: [{"original":"元の表現","suggestion":"改善案","reason":"理由"}]\n\n${manuscriptText.slice(-600)}${instruction ? `\n\n追加の指示: ${instruction}` : ""}`;
      const text = await callAnthropic(prompt);
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
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="推敲の指示（例：語尾を優しく）"
          style={{
            flex: "1 1 100%",
            padding: "4px 8px",
            background: "#0a0f1a",
            border: "1px solid #1a2535",
            borderRadius: 4,
            color: "#c8d8e8",
            fontSize: 11,
            outline: "none",
          }}
        />
        <button
          onClick={run}
          disabled={loading}
        style={{
          padding: "6px 16px",
          background: loading ? "rgba(74,111,165,0.05)" : "rgba(74,111,165,0.1)",
          border: "1px solid #2a4060",
          color: loading ? "#2a4060" : "#4a6fa5",
          cursor: loading ? "default" : "pointer",
          borderRadius: 4,
          fontSize: 12,
          fontFamily: "inherit",
          letterSpacing: 1,
        }}
              >
                {loading ? "生成中…" : error ? "再試行" : "✦ 文章を推敲"}
              </button>
            </div>
      
            {error && (        <div style={{ marginTop: 8, fontSize: 11, color: "#e05555" }}>⚠ {error}</div>
      )}

      {result && !suggestions && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#3a5570" }}>パース失敗: {result.slice(0, 80)}</div>
      )}

      {suggestions &&
        suggestions.map((s, i) => (
          <div
            key={i}
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "#070a14",
              border: `1px solid ${applied[i] ? "#1a3020" : "#1a2535"}`,
              borderRadius: 4,
              opacity: applied[i] ? 0.4 : 1,
              transition: "opacity 0.3s",
            }}
          >
            <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 4 }}>{s.reason}</div>
            <div
              style={{ fontSize: 12, color: "#e05555", lineHeight: 1.8, textDecoration: "line-through", opacity: 0.7 }}
            >
              {s.original}
            </div>
            <div style={{ fontSize: 12, color: "#8ab0cc", lineHeight: 1.8, marginTop: 2 }}>→ {s.suggestion}</div>
            {!applied[i] ? (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  onClick={() => {
                    onApply(s.original, s.suggestion);
                    onApplied((a) => ({ ...a, [i]: "replace" }));
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
                  適用
                </button>
                <button
                  onClick={() => {
                    onApply(s.original, s.original + "\n＊" + s.suggestion);
                    onApplied((a) => ({ ...a, [i]: "insert" }));
                  }}
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
                  直後に挿入
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  disabled
                  style={{
                    padding: "3px 10px",
                    background: "rgba(42,128,96,0.08)",
                    border: "1px solid #1a3020",
                    color: "#4ade80",
                    borderRadius: 3,
                    fontSize: 11,
                    fontFamily: "inherit",
                  }}
                >
                  ✓ 済（{applied[i] === "replace" ? "適用" : "挿入"}）
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
