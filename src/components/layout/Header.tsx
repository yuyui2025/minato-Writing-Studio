import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../supabase";
import { useStudio } from "../../contexts/StudioContext";

export const Header: React.FC = () => {
  const {
    projectTitle, setProjectTitle, editingTitle, setEditingTitle,
    saveStatus, lastSavedTime, scenes, settings, manuscripts,
    saveWithBackup, setShowBackups, setShowExport, setShowImport, setShowProjectShelf,
    user,
  } = useStudio();
  const hasProjectTitle = projectTitle.trim().length > 0;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  return (
    <header style={{ borderBottom: "1px solid #1e2d42", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,14,26,0.95)", position: "sticky", top: 0, zIndex: 100, height: 44 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1, overflow: "hidden" }}>
        {/* アイコン */}
        <button
          onClick={() => setShowProjectShelf(true)}
          title="プロジェクト切替を開く"
          aria-label="プロジェクト切替を開く"
          style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, border: "1px solid #1e2d42", borderRadius: 6, background: "rgba(30,45,66,0.2)", padding: "3px 6px", cursor: "pointer" }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect x="4.5" y="4.5" width="4" height="19" rx="0.8" stroke="#4a6fa5" strokeWidth="1.2"/>
            <rect x="9.8" y="5.4" width="3.6" height="18.1" rx="0.8" stroke="#3d5d8b" strokeWidth="1.2"/>
            <rect x="14.4" y="4.1" width="4.4" height="19.4" rx="0.8" stroke="#5f7fae" strokeWidth="1.2"/>
            <rect x="19.8" y="6" width="3.7" height="17.5" rx="0.8" stroke="#2f4a70" strokeWidth="1.2"/>
            <line x1="3.5" y1="23.5" x2="24.5" y2="23.5" stroke="#1e3050" strokeWidth="1.2"/>
            </svg>
            <div style={{ fontSize: 7, letterSpacing: 1.5, color: "#1e3050", textTransform: "lowercase", whiteSpace: "nowrap" }}>minato ws</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span style={{ fontSize: 9, color: "#6f8db5", letterSpacing: 0.6, whiteSpace: "nowrap" }}>プロジェクト</span>
            <span style={{ fontSize: 11, color: "#9cb5d0", whiteSpace: "nowrap" }}>切替</span>
          </div>
        </button>
        {/* タイトル */}
        {editingTitle ? (
          <input
            autoFocus
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => e.key === "Enter" && setEditingTitle(false)}
            style={{ background: "transparent", border: "none", borderBottom: "1px solid #4a6fa5", color: "#e2eaf4", fontSize: 15, fontWeight: 700, fontFamily: "'Noto Serif JP','Georgia',serif", outline: "none", letterSpacing: 1, width: "100%", maxWidth: 280, minWidth: 0 }}
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
              minWidth: 0,
              minHeight: 22,
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title="クリックで編集"
          >
            {hasProjectTitle ? projectTitle : <span style={{ fontStyle: "italic" }}>タイトル未設定</span>}
          </div>
        )}
      </div>
      <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="header-hide-sm" style={{ fontSize: 10, color: saveStatus === "saved" ? "#2a4060" : saveStatus === "saving" ? "#4a6fa5" : saveStatus === "offline" ? "#8a6b2d" : "#e05555" }}>
          {saveStatus === "saving" ? "保存中…" :
           saveStatus === "offline" ? "☁ オフライン保存" :
           saveStatus === "error" ? "⚠ エラー" :
           lastSavedTime ? `保存: ${lastSavedTime.getHours()}:${String(lastSavedTime.getMinutes()).padStart(2,"0")}` : "✓"}
        </div>
        <button className="header-priority-btn" onClick={() => saveWithBackup(scenes, settings, manuscripts, projectTitle)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #2a4060", background: "rgba(74,111,165,0.1)", color: "#4a6fa5", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>保存</button>
        <button className="header-priority-btn" onClick={() => setShowBackups(true)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>履歴</button>
        <button onClick={() => setShowImport(true)} className="header-hide-sm" style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>取込</button>
        <button onClick={() => setShowExport(true)} className="header-hide-sm" style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>出力</button>
        {/* スマホのみ表示: 補助操作をまとめた「…」メニュー */}
        <div ref={moreRef} className="header-show-sm" style={{ position: "relative" }}>
          <button
            onClick={() => setMoreOpen(v => !v)}
            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 13, fontFamily: "inherit", lineHeight: 1 }}
          >…</button>
          {moreOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#0a0f1a", border: "1px solid #1e2d42", borderRadius: 6, display: "flex", flexDirection: "column", gap: 4, padding: 8, zIndex: 200, minWidth: 80 }}>
              <button onClick={() => { setShowImport(true); setMoreOpen(false); }} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#c8d8e8", cursor: "pointer", fontSize: 12, fontFamily: "inherit", textAlign: "left" }}>取込</button>
              <button onClick={() => { setShowExport(true); setMoreOpen(false); }} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#c8d8e8", cursor: "pointer", fontSize: 12, fontFamily: "inherit", textAlign: "left" }}>出力</button>
              {user ? (
                <button onClick={() => { supabase.auth.signOut(); setMoreOpen(false); }} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#c8d8e8", cursor: "pointer", fontSize: 12, fontFamily: "inherit", textAlign: "left" }}>退出</button>
              ) : (
                <button onClick={() => { supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }); setMoreOpen(false); }} style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #2a4060", background: "rgba(74,111,165,0.1)", color: "#7ab3e0", cursor: "pointer", fontSize: 12, fontFamily: "inherit", textAlign: "left" }}>ログイン</button>
              )}
            </div>
          )}
        </div>
        {user ? (
          <button className="header-hide-sm" onClick={() => supabase.auth.signOut()} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>退出</button>
        ) : (
          <button className="header-hide-sm" onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #2a4060", background: "rgba(74,111,165,0.1)", color: "#4a6fa5", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>ログイン</button>
        )}
      </div>
    </header>
  );
};
