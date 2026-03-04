import React, { useState } from "react";
import { useStudio } from "../../contexts/StudioContext";

export const ProjectShelfModal: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setShowProjectShelf,
    createProject,
    switchProject,
    deleteProject,
    duplicateProject,
    setProjects,
  } = useStudio();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...projects];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setProjects(updated);
    setDragIndex(index);
  };

  const handleDragEnd = () => setDragIndex(null);

  return (
    <div
      onClick={() => setShowProjectShelf(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(5,8,15,0.72)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(760px, 96vw)", maxHeight: "82vh", overflowY: "auto", background: "#0a0f1a", border: "1px solid #1e2d42", borderRadius: 8, padding: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ color: "#c8d8e8", fontWeight: 700 }}>本棚（執筆プロジェクト）</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={createProject} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #2a6050", background: "rgba(42,128,96,0.12)", color: "#5ab090", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>新規作成</button>
            <button onClick={() => setShowProjectShelf(false)} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>閉じる</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projects.map((project, index) => {
            const isActive = project.id === activeProjectId;
            const isConfirming = deleteConfirmId === project.id;
            return (
              <div
                key={project.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: isActive ? "1px solid #4a6fa5" : "1px solid #1a2535",
                  background: isActive ? "rgba(74,111,165,0.14)" : "#0b111d",
                  opacity: dragIndex === index ? 0.5 : 1,
                }}
              >
                {/* ドラッグハンドル */}
                <div style={{ color: "#2a4060", cursor: "grab", fontSize: 16, flexShrink: 0, userSelect: "none", lineHeight: 1 }}>⠿</div>

                {/* プロジェクト情報（クリックで切替） */}
                <button
                  onClick={() => switchProject(project.id)}
                  style={{ flex: 1, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: 0, minWidth: 0 }}
                >
                  <div style={{ fontSize: 13, color: isActive ? "#dce9f7" : "#c8d8e8", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {project.title || "無題プロジェクト"}
                    {isActive ? "（編集中）" : ""}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: "#3a5570" }}>
                    更新: {new Date(project.updatedAt).toLocaleString("ja-JP")} ・ シーン数: {project.scenes.length}
                  </div>
                </button>

                {/* アクションボタン */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => duplicateProject(project.id)}
                    title="複製"
                    style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
                  >複製</button>
                  {isConfirming ? (
                    <>
                      <button
                        onClick={() => { deleteProject(project.id); setDeleteConfirmId(null); }}
                        style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #7a2020", background: "rgba(122,32,32,0.2)", color: "#e07070", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
                      >確認</button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
                      >取消</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(project.id)}
                      title="削除"
                      disabled={projects.length <= 1}
                      style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: projects.length <= 1 ? "#1e2d42" : "#5a3535", cursor: projects.length <= 1 ? "default" : "pointer", fontSize: 11, fontFamily: "inherit" }}
                    >削除</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
