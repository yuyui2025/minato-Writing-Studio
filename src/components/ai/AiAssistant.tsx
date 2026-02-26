import React, { useState } from "react";
import { AiPanel } from "./AiPanel";
import { HintPanel } from "./HintPanel";
import { PolishPanel } from "./PolishPanel";
import { callAnthropic, AiError } from "../../utils/ai";
import type {
  Scene, Settings, AppliedState,
  AiResults, AiLoading, AiErrors
} from "../../types";

interface AiAssistantProps {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  aiFloat: boolean;
  setAiFloat: (v: boolean) => void;
  aiWide: boolean;
  setAiWide: (v: boolean) => void;
  aiResults: AiResults;
  setAiResults: React.Dispatch<React.SetStateAction<AiResults>>;
  aiErrors: AiErrors;
  setAiErrors: React.Dispatch<React.SetStateAction<AiErrors>>;
  aiLoading: AiLoading;
  setAiLoading: React.Dispatch<React.SetStateAction<AiLoading>>;
  aiApplied: AppliedState;
  setAiApplied: React.Dispatch<React.SetStateAction<AppliedState>>;
  hintApplied: AppliedState;
  setHintApplied: React.Dispatch<React.SetStateAction<AppliedState>>;
  manuscriptText: string;
  handleManuscriptChange: (text: string) => void;
  settings: Settings;
  selectedScene: Scene | null;
  addAiHistory: (label: string, content: string, sceneTitle?: string) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  showSettings, setShowSettings, aiFloat, setAiFloat,
  aiWide, setAiWide, aiResults, setAiResults,
  aiErrors, setAiErrors,
  aiLoading, setAiLoading, aiApplied, setAiApplied,
  hintApplied, setHintApplied, manuscriptText,
  handleManuscriptChange, settings, selectedScene, addAiHistory
}) => {
  const [freeText, setFreeText] = useState("");

  const runFreeInstruct = async () => {
    if (!freeText.trim()) return;
    setAiLoading(l => ({ ...l, freeInstruct: true }));
    setAiResults(r => ({ ...r, freeInstruct: "" }));
    setAiErrors(e => ({ ...e, freeInstruct: "" }));
    const context = `【世界観】${settings.world}\n【キャラクター】${settings.characters}\n【テーマ】${settings.theme}\n\n【シーン】${selectedScene ? `${selectedScene.chapter} / ${selectedScene.title}` : "未選択"}\n【本文末尾】${manuscriptText.slice(-300)}\n\n【指示】${freeText}`;
    try {
      const text = await callAnthropic(context);
      setAiResults(r => ({ ...r, freeInstruct: text }));
      if (text) addAiHistory("自由指示", text, selectedScene?.title);
    } catch (e) {
      if (e instanceof AiError) {
        setAiErrors(er => ({ ...er, freeInstruct: e.message }));
      } else {
        setAiErrors(er => ({ ...er, freeInstruct: "不明なエラーが発生しました" }));
      }
    }
    setAiLoading(l => ({ ...l, freeInstruct: false }));
  };

  if (!selectedScene) return null;

  return (
    <>
      {showSettings && aiFloat && (
        <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
      )}
      <div style={{
        position: "fixed", top: 44, right: 0, bottom: 0, zIndex: 201,
        width: showSettings ? (aiWide ? 420 : 300) : 0,
        background: "#080c16", borderLeft: showSettings ? "1px solid #1e2d42" : "none",
        overflow: "hidden", transition: "width 0.2s ease",
        display: "flex", flexDirection: "column",
        ...(aiFloat && showSettings ? { boxShadow: "-4px 0 20px rgba(0,0,0,0.6)" } : {}),
      }}>
        {showSettings && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* パネルヘッダー */}
            <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #1e2d42", gap: 6, flexShrink: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#4a6fa5", flex: 1 }}>AI アシスト</div>
              <button onClick={() => setAiFloat(!aiFloat)} style={{ padding: "3px 8px", background: "transparent", border: "1px solid #1e2d42", color: aiFloat ? "#4a6fa5" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit", borderRadius: 3 }} title={aiFloat ? "固定表示に切替" : "フロート表示に切替"}>{aiFloat ? "浮" : "固"}</button>
              <button onClick={() => setAiWide(!aiWide)} style={{ padding: "3px 8px", background: "transparent", border: "1px solid #1e2d42", color: aiWide ? "#4a6fa5" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit", borderRadius: 3 }} title={aiWide ? "幅を狭く" : "幅を広く"}>{aiWide ? "◂" : "▸"}</button>
              <button onClick={() => setShowSettings(false)} style={{ background: "transparent", border: "none", color: "#3a5570", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>✕</button>
            </div>
            <div style={{ padding: 16, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 自由指示パネル */}
              <div style={{ borderBottom: "1px solid #1a2535", paddingBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 8 }}>✦ 自由指示</div>
                <textarea
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="AIへの指示を自由に入力…"
                  rows={3}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#070a14", border: "1px solid #1a2535",
                    color: "#8ab0cc", fontSize: 11, fontFamily: "inherit",
                    borderRadius: 4, padding: "8px 10px", resize: "vertical",
                    outline: "none", lineHeight: 1.7,
                  }}
                />
                <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={runFreeInstruct}
                    disabled={aiLoading.freeInstruct || !freeText.trim()}
                    style={{
                      padding: "4px 12px",
                      background: aiLoading.freeInstruct ? "rgba(74,111,165,0.05)" : "rgba(74,111,165,0.1)",
                      border: "1px solid #2a4060",
                      color: aiLoading.freeInstruct || !freeText.trim() ? "#2a4060" : "#4a6fa5",
                      cursor: aiLoading.freeInstruct || !freeText.trim() ? "default" : "pointer",
                      borderRadius: 4, fontSize: 11, fontFamily: "inherit", letterSpacing: 1,
                    }}
                  >
                    {aiLoading.freeInstruct ? "生成中…" : aiErrors.freeInstruct ? "再試行" : "実行"}
                  </button>
                  {aiResults.freeInstruct && (
                    <button
                      onClick={() => setAiResults(r => ({ ...r, freeInstruct: "" }))}
                      style={{ padding: "4px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 4, fontSize: 11, fontFamily: "inherit" }}
                    >
                      クリア
                    </button>
                  )}
                </div>
                {aiErrors.freeInstruct && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#e05555" }}>⚠ {aiErrors.freeInstruct}</div>
                )}
                {aiResults.freeInstruct && (
                  <div style={{ marginTop: 8, padding: "10px 12px", background: "#070a14", border: "1px solid #1a2535", borderRadius: 4, fontSize: 12, color: "#8ab0cc", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                    {aiResults.freeInstruct}
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                      <button
                        onClick={() => { handleManuscriptChange(manuscriptText + "\n" + aiResults.freeInstruct); }}
                        style={{ padding: "3px 10px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a8060", color: "#5ab090", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}
                      >
                        追記
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <PolishPanel
                manuscriptText={manuscriptText}
                result={aiResults.polish}
                onResult={t => setAiResults(r => ({ ...r, polish: t }))}
                loading={aiLoading.polish}
                onLoading={v => setAiLoading(l => ({ ...l, polish: v }))}
                error={aiErrors.polish}
                onError={t => setAiErrors(e => ({ ...e, polish: t }))}
                applied={aiApplied}
                onApplied={setAiApplied}
                onApply={(original, replacement) => {
                  const idx = manuscriptText.indexOf(original);
                  if (idx === -1) return;
                  const next = manuscriptText.slice(0, idx) + replacement + manuscriptText.slice(idx + original.length);
                  handleManuscriptChange(next);
                }}
              />
              <HintPanel
                result={aiResults.hint}
                onResult={t => setAiResults(r => ({ ...r, hint: t }))}
                loading={aiLoading.hint}
                onLoading={v => setAiLoading(l => ({ ...l, hint: v }))}
                error={aiErrors.hint}
                onError={t => setAiErrors(e => ({ ...e, hint: t }))}
                applied={hintApplied}
                onApplied={setHintApplied}
                manuscriptText={manuscriptText}
                onInsert={handleManuscriptChange}
                prompt={`以下の世界観・設定と現在のシーンを踏まえて、このシーンをより良くするヒントを3点挙げてください。\n\n【世界観】${settings.world}\n【キャラクター】${settings.characters}\n【テーマ】${settings.theme}\n\n【シーン】${selectedScene.chapter} / ${selectedScene.title}\n【概要】${selectedScene.synopsis || "なし"}\n【本文末尾】${manuscriptText.slice(-300)}`}
              />
              <AiPanel
                label="矛盾チェック"
                result={aiResults.check}
                onResult={t => { setAiResults(r => ({ ...r, check: t })); if (t) addAiHistory("矛盾チェック", t, selectedScene.title); }}
                onLoading={v => setAiLoading(l => ({ ...l, check: v }))}
                loading={aiLoading.check}
                error={aiErrors.check}
                onError={t => setAiErrors(e => ({ ...e, check: t }))}
                prompt={`以下の世界観設定と本文を照らし合わせて、設定との矛盾や違和感があれば指摘してください。なければ「矛盾なし」と答えてください。\n\n【世界観】${settings.world}\n【キャラクター】${settings.characters}\n\n【本文】${manuscriptText.slice(-800)}`}
                onAppend={() => {}}
              />
            </div>
          </div>
        )}
      </div>
      <button onClick={() => setShowSettings(!showSettings)} style={{
        position: "fixed", bottom: 24, right: 16, zIndex: 202,
        padding: "8px 14px", background: "#0e1520", border: "1px solid #2a4060",
        color: "#4a6fa5", cursor: "pointer", borderRadius: 20,
        fontSize: 11, fontFamily: "inherit", letterSpacing: 1,
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}>✦ AI</button>
    </>
  );
};
