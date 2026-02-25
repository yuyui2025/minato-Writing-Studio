import { Dispatch, SetStateAction } from "react";
import { HintItem, AppliedState } from "../../types";

type HintPanelProps = {
  prompt: string;
  result: string;
  onResult: (value: string) => void;
  loading: boolean;
  onLoading: (value: boolean) => void;
  applied: AppliedState;
  onApplied: Dispatch<SetStateAction<AppliedState>>;
  manuscriptText: string;
  onInsert: (value: string) => void;
};

export function HintPanel({
  prompt,
  result,
  onResult,
  loading,
  onLoading,
  applied,
  onApplied,
  manuscriptText,
  onInsert,
}: HintPanelProps) {
  const hints = (() => {
    if (!result) return null;
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      return JSON.parse(clean) as HintItem[];
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
              content:
                prompt +
                "\n\n必ずJSONのみで返してください。形式: [{\"hint\":\"ヒント内容\",\"reason\":\"根拠\",\"keyword\":\"本文中の関連する短いフレーズや単語（2〜8文字）\"}]",
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

  const handleApply = (h: HintItem, i: number) => {
    const comment = `\n※[ヒント: ${h.hint}]`;
    const idx = h.keyword ? manuscriptText.indexOf(h.keyword) : -1;
    if (idx !== -1) {
      const insertAt = idx + h.keyword.length;
      const next = manuscriptText.slice(0, insertAt) + comment + manuscriptText.slice(insertAt);
      onInsert(next);
    } else {
      onInsert(manuscriptText + comment);
    }
    onApplied((a) => ({ ...a, [i]: true }));
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
        {loading ? "生成中…" : "✦ 執筆ヒント"}
      </button>

      {result && !hints && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#3a5570" }}>{result.slice(0, 120)}</div>
      )}

      {hints &&
        hints.map((h, i) => (
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
            <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 4 }}>{h.reason}</div>
            <div style={{ fontSize: 12, color: "#8ab0cc", lineHeight: 1.9 }}>{h.hint}</div>
            {h.keyword && <div style={{ fontSize: 10, color: "#2a4060", marginTop: 4 }}>関連: 「{h.keyword}」</div>}
            <div style={{ marginTop: 8 }}>
              {!applied[i] ? (
                <button
                  onClick={() => handleApply(h, i)}
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
                  参考にした
                </button>
              ) : (
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
                  ✓ 済
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
