import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AiPanel } from "../ai/AiPanel";
import { useStudio } from "../../contexts/StudioContext";
import { buildSettingExpansionPrompt, buildOpeningPrompt } from "../../utils/aiPrompts";
import { callAnthropic, AiError } from "../../utils/ai";

export const SettingsView: React.FC = () => {
  const {
    settings, setSettings, settingsTab, setSettingsTab,
    aiResults, setAiResults, aiErrors, setAiErrors,
    aiLoading, setAiLoading, addAiHistory, manuscriptText,
    aiMode, byokLocalKey, handleManuscriptChange, selectedScene,
  } = useStudio();

  const [openingResult, setOpeningResult] = useState("");
  const [openingLoading, setOpeningLoading] = useState(false);
  const [openingError, setOpeningError] = useState("");

  const openingMutation = useMutation({
    mutationFn: () =>
      callAnthropic(
        buildOpeningPrompt(settings.world, settings.characters, ""),
        800,
        aiMode,
        byokLocalKey,
      ),
    onMutate: () => {
      setOpeningResult("");
      setOpeningError("");
      setOpeningLoading(true);
    },
    onSuccess: (text) => {
      setOpeningResult(text);
      if (text) addAiHistory("書き出し提案", text, selectedScene?.title, selectedScene?.id);
    },
    onError: (e) =>
      setOpeningError(e instanceof AiError ? e.message : "不明なエラーが発生しました"),
    onSettled: () => setOpeningLoading(false),
    retry: (count, e) => {
      if (e instanceof AiError) return false;
      return count < 2;
    },
    retryDelay: (attempt) => [1000, 2000][attempt] ?? 2000,
  });

  return (
    <div style={{ padding: "24px 32px", overflowY: "auto" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#7ab3e0", fontWeight: 400, letterSpacing: 2 }}>世界観メモ</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["world", "characters", "theme"] as const).map((key) => (
          <button key={key} onClick={() => setSettingsTab(key)} style={{ padding: "6px 16px", borderRadius: 4, border: "1px solid", borderColor: settingsTab === key ? "#4a6fa5" : "#1e2d42", background: settingsTab === key ? "rgba(74,111,165,0.15)" : "transparent", color: settingsTab === key ? "#7ab3e0" : "#3a5570", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            {key === "world" ? "世界観" : key === "characters" ? "キャラクター" : "テーマ"}
          </button>
        ))}
      </div>
      <textarea value={settings[settingsTab]} onChange={e => setSettings({ ...settings, [settingsTab]: e.target.value })} style={{ width: "100%", minHeight: 280, background: "#070a14", border: "1px solid #1a2535", color: "#8ab0cc", fontFamily: "'Noto Serif JP','Georgia',serif", fontSize: 13, lineHeight: 2, padding: "20px 24px", resize: "vertical", outline: "none", borderRadius: 6, boxSizing: "border-box" }} />
      {(() => {
        const tabKeyMap = { world: "worldExpand", characters: "characterExpand", theme: "themeExpand" } as const;
        const tabLabelMap = { world: "世界観", characters: "キャラクター", theme: "テーマ" } as const;
        const resultKey = tabKeyMap[settingsTab];
        const tabLabel = tabLabelMap[settingsTab];
        return (
          <AiPanel
            label="AIで意味を拡張"
            result={aiResults[resultKey] || ""}
            onResult={t => {
              setAiResults(r => ({ ...r, [resultKey]: t }));
              if (t) addAiHistory(`${tabLabel}拡張`, t);
            }}
            onLoading={v => setAiLoading(l => ({ ...l, [resultKey]: v }))}
            loading={aiLoading[resultKey]}
            error={aiErrors[resultKey]}
            onError={t => setAiErrors(e => ({ ...e, [resultKey]: t }))}
            prompt={buildSettingExpansionPrompt(settingsTab, settings, manuscriptText)}
            onAppend={text => setSettings(prev => ({ ...prev, [settingsTab]: prev[settingsTab] + "\n\n---AI拡張---\n" + text }))}
          />
        );
      })()}

      {/* 書き出し提案 — 世界観・キャラクタータブのみ表示 */}
      {settingsTab !== "theme" && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1a2535" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => openingMutation.mutate()}
              disabled={openingLoading}
              style={{
                padding: "6px 16px",
                background: openingLoading ? "rgba(74,111,165,0.05)" : "rgba(74,111,165,0.1)",
                border: "1px solid #2a4060",
                color: openingLoading ? "#2a4060" : "#4a6fa5",
                cursor: openingLoading ? "default" : "pointer",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "inherit",
                letterSpacing: 1,
              }}
            >
              {openingLoading ? "生成中…" : openingError ? "再試行" : "✦ 書き出しを提案"}
            </button>
          </div>

          {openingError && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#e05555" }}>
              ⚠ {openingError}
            </div>
          )}

          {openingResult && (
            <div
              style={{
                marginTop: 8,
                padding: "12px 14px",
                background: "#070a14",
                border: "1px solid #1a2535",
                borderRadius: 4,
                fontSize: 13,
                color: "#8ab0cc",
                lineHeight: 2,
                whiteSpace: "pre-wrap",
                fontFamily: "'Noto Serif JP','Georgia',serif",
              }}
            >
              {openingResult}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button
                  onClick={() => {
                    handleManuscriptChange(openingResult + (manuscriptText ? "\n\n" + manuscriptText : ""));
                    setOpeningResult("");
                  }}
                  style={{
                    padding: "3px 10px",
                    background: "rgba(74,111,165,0.15)",
                    border: "1px solid #4a6fa5",
                    color: "#7ab3e0",
                    cursor: "pointer",
                    borderRadius: 3,
                    fontSize: 11,
                    fontFamily: "inherit",
                  }}
                >
                  先頭に挿入
                </button>
                <button
                  onClick={() => {
                    handleManuscriptChange((manuscriptText ? manuscriptText + "\n\n" : "") + openingResult);
                    setOpeningResult("");
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
                  onClick={() => setOpeningResult("")}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};
