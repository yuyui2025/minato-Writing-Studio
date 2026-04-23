import { useRef, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { callAnthropic, AiError } from "../../utils/ai";
import type { AiMode } from "../../types";

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
  aiMode?: AiMode;
  byokLocalKey?: string;
  onGoByok?: () => void;
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
  aiMode = "standard",
  byokLocalKey = "",
  onGoByok,
}: AiPanelProps) {
  const onAppendRef = useRef(onAppend);
  useEffect(() => {
    onAppendRef.current = onAppend;
  });

  // YUY-34: 「閉じる」で結果をストアから消さず、ローカルで非表示にする
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (result) setDismissed(false);
  }, [result]);

  const mutation = useMutation({
    mutationFn: () => callAnthropic(prompt, 1000, aiMode, byokLocalKey),
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

  return (
    <div style={{ marginTop: compact ? 0 : 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => mutation.mutate()}
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
        <div style={{ marginTop: 8, fontSize: 11, color: "#e05555", display: "flex", flexDirection: "column", gap: 4 }}>
          <span>⚠ {error}</span>
          {onGoByok && aiMode === "standard" && error.includes("上限に達しました") && (
            <button
              onClick={onGoByok}
              style={{
                alignSelf: "flex-start",
                padding: "4px 10px",
                background: "rgba(74,111,165,0.15)",
                border: "1px solid #4a6fa5",
                color: "#7ab3e0",
                cursor: "pointer",
                borderRadius: 3,
                fontSize: 11,
                fontFamily: "inherit",
              }}
            >
              APIキーを設定してBYOKで続ける →
            </button>
          )}
        </div>
      )}

      {result && !dismissed && (
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
                onClick={() => setDismissed(true)}
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
