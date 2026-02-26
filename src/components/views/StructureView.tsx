import React from "react";
import { statusColors, statusLabels } from "../../constants";
import type { Scene, Manuscripts, SceneDraft } from "../../types";

interface StructureViewProps {
  scenes: Scene[];
  manuscripts: Manuscripts;
  addingScene: boolean;
  setAddingScene: (v: boolean) => void;
  newScene: SceneDraft;
  setNewScene: (v: SceneDraft) => void;
  handleAddScene: () => void;
  addingChapter: boolean;
  setAddingChapter: (v: boolean) => void;
  handleSceneSelect: (s: Scene) => void;
  handleMoveScene: (id: number, direction: "up" | "down") => void;
  selectedSceneId: number | null;
}

export const StructureView: React.FC<StructureViewProps> = ({
  scenes, manuscripts, addingScene, setAddingScene,
  newScene, setNewScene, handleAddScene, addingChapter,
  setAddingChapter, handleSceneSelect, handleMoveScene, selectedSceneId
}) => {
  // Group scenes by chapter for tree view
  const chapters = scenes.reduce((acc, scene) => {
    const ch = scene.chapter || "未分類";
    if (!acc[ch]) acc[ch] = [];
    acc[ch].push(scene);
    return acc;
  }, {} as Record<string, Scene[]>);
  const totalChars = Object.values(manuscripts).reduce((a, t) => a + t.replace(/\s/g, "").length, 0);

  return (
    <div style={{ padding: "20px 16px", overflowY: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Object.entries(chapters).map(([chapter, chScenes]) => {
          const chChars = chScenes.reduce((a, s) => a + (manuscripts[s.id] || "").replace(/\s/g, "").length, 0);
          const allDone = chScenes.every(s => s.status === "done");
          const anyDraft = chScenes.some(s => s.status === "draft");
          const chColor = allDone ? statusColors.done : anyDraft ? statusColors.draft : statusColors.empty;
          const isAddingHere = addingScene && newScene.chapter === chapter;
          return (
            <div key={chapter}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #1a2535" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: chColor, boxShadow: `0 0 7px ${chColor}66` }} />
                <span style={{ fontSize: 13, color: "#c8d8e8", fontWeight: 600, flex: 1 }}>{chapter}</span>
                {chChars > 0 && <span style={{ fontSize: 10, color: "#2a4060" }}>{chChars.toLocaleString()}字</span>}
                <button onClick={() => { setNewScene({ chapter, title: "", synopsis: "" }); setAddingScene(true); }} style={{ fontSize: 11, padding: "2px 8px", background: "transparent", border: "1px solid #1e2d42", color: "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>＋</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 16 }}>
                {chScenes.map((scene, i) => (
                  <div key={scene.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
                      <div style={{ width: 1, height: 6, background: i === 0 ? "transparent" : "#1a2535" }} />
                      <div style={{ width: 12, height: 1, background: "#1a2535" }} />
                    </div>
                    <div onClick={() => handleSceneSelect(scene)} style={{ flex: 1, background: selectedSceneId === scene.id ? "rgba(74,111,165,0.1)" : "#0a0f1a", border: "1px solid", borderColor: selectedSceneId === scene.id ? "#4a6fa5" : "#1a2535", borderRadius: 5, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 4, background: statusColors[scene.status], boxShadow: `0 0 5px ${statusColors[scene.status]}66` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#8ab0cc", marginBottom: 2 }}>{scene.title ? scene.title : <span style={{ fontStyle: "italic", color: "#2a4060" }}>無題</span>}</div>
                        {scene.synopsis && <div style={{ fontSize: 11, color: "#2a4060", fontStyle: "italic" }}>{scene.synopsis}</div>}
                        {manuscripts[scene.id] && <div style={{ fontSize: 10, color: "#2a4060", marginTop: 3 }}>{manuscripts[scene.id].replace(/\s/g, "").length.toLocaleString()}字</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMoveScene(scene.id, "up"); }}
                          style={{ padding: "0 4px", background: "transparent", border: "1px solid #1a2535", color: "#3a5570", cursor: "pointer", fontSize: 10, borderRadius: 2 }}
                        >↑</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMoveScene(scene.id, "down"); }}
                          style={{ padding: "0 4px", background: "transparent", border: "1px solid #1a2535", color: "#3a5570", cursor: "pointer", fontSize: 10, borderRadius: 2 }}
                        >↓</button>
                      </div>
                      <span style={{ fontSize: 9, color: statusColors[scene.status], flexShrink: 0, marginTop: 2 }}>{statusLabels[scene.status]}</span>
                    </div>
                  </div>
                ))}
                {isAddingHere && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
                      <div style={{ width: 1, height: 6, background: "#1a2535" }} />
                      <div style={{ width: 12, height: 1, background: "#1a2535" }} />
                    </div>
                    <div style={{ flex: 1, background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 5, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <input autoFocus placeholder="タイトル" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => e.key === "Enter" && handleAddScene()} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#8ab0cc", fontSize: 12, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                      <input placeholder="概要（省略可）" value={newScene.synopsis} onChange={e => setNewScene({ ...newScene, synopsis: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#3a5570", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                        <button onClick={handleAddScene} style={{ padding: "3px 10px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>追加</button>
                        <button onClick={() => setAddingScene(false)} style={{ padding: "3px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>キャンセル</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* New chapter form */}
        {addingChapter ? (
          <div style={{ background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 6, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 2 }}>新しい章</div>
            <input autoFocus placeholder="章名" value={newScene.chapter} onChange={e => setNewScene({ ...newScene, chapter: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#c8d8e8", fontSize: 13, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
            <input placeholder="タイトル" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => e.key === "Enter" && handleAddScene()} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#8ab0cc", fontSize: 12, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
            <input placeholder="概要（省略可）" value={newScene.synopsis} onChange={e => setNewScene({ ...newScene, synopsis: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#3a5570", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              <button onClick={() => { handleAddScene(); setAddingChapter(false); }} style={{ padding: "3px 10px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>追加</button>
              <button onClick={() => { setAddingChapter(false); setNewScene({ chapter: "", title: "", synopsis: "" }); }} style={{ padding: "3px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>キャンセル</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setNewScene({ chapter: "", title: "", synopsis: "" }); setAddingChapter(true); }} style={{ padding: "8px", border: "1px dashed #1e2d42", background: "transparent", color: "#2a4060", cursor: "pointer", fontSize: 11, borderRadius: 5, fontFamily: "inherit" }}>＋ 新しい章を追加</button>
        )}
      </div>
      <div style={{ marginTop: 24, padding: "12px 16px", background: "#0c1220", borderRadius: 6, border: "1px solid #1a2535", display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 11, color: "#3a5570" }}>総文字数</span>
        <span style={{ fontSize: 24, color: "#7ab3e0", fontWeight: 300 }}>{totalChars.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: "#3a5570" }}>文字</span>
      </div>
    </div>
  );
};
