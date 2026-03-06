import React, { useEffect, useState } from "react";
import { VerticalEditor } from "../editor/VerticalEditor";
import { AiPanel } from "../ai/AiPanel";
import { statusColors, statusLabels } from "../../constants";
import { useStudio } from "../../contexts/StudioContext";

export const WriteView: React.FC = () => {
  const {
    selectedScene, scenes, setScenes, selectedSceneId,
    editingSceneTitle, setEditingSceneTitle,
    editingSceneSynopsis, setEditingSceneSynopsis,
    handleStatusChange, verticalPreview, setVerticalPreview,
    handleDeleteScene, manuscriptText, handleManuscriptChange,
    editorSettings, handleSceneSelect, wordCount, textMetrics,
    aiResults, setAiResults, aiErrors, setAiErrors,
    aiLoading, setAiLoading, settings, addAiHistory,
    historyPast, historyFuture, undo, redo
  } = useStudio();
  const [footerOpen, setFooterOpen] = useState(true);
  const canUndo = historyPast.length > 0;
  const canRedo = historyFuture.length > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && e.shiftKey) {
        if (!canRedo) return;
        e.preventDefault();
        redo();
        return;
      }
      if (e.key.toLowerCase() === "z") {
        if (!canUndo) return;
        e.preventDefault();
        undo();
        return;
      }
      if (e.key.toLowerCase() === "y") {
        if (!canRedo) return;
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canRedo, canUndo, redo, undo]);

  if (!selectedScene) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#1e2d42", fontSize: 14 }}>
        左のリストからシーンを選択してください
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Scrollable writing area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{ paddingRight: 0 }}>
            <div style={{ fontSize: 11, color: "#3a5570", letterSpacing: 2, marginBottom: 4 }}>{selectedScene.chapter}</div>
            {editingSceneTitle ? (
              <input
                autoFocus
                value={selectedScene.title}
                onChange={e => setScenes(scenes.map(s => s.id === selectedSceneId ? { ...s, title: e.target.value } : s))}
                onBlur={() => setEditingSceneTitle(false)}
                onKeyDown={e => e.key === "Enter" && setEditingSceneTitle(false)}
                style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#c8d8e8", background: "transparent", border: "none", borderBottom: "1px solid #4a6fa5", outline: "none", fontFamily: "'Noto Serif JP','Georgia',serif", width: "100%", letterSpacing: 1 }}
              />
            ) : (
              <h2 onClick={() => setEditingSceneTitle(true)} style={{ margin: 0, fontSize: 20, color: "#c8d8e8", fontWeight: 600, cursor: "text" }} title="クリックで編集">
                {selectedScene.title ? selectedScene.title : <span style={{ fontStyle: "italic", color: "#3a5570" }}>無題</span>}
              </h2>
            )}
            {editingSceneSynopsis ? (
              <input
                autoFocus
                value={selectedScene.synopsis || ""}
                onChange={e => setScenes(scenes.map(s => s.id === selectedSceneId ? { ...s, synopsis: e.target.value } : s))}
                onBlur={() => setEditingSceneSynopsis(false)}
                onKeyDown={e => e.key === "Enter" && setEditingSceneSynopsis(false)}
                placeholder="概要を入力…"
                style={{ marginTop: 4, fontSize: 12, color: "#8ab0cc", background: "transparent", border: "none", borderBottom: "1px solid #2a4060", outline: "none", fontFamily: "inherit", width: "100%", fontStyle: "italic" }}
              />
            ) : (
              <div onClick={() => setEditingSceneSynopsis(true)} style={{ marginTop: 4, fontSize: 12, color: selectedScene.synopsis ? "#3a5570" : "#1e2d42", fontStyle: "italic", cursor: "text", minHeight: 18 }}>
                {selectedScene.synopsis || "概要を追加…"}
              </div>
            )}
          </div>
          <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {(["empty", "draft", "done"] as const).map(s => (
              <button key={s} onClick={() => handleStatusChange(selectedScene.id, s)} style={{ padding: "4px 10px", borderRadius: 3, border: "1px solid", borderColor: selectedScene.status === s ? statusColors[s] : "#1e2d42", background: selectedScene.status === s ? `${statusColors[s]}22` : "transparent", color: selectedScene.status === s ? statusColors[s] : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>{statusLabels[s]}</button>
            ))}
            <button
              onClick={undo}
              disabled={!canUndo}
              title="元に戻す (Ctrl/Cmd+Z)"
              style={{
                padding: "4px 10px",
                borderRadius: 3,
                border: "1px solid",
                borderColor: canUndo ? "#2a4060" : "#0f1725",
                background: canUndo ? "rgba(74,111,165,0.1)" : "transparent",
                color: canUndo ? "#5b7ea7" : "#1a2535",
                cursor: canUndo ? "pointer" : "default",
                fontSize: 10,
                fontFamily: "inherit",
              }}
            >
              Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="やり直し (Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y)"
              style={{
                padding: "4px 10px",
                borderRadius: 3,
                border: "1px solid",
                borderColor: canRedo ? "#2a4060" : "#0f1725",
                background: canRedo ? "rgba(74,111,165,0.1)" : "transparent",
                color: canRedo ? "#5b7ea7" : "#1a2535",
                cursor: canRedo ? "pointer" : "default",
                fontSize: 10,
                fontFamily: "inherit",
              }}
            >
              Redo
            </button>
            <button onClick={() => setVerticalPreview(!verticalPreview)} style={{ padding: "4px 10px", borderRadius: 3, border: "1px solid", borderColor: verticalPreview ? "#4a6fa5" : "#1e2d42", background: verticalPreview ? "rgba(74,111,165,0.15)" : "transparent", color: verticalPreview ? "#7ab3e0" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>縦組</button>
            <button onClick={() => handleDeleteScene(selectedScene.id)} style={{ padding: "4px 10px", borderRadius: 3, border: "1px solid #1e2d42", background: "transparent", color: "#3a2020", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>削除</button>
          </div>
        </div>
        {verticalPreview ? (
          <VerticalEditor
            key={selectedSceneId}
            initialText={manuscriptText}
            onChange={handleManuscriptChange}
            fontSize={editorSettings.fontSize}
            lineHeight={editorSettings.lineHeight}
          />
        ) : (
          <textarea value={manuscriptText} onChange={e => handleManuscriptChange(e.target.value)} placeholder="ここに本文を書く…" style={{ flex: 1, minHeight: 400, background: "#070a14", border: "1px solid #1a2535", color: "#c8d8e8", fontFamily: "'Noto Serif JP','Georgia',serif", fontSize: editorSettings.fontSize, lineHeight: editorSettings.lineHeight, padding: "16px 12px", resize: "none", outline: "none", borderRadius: 6, width: "100%", boxSizing: "border-box" }} />
        )}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", paddingRight: 90 }}>
          {(() => {
            const idx = scenes.findIndex(s => s.id === selectedSceneId);
            const prev = scenes[idx - 1];
            const next = scenes[idx + 1];
            return (<>
              <button onClick={() => prev && handleSceneSelect(prev)} disabled={!prev} style={{ padding: "4px 10px", background: "transparent", border: "1px solid", borderColor: prev ? "#1e2d42" : "#0e1520", color: prev ? "#3a5570" : "#1a2535", cursor: prev ? "pointer" : "default", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>← {prev ? (prev.title || "無題") : "—"}</button>
              <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#2a4060" }}>
                {wordCount.toLocaleString()} 文字
                {textMetrics && (
                  <span style={{ marginLeft: 6, color: "#1e3050" }}>
                    · {textMetrics.sentence_count} 文
                    · 約 {Math.ceil(textMetrics.reading_time_sec / 60)} 分
                  </span>
                )}
              </div>
              <button onClick={() => next && handleSceneSelect(next)} disabled={!next} style={{ padding: "4px 10px", background: "transparent", border: "1px solid", borderColor: next ? "#1e2d42" : "#0e1520", color: next ? "#3a5570" : "#1a2535", cursor: next ? "pointer" : "default", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>{next ? (next.title || "無題") : "—"} →</button>
            </>);
          })()}
        </div>
      </div>

      {/* Collapsible AI footer */}
      <div style={{ flexShrink: 0, background: "#080c16", borderTop: "1px solid #1a2535" }}>
        <button
          onClick={() => setFooterOpen(!footerOpen)}
          style={{ width: "100%", padding: "5px 12px", display: "flex", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#3a5570", flex: 1, textAlign: "left" }}>✦ AI</span>
          <span style={{ color: "#2a4060", fontSize: 9 }}>{footerOpen ? "▾" : "▸"}</span>
        </button>
        {footerOpen && (
          <div style={{ padding: "0 12px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <AiPanel
              label="続きを提案"
              compact
              result={aiResults.continue || ""}
              onResult={t => { setAiResults(r => ({ ...r, continue: t })); if (t) addAiHistory("続きを提案", t, selectedScene.title, selectedScene.id); }}
              onLoading={v => setAiLoading(l => ({ ...l, continue: v }))}
              loading={aiLoading.continue}
              error={aiErrors.continue}
              onError={t => setAiErrors(e => ({ ...e, continue: t }))}
              prompt={`以下の小説のシーンの続きを200字程度で提案してください。世界観・文体を維持し、あくまで提案として。\n\n【世界観】${settings.world}\n【シーン】${selectedScene.chapter} / ${selectedScene.title}\n【概要】${selectedScene.synopsis || ""}\n【本文末尾】${manuscriptText.slice(-200)}`}
              onAppend={text => handleManuscriptChange(manuscriptText + "\n" + text)}
            />
            <AiPanel
              label="概要を自動生成"
              compact
              result={aiResults.synopsis || ""}
              onResult={t => { setAiResults(r => ({ ...r, synopsis: t })); if (t) addAiHistory("概要を自動生成", t, selectedScene.title, selectedScene.id); }}
              onLoading={v => setAiLoading(l => ({ ...l, synopsis: v }))}
              loading={aiLoading.synopsis}
              error={aiErrors.synopsis}
              onError={t => setAiErrors(e => ({ ...e, synopsis: t }))}
              prompt={`以下の本文を読んで、シーンの概要を50字以内で生成してください。一文のみ返してください。\n\n${manuscriptText}`}
              onAppend={text => setScenes(scenes.map(s => s.id === selectedSceneId ? { ...s, synopsis: text.trim() } : s))}
            />
          </div>
        )}
      </div>
    </div>
  );
};
