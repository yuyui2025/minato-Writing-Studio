import React from "react";
import { supabase } from "../../supabase";
import type { Scene, Settings, Manuscripts, SaveStatus } from "../../types";

interface HeaderProps {
  projectTitle: string;
  setProjectTitle: (v: string) => void;
  editingTitle: boolean;
  setEditingTitle: (v: boolean) => void;
  saveStatus: SaveStatus;
  lastSavedTime: Date | null;
  scenes: Scene[];
  settings: Settings;
  manuscripts: Manuscripts;
  saveWithBackup: (sc: Scene[], st: Settings, ms: Manuscripts, pt: string) => void;
  setShowBackups: (v: boolean) => void;
  setShowExport: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle, setProjectTitle, editingTitle, setEditingTitle,
  saveStatus, lastSavedTime, scenes, settings, manuscripts,
  saveWithBackup, setShowBackups, setShowExport
}) => {
  const hasProjectTitle = projectTitle.trim().length > 0;

  return (
    <header style={{ borderBottom: "1px solid #1e2d42", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,14,26,0.95)", position: "sticky", top: 0, zIndex: 100, height: 44 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* アイコン */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="#1e3050" strokeWidth="1.5"/>
            <line x1="8" y1="9" x2="20" y2="9" stroke="#2a4060" strokeWidth="1.2"/>
            <line x1="8" y1="13" x2="20" y2="13" stroke="#2a4060" strokeWidth="1.2"/>
            <line x1="8" y1="17" x2="16" y2="17" stroke="#1e3050" strokeWidth="1.2"/>
            <circle cx="22" cy="22" r="5" fill="#0a0e1a" stroke="#4a6fa5" strokeWidth="1"/>
            <line x1="20" y1="22" x2="24" y2="22" stroke="#4a6fa5" strokeWidth="1"/>
            <line x1="22" y1="20" x2="22" y2="24" stroke="#4a6fa5" strokeWidth="1"/>
          </svg>
          <div style={{ fontSize: 7, letterSpacing: 1.5, color: "#1e3050", textTransform: "lowercase", whiteSpace: "nowrap" }}>minato ws</div>
        </div>
        {/* タイトル */}
        {editingTitle ? (
          <input
            autoFocus
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => e.key === "Enter" && setEditingTitle(false)}
            style={{ background: "transparent", border: "none", borderBottom: "1px solid #4a6fa5", color: "#e2eaf4", fontSize: 15, fontWeight: 700, fontFamily: "'Noto Serif JP','Georgia',serif", outline: "none", letterSpacing: 1, width: 280 }}
          />
        ) : (
          <div
            onClick={() => setEditingTitle(true)}
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: hasProjectTitle ? "#c8d8e8" : "#3a5570",
              letterSpacing: 1,
              cursor: "text",
              fontFamily: "'Noto Serif JP','Georgia',serif",
              minWidth: 120,
              minHeight: 22,
              display: "flex",
              alignItems: "center",
            }}
            title="クリックで編集"
          >
            {hasProjectTitle ? projectTitle : <span style={{ fontStyle: "italic" }}>タイトル未設定</span>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 10, color: saveStatus === "saved" ? "#2a4060" : saveStatus === "saving" ? "#4a6fa5" : saveStatus === "offline" ? "#8a6b2d" : "#e05555" }}>
          {saveStatus === "saving" ? "保存中…" : 
           saveStatus === "offline" ? "☁ オフライン保存" :
           saveStatus === "error" ? "⚠ エラー" : 
           lastSavedTime ? `保存: ${lastSavedTime.getHours()}:${String(lastSavedTime.getMinutes()).padStart(2,"0")}` : "✓"}
        </div>
        <button onClick={() => saveWithBackup(scenes, settings, manuscripts, projectTitle)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #2a4060", background: "rgba(74,111,165,0.1)", color: "#4a6fa5", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>保存</button>
        <button onClick={() => setShowBackups(true)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>履歴</button>
        <button onClick={() => setShowExport(true)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>出力</button>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>退出</button>
      </div>
    </header>
  );
};
