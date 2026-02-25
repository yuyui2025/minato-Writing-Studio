import { useRef, useEffect } from "react";

type AiPanelProps = {
  label: string;
  prompt: string;
  onAppend: (text: string) => void;
  compact?: boolean;
  result?: string;
  onResult: (value: string) => void;
  loading?: boolean;
  onLoading: (value: boolean) => void;
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
}: AiPanelProps) {
  const onAppendRef = useRef(onAppend);
  useEffect(() => {
    onAppendRef.current = onAppend;
  });

  const run = async () => {
    onLoading(true);
    onResult("");
    try {
      const res = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b: any) => b.text || "").join("") || "";
      onResult(text);
    } catch (e) {
      onResult("エラーが発生しました");
    }
    onLoading(false);
  };

  return (
    <div style={{ marginTop: compact ? 0 : 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={run}
          disabled={loading}
          style={{
            padding: compact ? "4px 10px" : "6px 16px",
            background: "rgba(74,111,165,0.1)",
            border: "1px solid #2a4060",
            color: loading ? "#2a4060" : "#4a6fa5",
            cursor: loading ? "default" : "pointer",
            borderRadius: 4,
            fontSize: compact ? 11 : 12,
            fontFamily: "inherit",
            letterSpacing: 1,
          }}
        >
          {loading ? "生成中…" : `✦ ${label}`}
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
