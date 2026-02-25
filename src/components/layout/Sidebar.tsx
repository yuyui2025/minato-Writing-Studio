import React from "react";
import { statusColors } from "../../constants";
import type {
  Scene, Manuscripts, SceneDraft, Settings, EditorSettings, TabKey
} from "../../types";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  sidebarFloat: boolean;
  setSidebarFloat: (v: boolean) => void;
  sidebarTab: TabKey;
  setSidebarTab: (v: TabKey) => void;
  tab: TabKey;
  setTab: (v: TabKey) => void;
  scenes: Scene[];
  selectedSceneId: number | null;
  manuscripts: Manuscripts;
  sceneSearch: string;
  setSceneSearch: (v: string) => void;
  newScene: SceneDraft;
  setNewScene: (v: SceneDraft) => void;
  addingScene: boolean;
  setAddingScene: (v: boolean) => void;
  addingChapter: boolean;
  setAddingChapter: (v: boolean) => void;
  settings: Settings;
  setSettings: (v: Settings) => void;
  editorSettings: EditorSettings;
  setEditorSettings: React.Dispatch<React.SetStateAction<EditorSettings>>;
  handleSceneSelect: (s: Scene) => void;
  handleAddScene: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen, setSidebarOpen, sidebarFloat, setSidebarFloat,
  sidebarTab, setSidebarTab, tab, setTab, scenes, selectedSceneId,
  manuscripts, sceneSearch, setSceneSearch, newScene, setNewScene,
  addingScene, setAddingScene, addingChapter, setAddingChapter,
  settings, setSettings, editorSettings, setEditorSettings,
  handleSceneSelect, handleAddScene
}) => {
  return (
    <aside style={{
      width: sidebarOpen ? 220 : 36,
      borderRight: "1px solid #1e2d42",
      background: "#080c16",
      overflowY: sidebarOpen ? "auto" : "hidden",
      flexShrink: 0,
      transition: "width 0.2s ease",
      display: "flex", flexDirection: "column",
      ...(sidebarOpen && sidebarFloat ? {
        position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 51, width: 220, boxShadow: "4px 0 20px rgba(0,0,0,0.6)"
      } : {}),
    }}>
      {sidebarOpen ? (
        <>
          {/* Sidebar header: tabs + close */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e2d42", flexShrink: 0 }}>
            {[["write","執筆"],["structure","構成"],["settings","世界観"],["prefs","環境"]].map(([key, label]) => (
              <button key={key} onClick={() => setSidebarTab(key as TabKey)} style={{
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

          {/* Sidebar content: 構成 = chapter tree */}
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
                  return (
                    <div key={chapter}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #1a2535" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: chColor, boxShadow: `0 0 5px ${chColor}66` }} />
                        <span style={{ fontSize: 11, color: "#c8d8e8", fontWeight: 600, flex: 1 }}>{chapter || "未分類"}</span>
                        <button onClick={() => { setNewScene({ chapter, title: "", synopsis: "" }); setAddingScene(true); }} style={{ fontSize: 10, padding: "1px 6px", background: "transparent", border: "1px solid #1e2d42", color: "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>＋</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 10 }}>
                        {chScenes.map(scene => (
                          <div key={scene.id} onClick={() => handleSceneSelect(scene)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 4, cursor: "pointer", background: selectedSceneId === scene.id ? "rgba(74,111,165,0.1)" : "transparent", border: "1px solid", borderColor: selectedSceneId === scene.id ? "#4a6fa5" : "transparent" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: statusColors[scene.status] }} />
                            <span style={{ fontSize: 11, color: "#8ab0cc", flex: 1 }}>{scene.title ? scene.title : <span style={{ color: "#2a4060", fontStyle: "italic" }}>無題</span>}</span>
                          </div>
                        ))}
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
              {[["world","世界観"],["characters","キャラクター"],["theme","テーマ"]].map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 4 }}>{label}</div>
                  <textarea value={settings[key as keyof Settings]} onChange={e => setSettings({ ...settings, [key]: e.target.value })} style={{ width: "100%", minHeight: 80, background: "#070a14", border: "1px solid #1a2535", color: "#8ab0cc", fontFamily: "inherit", fontSize: 11, lineHeight: 1.8, padding: "6px 8px", resize: "vertical", outline: "none", borderRadius: 4, boxSizing: "border-box" }} />
                </div>
              ))}
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
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as TabKey)} style={{
              padding: "14px 0", width: "100%", border: "none",
              borderBottom: "1px solid #0e1520",
              color: tab === key ? "#7ab3e0" : "#2a4060",
              cursor: "pointer", fontSize: 10, fontFamily: "inherit",
              writingMode: "vertical-rl", letterSpacing: 2,
              borderLeft: tab === key ? "2px solid #4a6fa5" : "2px solid transparent",
              background: tab === key ? "rgba(74,111,165,0.08)" : "transparent",
            }}>{label}</button>
          ))}
        </div>
      )}
    </aside>
  );
};
