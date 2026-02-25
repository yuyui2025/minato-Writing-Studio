import { Dispatch, SetStateAction } from "react";
import { PolishSuggestion, AppliedState } from "../../types";

type PolishPanelProps = {
  manuscriptText: string;
  onApply: (original: string, suggestion: string) => void;
  result: string;
  onResult: (value: string) => void;
  loading: boolean;
  onLoading: (value: boolean) => void;
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
  applied,
  onApplied,
}: PolishPanelProps) {
  const suggestions = (() => {
    if (!result) return null;
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      return JSON.parse(clean) as PolishSuggestion[];
    } catch {
      return null;
    }
  })();

  const run = async () => {
    onLoading(true);
    onResult("");
    onApplied({});
    try {
      const res = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `以下の文章を推敲してください。改善点を3つ見つけ、必ずJSONのみで返してください。余分なテキスト不要。\n形式: [{"original":"元の表現","suggestion":"改善案","reason":"理由"}]\n\n${manuscriptText.slice(
                -600
              )}`,
            },
          ],
        }),
      });
      const data = await res.json();
      onResult(data.content?.map((b: any) => b.text || "").join("") || "");
    } catch {
      onResult("[]");
    }
    onLoading(false);
  };

  return (
    <div>
      <button
        onClick={run}
        disabled={loading}
        style={{
          padding: "6px 16px",
          background: "rgba(74,111,165,0.1)",
          border: "1px solid #2a4060",
          color: loading ? "#2a4060" : "#4a6fa5",
          cursor: loading ? "default" : "pointer",
          borderRadius: 4,
          fontSize: 12,
          fontFamily: "inherit",
          letterSpacing: 1,
        }}
      >
        {loading ? "生成中…" : "✦ 文章を推敲"}
      </button>

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
