import { useMemo, Dispatch, SetStateAction, useState } from "react";
import { HintItem, AppliedState } from "../../types";
import { callAnthropic, AiError } from "../../utils/ai";

type HintPanelProps = {
  prompt: string;
  result: string;
  onResult: (value: string) => void;
  loading: boolean;
  onLoading: (value: boolean) => void;
  error?: string;
  onError: (value: string) => void;
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
  error = "",
  onError,
  applied,
  onApplied,
  manuscriptText,
  onInsert,
}: HintPanelProps) {
  const [instruction, setInstruction] = useState("");
  const hints = useMemo(() => {
    if (!result) return null;
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      return JSON.parse(clean) as HintItem[];
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
      const finalPrompt = prompt + 
        (instruction ? `\n\n追加の指示: ${instruction}` : "") +
        "\n\n必ずJSONのみで返してください。形式: [{\"hint\":\"ヒント内容\",\"reason\":\"根拠\",\"keyword\":\"本文中の関連する短いフレーズや単語（2〜8文字）\"}]";
      const text = await callAnthropic(finalPrompt);
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

  const handleApply = (h: HintItem, i: number) => {
    const comment = `\n※[ヒント: ${h.hint}]`;
    const idx = h.keyword ? manuscriptText.indexOf(h.keyword) : -1;
    if (idx !== -1 && h.keyword) {
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="ヒントの指示（例：アクション多め）"
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
                {loading ? "生成中…" : error ? "再試行" : "✦ 執筆ヒント"}
              </button>
            </div>
      
            {error && (        <div style={{ marginTop: 8, fontSize: 11, color: "#e05555" }}>⚠ {error}</div>
      )}

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
