import React, { useState } from "react";
import { AiPanel } from "./AiPanel";
import { HintPanel } from "./HintPanel";
import { PolishPanel } from "./PolishPanel";
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
  setAiApplied: (v: AppliedState) => void;
  hintApplied: AppliedState;
  setHintApplied: (v: AppliedState) => void;
  manuscriptText: string;
  handleManuscriptChange: (text: string) => void;
  settings: Settings;
  selectedScene: Scene | null;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  showSettings, setShowSettings, aiFloat, setAiFloat,
  aiWide, setAiWide, aiResults, setAiResults,
  aiErrors, setAiErrors,
  aiLoading, setAiLoading, aiApplied, setAiApplied,
  hintApplied, setHintApplied, manuscriptText,
  handleManuscriptChange, settings, selectedScene
}) => {
  const [customInstruction, setCustomInstruction] = useState("");
  const [customResult, setCustomResult] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState("");

  if (!selectedScene) return null;

  const customPrompt = `以下の小説シーンと世界観をもとに、次の指示を実行してください。\n\n【世界観】${settings.world}\n【キャラクター】${settings.characters}\n【シーン】${selectedScene.chapter} / ${selectedScene.title}\n【本文】${manuscriptText.slice(-600)}\n\n【指示】${customInstruction}`;

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
                onResult={t => setAiResults(r => ({ ...r, check: t }))}
                onLoading={v => setAiLoading(l => ({ ...l, check: v }))}
                loading={aiLoading.check}
                error={aiErrors.check}
                onError={t => setAiErrors(e => ({ ...e, check: t }))}
                prompt={`以下の世界観設定と本文を照らし合わせて、設定との矛盾や違和感があれば指摘してください。なければ「矛盾なし」と答えてください。\n\n【世界観】${settings.world}\n【キャラクター】${settings.characters}\n\n【本文】${manuscriptText.slice(-800)}`}
                onAppend={() => {}}
              />
              <div style={{ borderTop: "1px solid #1a2535", paddingTop: 14 }}>
                <div style={{ fontSize: 10, color: "#3a5570", letterSpacing: 2, marginBottom: 8 }}>自由指示</div>
                <textarea
                  value={customInstruction}
                  onChange={e => setCustomInstruction(e.target.value)}
                  placeholder="AIへの指示を自由に入力…（例：このシーンをより緊迫感のある文体に書き直して）"
                  style={{ width: "100%", minHeight: 72, background: "#070a14", border: "1px solid #1a2535", color: "#c8d8e8", fontFamily: "inherit", fontSize: 11, lineHeight: 1.7, padding: "8px 10px", resize: "vertical", outline: "none", borderRadius: 4, boxSizing: "border-box" }}
                />
                <AiPanel
                  label="実行"
                  prompt={customPrompt}
                  result={customResult}
                  onResult={setCustomResult}
                  loading={customLoading}
                  onLoading={setCustomLoading}
                  error={customError}
                  onError={setCustomError}
                  onAppend={text => handleManuscriptChange(manuscriptText + "\n" + text)}
                />
              </div>
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
