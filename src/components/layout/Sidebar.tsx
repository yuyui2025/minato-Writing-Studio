import React, { useEffect, useRef, useState } from "react";
import { statusColors } from "../../constants";
import { useStudio } from "../../contexts/StudioContext";
import { AiPanel } from "../ai/AiPanel";
import type {
  SceneDraft, SidebarTabKey, TabKey, Scene, AiHistoryItem
} from "../../types";

export const Sidebar: React.FC = () => {
  const {
    sidebarOpen, setSidebarOpen, sidebarFloat, setSidebarFloat, sidebarWidth, setSidebarWidth,
    sidebarTab, setSidebarTab, tab, setTab, scenes, setScenes, selectedSceneId,
    manuscripts, sceneSearch, setSceneSearch, newScene, setNewScene,
    addingScene, setAddingScene, addingChapter, setAddingChapter,
    settings, setSettings, settingsTab, setSettingsTab, editorSettings, setEditorSettings,
    handleSceneSelect, handleAddScene,
    aiHistory, clearAiHistory, manuscriptText, handleManuscriptChange,
    aiResults, setAiResults, aiErrors, setAiErrors, aiLoading, setAiLoading, addAiHistory,
  } = useStudio();
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [showCurrentOnly, setShowCurrentOnly] = useState(false);
  const [resizing, setResizing] = useState(false);
  const sidebarMinWidth = 180;
  const sidebarMaxWidth = 420;
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  // Drag-and-drop state for structure tab
  const [sidebarDraggingId, setSidebarDraggingId] = useState<number | null>(null);
  const [sidebarDropTarget, setSidebarDropTarget] = useState<{ id: number; position: "before" | "after" } | null>(null);
  const [sidebarDropChapter, setSidebarDropChapter] = useState<string | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // YUY-27: 追記先シーンへ移動してから追記する（表示シーン以外にも正しく適用）
  const onInsertHistory = (item: AiHistoryItem) => {
    if (item.label === "世界観拡張") {
      setSettings(prev => ({
        ...prev,
        world: prev.world + (prev.world ? "\n" : "") + item.content,
      }));
      return;
    }

    if (item.sceneId && item.sceneId !== selectedSceneId) {
      const targetScene = scenes.find(s => s.id === item.sceneId);
      if (targetScene) {
        handleSceneSelect(targetScene);
        const targetText = manuscripts[item.sceneId] || "";
        handleManuscriptChange(targetText + (targetText ? "\n" : "") + item.content);
        return;
      }
    }
    handleManuscriptChange(manuscriptText + (manuscriptText ? "\n" : "") + item.content);
  };

  // YUY-26: 該当シーンへ移動
  const onNavigateToScene = (sceneId: number) => {
    const targetScene = scenes.find(s => s.id === sceneId);
    if (targetScene) handleSceneSelect(targetScene);
  };

  // Drag handlers for sidebar structure tab
  const handleStructureDragStart = (e: React.DragEvent, sceneId: number) => {
    setSidebarDraggingId(sceneId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleStructureDragEnd = () => {
    setSidebarDraggingId(null);
    setSidebarDropTarget(null);
    setSidebarDropChapter(null);
  };

  const handleStructureDragOverScene = (e: React.DragEvent, sceneId: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setSidebarDropTarget({ id: sceneId, position });
    setSidebarDropChapter(null);
  };

  const handleStructureDragOverChapter = (e: React.DragEvent, chapter: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setSidebarDropChapter(chapter);
    setSidebarDropTarget(null);
  };

  const handleStructureDropOnScene = (e: React.DragEvent, targetId: number, targetChapter: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sidebarDraggingId || sidebarDraggingId === targetId) {
      setSidebarDropTarget(null);
      return;
    }
    const position = sidebarDropTarget?.position ?? "after";
    const draggedScene = scenes.find(s => s.id === sidebarDraggingId);
    if (!draggedScene) return;
    const rest = scenes.filter(s => s.id !== sidebarDraggingId);
    const targetIdx = rest.findIndex(s => s.id === targetId);
    const insertIdx = position === "before" ? targetIdx : targetIdx + 1;
    setScenes([
      ...rest.slice(0, insertIdx),
      { ...draggedScene, chapter: targetChapter },
      ...rest.slice(insertIdx),
    ]);
    setSidebarDraggingId(null);
    setSidebarDropTarget(null);
  };

  const handleStructureDropOnChapter = (e: React.DragEvent, chapter: string) => {
    e.preventDefault();
    if (!sidebarDraggingId) return;
    const draggedScene = scenes.find(s => s.id === sidebarDraggingId);
    if (!draggedScene) return;
    const rest = scenes.filter(s => s.id !== sidebarDraggingId);
    const chapterIndices = rest.map((s, i) => ({ s, i })).filter(({ s }) => s.chapter === chapter);
    const insertIdx = chapterIndices.length > 0
      ? chapterIndices[chapterIndices.length - 1].i + 1
      : rest.length;
    setScenes([
      ...rest.slice(0, insertIdx),
      { ...draggedScene, chapter },
      ...rest.slice(insertIdx),
    ]);
    setSidebarDraggingId(null);
    setSidebarDropChapter(null);
  };

  const effectiveSidebarWidth = Math.max(sidebarMinWidth, Math.min(sidebarMaxWidth, sidebarWidth || 220));

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: PointerEvent) => {
      const delta = e.clientX - dragStartXRef.current;
      const next = Math.max(sidebarMinWidth, Math.min(sidebarMaxWidth, dragStartWidthRef.current + delta));
      setSidebarWidth(next);
    };
    const onUp = () => setResizing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resizing, setSidebarWidth]);

  return (
    <aside style={{
      width: sidebarOpen ? effectiveSidebarWidth : 36,
      borderRight: "1px solid #1e2d42",
      background: "#080c16",
      overflowY: sidebarOpen ? "auto" : "hidden",
      flexShrink: 0,
      transition: "width 0.2s ease",
      display: "flex", flexDirection: "column",
      ...(sidebarOpen && sidebarFloat ? {
        position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 51, width: effectiveSidebarWidth, boxShadow: "4px 0 20px rgba(0,0,0,0.6)"
      } : {}),
    }}>
      {sidebarOpen && !sidebarFloat && (
        <div
          onPointerDown={(e) => {
            dragStartXRef.current = e.clientX;
            dragStartWidthRef.current = effectiveSidebarWidth;
            setResizing(true);
          }}
          style={{
            position: "absolute",
            top: 0,
            right: -3,
            bottom: 0,
            width: 6,
            cursor: "col-resize",
            background: resizing ? "rgba(74,111,165,0.25)" : "transparent",
            zIndex: 52,
          }}
          title="ドラッグして幅を変更"
        />
      )}
      {sidebarOpen ? (
        <>
          {/* Sidebar header: tabs + close */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e2d42", flexShrink: 0 }}>
            {([["write","執筆"],["structure","構成"],["settings","世界観"],["prefs","環境"],["ai","AI"]] as [SidebarTabKey, string][]).map(([key, label]) => (
              <button key={key} onClick={() => {
                setSidebarTab(key);
                // In fixed (non-float) mode, main view stays on write
                if (sidebarFloat) setTab(key as TabKey);
              }} style={{
                flex: 1, padding: "8px 0", background: "transparent", border: "none",
                borderBottom: sidebarTab === key ? "2px solid #4a6fa5" : "2px solid transparent",
                color: sidebarTab === key ? "#7ab3e0" : "#2a4060",
                cursor: "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: 1,
              }}>{label}</button>
            ))}
            <button onClick={() => setSidebarFloat(!sidebarFloat)} style={{ padding: "8px 8px", background: "transparent", border: "none", borderLeft: "1px solid #1e2d42", color: sidebarFloat ? "#4a6fa5" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit", flexShrink: 0 }} title={sidebarFloat ? "固定表示に切替" : "フロート表示に切替"}>{sidebarFloat ? "浮" : "固"}</button>
            <button onClick={() => setSidebarOpen(false)} style={{ padding: "8px 10px", background: "transparent", border: "none", borderLeft: "1px solid #1e2d42", color: "#2a4060", cursor: "pointer", fontSize: 11, fontFamily: "inherit", flexShrink: 0 }}>◀</button>
          </div>

          {/* Sidebar content: 執筆 = scene list */}
          {sidebarTab === "write" && <>
            <div style={{ padding: "8px 12px 4px" }}>
              <input
                placeholder="シーンを検索…"
                value={sceneSearch}
                onChange={e => setSceneSearch(e.target.value)}
                style={{ width: "100%", background: "#0e1520", border: "1px solid #1e2d42", color: "#8ab0cc", padding: "5px 8px", borderRadius: 4, fontSize: 11, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ padding: "4px 16px 4px", fontSize: 10, letterSpacing: 3, color: "#2a4060", textTransform: "uppercase" }}>Scene List</div>
            {scenes.filter(s => !sceneSearch || (s.title || "無題").includes(sceneSearch) || (s.chapter || "").includes(sceneSearch)).map(scene => (
              <div key={scene.id} onClick={() => handleSceneSelect(scene)} style={{ padding: "10px 16px", cursor: "pointer", borderLeft: selectedSceneId === scene.id ? "2px solid #4a6fa5" : "2px solid transparent", background: selectedSceneId === scene.id ? "rgba(74,111,165,0.08)" : "transparent", borderBottom: "1px solid #0e1520" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: statusColors[scene.status], boxShadow: `0 0 6px ${statusColors[scene.status]}66` }} />
                  <span style={{ fontSize: 10, color: "#3a5570" }}>{scene.chapter}</span>
                </div>
                <div style={{ fontSize: 12, color: "#8ab0cc", lineHeight: 1.4 }}>{scene.title ? scene.title : <span style={{ color: "#2a4060", fontStyle: "italic" }}>無題</span>}</div>
                {manuscripts[scene.id] && <div style={{ fontSize: 10, color: "#2a4060", marginTop: 2 }}>{manuscripts[scene.id].replace(/\s/g, "").length}字</div>}
              </div>
            ))}
            <div style={{ padding: "12px 16px" }}>
              {!addingScene ? (
                <button onClick={() => setAddingScene(true)} style={{ width: "100%", padding: "7px", border: "1px dashed #1e2d42", background: "transparent", color: "#2a4060", cursor: "pointer", fontSize: 11, borderRadius: 4, fontFamily: "inherit" }}>＋ シーンを追加</button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[["chapter", "章名"], ["title", "タイトル"], ["synopsis", "概要"]].map(([key, ph]) => (
                    <input key={key} placeholder={ph} value={newScene[key as keyof SceneDraft]} onChange={e => setNewScene({ ...newScene, [key as keyof SceneDraft]: e.target.value })} style={{ background: "#0e1520", border: "1px solid #1e2d42", color: "#8ab0cc", padding: "5px 8px", borderRadius: 3, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                  ))}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={handleAddScene} style={{ flex: 1, padding: "5px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>追加</button>
                    <button onClick={() => setAddingScene(false)} style={{ flex: 1, padding: "5px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>キャンセル</button>
                  </div>
                </div>
              )}
            </div>
          </>}

          {/* Sidebar content: 構成 = chapter tree with drag-and-drop */}
          {sidebarTab === "structure" && (() => {
            const chapters = scenes.reduce((acc, scene) => {
              const ch = scene.chapter || "未分類";
              if (!acc[ch]) acc[ch] = [];
              acc[ch].push(scene);
              return acc;
            }, {} as Record<string, Scene[]>);
            return (
              <div style={{ padding: "10px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(chapters).map(([chapter, chScenes]) => {
                  const allDone = chScenes.every(s => s.status === "done");
                  const anyDraft = chScenes.some(s => s.status === "draft");
                  const chColor = allDone ? statusColors.done : anyDraft ? statusColors.draft : statusColors.empty;
                  const isAddingHere = addingScene && newScene.chapter === chapter;
                  const isChapterDropTarget = sidebarDropChapter === chapter;
                  return (
                    <div
                      key={chapter}
                      onDragOver={e => handleStructureDragOverChapter(e, chapter)}
                      onDrop={e => handleStructureDropOnChapter(e, chapter)}
                    >
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingBottom: 4,
                        borderBottom: `1px solid ${isChapterDropTarget ? "#4a6fa5" : "#1a2535"}`,
                        background: isChapterDropTarget ? "rgba(74,111,165,0.06)" : "transparent",
                        borderRadius: isChapterDropTarget ? 3 : 0,
                        transition: "background 0.1s",
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: chColor, boxShadow: `0 0 5px ${chColor}66` }} />
                        <span style={{ fontSize: 11, color: "#c8d8e8", fontWeight: 600, flex: 1 }}>{chapter || "未分類"}</span>
                        <button onClick={() => { setNewScene({ chapter, title: "", synopsis: "" }); setAddingScene(true); }} style={{ fontSize: 10, padding: "1px 6px", background: "transparent", border: "1px solid #1e2d42", color: "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>＋</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 10 }}>
                        {chScenes.map(scene => {
                          const isDropBefore = sidebarDropTarget?.id === scene.id && sidebarDropTarget.position === "before";
                          const isDropAfter = sidebarDropTarget?.id === scene.id && sidebarDropTarget.position === "after";
                          const isDragging = sidebarDraggingId === scene.id;
                          return (
                            <div key={scene.id}>
                              {isDropBefore && (
                                <div style={{ height: 2, background: "#4a6fa5", borderRadius: 1, marginBottom: 2 }} />
                              )}
                              <div
                                draggable
                                onDragStart={e => handleStructureDragStart(e, scene.id)}
                                onDragEnd={handleStructureDragEnd}
                                onDragOver={e => handleStructureDragOverScene(e, scene.id)}
                                onDrop={e => handleStructureDropOnScene(e, scene.id, scene.chapter)}
                                onClick={() => handleSceneSelect(scene)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 4,
                                  cursor: "grab",
                                  background: selectedSceneId === scene.id ? "rgba(74,111,165,0.1)" : "transparent",
                                  border: "1px solid", borderColor: selectedSceneId === scene.id ? "#4a6fa5" : "transparent",
                                  opacity: isDragging ? 0.4 : 1,
                                  transition: "opacity 0.15s",
                                  userSelect: "none",
                                }}
                              >
                                <span style={{ fontSize: 9, color: "#2a4060", flexShrink: 0 }}>⠿</span>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: statusColors[scene.status] }} />
                                <span style={{ fontSize: 11, color: "#8ab0cc", flex: 1 }}>{scene.title ? scene.title : <span style={{ color: "#2a4060", fontStyle: "italic" }}>無題</span>}</span>
                              </div>
                              {isDropAfter && (
                                <div style={{ height: 2, background: "#4a6fa5", borderRadius: 1, marginTop: 2 }} />
                              )}
                            </div>
                          );
                        })}
                        {isAddingHere && (
                          <div style={{ padding: "6px 8px", background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 4, display: "flex", flexDirection: "column", gap: 5 }}>
                            <input autoFocus placeholder="タイトル" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => e.key === "Enter" && handleAddScene()} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#8ab0cc", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={handleAddScene} style={{ flex: 1, padding: "3px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>追加</button>
                              <button onClick={() => setAddingScene(false)} style={{ flex: 1, padding: "3px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>×</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {addingChapter ? (
                  <div style={{ background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 5, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
                    <input autoFocus placeholder="章名" value={newScene.chapter} onChange={e => setNewScene({ ...newScene, chapter: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#c8d8e8", fontSize: 12, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                    <input placeholder="タイトル（省略可）" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => { if (e.key === "Enter") { handleAddScene(); setAddingChapter(false); }}} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#8ab0cc", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => { handleAddScene(); setAddingChapter(false); }} style={{ flex: 1, padding: "3px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>追加</button>
                      <button onClick={() => { setAddingChapter(false); setNewScene({ chapter: "", title: "", synopsis: "" }); }} style={{ flex: 1, padding: "3px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>×</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setNewScene({ chapter: "", title: "", synopsis: "" }); setAddingChapter(true); }} style={{ padding: "6px", border: "1px dashed #1e2d42", background: "transparent", color: "#2a4060", cursor: "pointer", fontSize: 10, borderRadius: 4, fontFamily: "inherit" }}>＋ 新しい章</button>
                )}
              </div>
            );
          })()}

          {/* Sidebar content: 設定 */}
          {sidebarTab === "settings" && (
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                {(["world", "characters", "theme"] as const).map(key => (
                  <button key={key} onClick={() => setSettingsTab(key)} style={{
                    flex: 1, padding: "3px 2px", borderRadius: 3, border: "1px solid",
                    borderColor: settingsTab === key ? "#4a6fa5" : "#1e2d42",
                    background: settingsTab === key ? "rgba(74,111,165,0.15)" : "transparent",
                    color: settingsTab === key ? "#7ab3e0" : "#3a5570",
                    cursor: "pointer", fontSize: 9, fontFamily: "inherit",
                  }}>
                    {key === "world" ? "世界観" : key === "characters" ? "キャラ" : "テーマ"}
                  </button>
                ))}
              </div>
              <textarea
                value={settings[settingsTab]}
                onChange={e => setSettings({ ...settings, [settingsTab]: e.target.value })}
                style={{ width: "100%", minHeight: 80, background: "#070a14", border: "1px solid #1a2535", color: "#8ab0cc", fontFamily: "inherit", fontSize: 11, lineHeight: 1.8, padding: "6px 8px", resize: "vertical", outline: "none", borderRadius: 4, boxSizing: "border-box" }}
              />
              <AiPanel
                label="AIで拡張"
                compact
                result={aiResults.worldExpand || ""}
                onResult={t => {
                  setAiResults(r => ({ ...r, worldExpand: t }));
                  if (t) addAiHistory("世界観拡張", t);
                }}
                onLoading={v => setAiLoading(l => ({ ...l, worldExpand: v }))}
                loading={aiLoading.worldExpand}
                error={aiErrors.worldExpand}
                onError={t => setAiErrors(e => ({ ...e, worldExpand: t }))}
                prompt={`以下の創作設定メモを読んで、含意・伏線の可能性・派生しうる要素・見落とされがちな矛盾を簡潔に指摘してください。箇条書きで3〜5点。\n\n【${settingsTab === "world" ? "世界観" : settingsTab === "characters" ? "キャラクター" : "テーマ"}】\n${settings[settingsTab]}`}
                onAppend={text => setSettings(prev => ({ ...prev, [settingsTab]: prev[settingsTab] + "\n\n---AI拡張---\n" + text }))}
              />
            </div>
          )}
          {sidebarTab === "prefs" && (
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 8 }}>文字サイズ　<span style={{ color: "#8ab0cc" }}>{editorSettings.fontSize}px</span></div>
                <input type="range" min={12} max={24} value={editorSettings.fontSize} onChange={e => setEditorSettings(s => ({ ...s, fontSize: Number(e.target.value) }))} style={{ width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 8 }}>行間　<span style={{ color: "#8ab0cc" }}>{editorSettings.lineHeight}</span></div>
                <input type="range" min={1.4} max={3.0} step={0.1} value={editorSettings.lineHeight} onChange={e => setEditorSettings(s => ({ ...s, lineHeight: Number(e.target.value) }))} style={{ width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 8 }}>テーマ</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["dark", "light", "system"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setEditorSettings(s => ({ ...s, colorTheme: t }))}
                      style={{
                        flex: 1, padding: "4px 2px",
                        background: (editorSettings.colorTheme ?? "dark") === t ? "rgba(74,111,165,0.2)" : "transparent",
                        border: "1px solid",
                        borderColor: (editorSettings.colorTheme ?? "dark") === t ? "#4a6fa5" : "#1e2d42",
                        color: (editorSettings.colorTheme ?? "dark") === t ? "#7ab3e0" : "#3a5570",
                        cursor: "pointer", fontSize: 9, borderRadius: 3, fontFamily: "inherit",
                      }}
                    >
                      {t === "dark" ? "暗" : t === "light" ? "明" : "自動"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI履歴タブ */}
          {sidebarTab === "ai" && (
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", flex: 1 }}>AI 履歴</span>
                {/* YUY-25: 現在シーンのみフィルタ */}
                {selectedSceneId && (
                  <button
                    onClick={() => setShowCurrentOnly(v => !v)}
                    style={{ fontSize: 9, padding: "2px 7px", background: showCurrentOnly ? "rgba(74,111,165,0.2)" : "transparent", border: `1px solid ${showCurrentOnly ? "#4a6fa5" : "#1e2d42"}`, color: showCurrentOnly ? "#7ab3e0" : "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {showCurrentOnly ? "現在" : "全表示"}
                  </button>
                )}
                {aiHistory.length > 0 && (
                  <button onClick={clearAiHistory} style={{ fontSize: 9, padding: "2px 7px", background: "transparent", border: "1px solid #1e2d42", color: "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>全クリア</button>
                )}
              </div>
              {(() => {
                const filtered = showCurrentOnly
                  ? aiHistory.filter(item => item.sceneId === selectedSceneId)
                  : aiHistory;
                if (filtered.length === 0) return (
                  <div style={{ fontSize: 11, color: "#2a4060", textAlign: "center", padding: "20px 0" }}>
                    {showCurrentOnly ? "このシーンの履歴はありません" : "まだ履歴がありません"}
                  </div>
                );
                return filtered.map(item => {
                  const d = new Date(item.timestamp);
                  const timeLabel = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
                  const isExpanded = expandedIds.includes(item.id);
                  const isDifferentScene = item.sceneId && item.sceneId !== selectedSceneId;
                  return (
                    <div key={item.id} style={{ padding: "8px 10px", background: "#0a0f1a", border: "1px solid #1a2535", borderRadius: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: "#4a6fa5", letterSpacing: 1 }}>{item.label}</span>
                        <span style={{ fontSize: 9, color: "#2a4060", marginLeft: "auto" }}>{timeLabel}</span>
                      </div>
                      {item.sceneTitle && (
                        <div style={{ fontSize: 9, color: isDifferentScene ? "#3a5570" : "#2a4060", marginBottom: 3, fontStyle: "italic" }}>{item.sceneTitle}</div>
                      )}
                      <div style={{
                        fontSize: 11, color: "#8ab0cc", lineHeight: 1.6, marginBottom: 6,
                        ...(isExpanded ? {} : { overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" })
                      } as React.CSSProperties}>
                        {item.content}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {/* YUY-27: 追記先シーンへ移動してから追記 */}
                        <button
                          onClick={() => onInsertHistory(item)}
                          style={{ fontSize: 10, padding: "2px 10px", background: "rgba(42,128,96,0.12)", border: "1px solid #2a6050", color: "#5ab090", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}
                          title={isDifferentScene ? `「${item.sceneTitle}」へ移動して追記` : "現在のシーンに追記"}
                        >
                          {isDifferentScene ? "移動+追記" : "追記"}
                        </button>
                        {/* YUY-26: シーン移動ボタン */}
                        {item.sceneId && (
                          <button
                            onClick={() => onNavigateToScene(item.sceneId!)}
                            style={{ fontSize: 10, padding: "2px 10px", background: "transparent", border: "1px solid #1e2d42", color: isDifferentScene ? "#4a6fa5" : "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}
                            title={`「${item.sceneTitle}」へ移動`}
                          >
                            移動
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpand(item.id)}
                          style={{ fontSize: 10, padding: "2px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {isExpanded ? "閉じる" : "展開"}
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ padding: "8px 0", width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>▶</button>
          {[
            { key: "write", label: "執筆" },
            { key: "structure", label: "構成" },
            { key: "settings", label: "世界観" },
            { key: "prefs", label: "環境" },
            { key: "ai", label: "AI履歴" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => {
              setTab(key as TabKey);
              setSidebarTab(key as SidebarTabKey);
              if (sidebarFloat) setSidebarOpen(false);
            }} style={{
              padding: "14px 0", width: "100%", border: "none",
              borderBottom: "1px solid #0e1520",
              color: tab === key ? "#7ab3e0" : "#2a4060",
              cursor: "pointer", fontSize: 10, fontFamily: "inherit",
              writingMode: "vertical-rl", letterSpacing: 2,
              borderLeft: tab === key ? "2px solid #4a6fa5" : "2px solid transparent",
              background: tab === key ? "rgba(74,111,165,0.08)" : "transparent",
            }}>{label}</button>
          ))}

          {/* 折りたたみ時の簡易履歴表示 */}
          {aiHistory.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 8, color: "#1a2535", writingMode: "vertical-rl", letterSpacing: 1 }}>RECENT AI</div>
              {aiHistory.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setTab("ai");
                    if (sidebarFloat) setSidebarOpen(false);
                    if (!expandedIds.includes(item.id)) toggleExpand(item.id);
                  }}
                  title={`${item.label}: ${item.content.substring(0, 20)}...`}
                  style={{
                    width: 20, height: 20, borderRadius: "50%", background: "#0a0f1a", border: "1px solid #1a2535",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    fontSize: 10, color: "#4a6fa5", fontWeight: "bold"
                  }}
                >
                  {item.label.substring(0, 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
