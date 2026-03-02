import React from "react";
import { useStudio } from "../../contexts/StudioContext";

export const ProjectShelfModal: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setShowProjectShelf,
    createProject,
    switchProject,
  } = useStudio();

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
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <button
                key={project.id}
                onClick={() => switchProject(project.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: isActive ? "1px solid #4a6fa5" : "1px solid #1a2535",
                  background: isActive ? "rgba(74,111,165,0.14)" : "#0b111d",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, color: isActive ? "#dce9f7" : "#c8d8e8", fontWeight: 600 }}>
                  {project.title || "無題プロジェクト"}
                  {isActive ? "（編集中）" : ""}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: "#3a5570" }}>
                  更新: {new Date(project.updatedAt).toLocaleString("ja-JP")} ・ シーン数: {project.scenes.length}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
