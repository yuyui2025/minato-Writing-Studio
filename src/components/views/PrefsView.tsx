import React from "react";
import { useStudio } from "../../contexts/StudioContext";

export const PrefsView: React.FC = () => {
  const { editorSettings, setEditorSettings } = useStudio();
  return (
    <div style={{ padding: "24px 32px", overflowY: "auto" }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#7ab3e0", fontWeight: 400, letterSpacing: 2 }}>環境設定</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 360 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#4a6fa5", marginBottom: 10 }}>文字サイズ　<span style={{ color: "#c8d8e8", fontSize: 14 }}>{editorSettings.fontSize}px</span></div>
          <input type="range" min={12} max={24} value={editorSettings.fontSize} onChange={e => setEditorSettings(s => ({ ...s, fontSize: Number(e.target.value) }))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2a4060", marginTop: 4 }}><span>12px</span><span>24px</span></div>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#4a6fa5", marginBottom: 10 }}>行間　<span style={{ color: "#c8d8e8", fontSize: 14 }}>{editorSettings.lineHeight}</span></div>
          <input type="range" min={1.4} max={3.0} step={0.1} value={editorSettings.lineHeight} onChange={e => setEditorSettings(s => ({ ...s, lineHeight: Number(e.target.value) }))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2a4060", marginTop: 4 }}><span>狭い 1.4</span><span>広い 3.0</span></div>
        </div>
        <div style={{ padding: "12px 16px", background: "#070a14", border: "1px solid #1a2535", borderRadius: 6 }}>
          <div style={{ fontSize: editorSettings.fontSize, lineHeight: editorSettings.lineHeight, color: "#8ab0cc", fontFamily: "'Noto Serif JP','Georgia',serif" }}>プレビュー：静かな朝、窓から差し込む光の中でペンを走らせた。</div>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#4a6fa5", marginBottom: 10 }}>テーマ</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["dark", "light", "system"] as const).map(t => (
              <button
                key={t}
                onClick={() => setEditorSettings(s => ({ ...s, colorTheme: t }))}
                style={{
                  flex: 1, padding: "8px 4px",
                  background: (editorSettings.colorTheme ?? "dark") === t ? "rgba(74,111,165,0.2)" : "transparent",
                  border: "1px solid",
                  borderColor: (editorSettings.colorTheme ?? "dark") === t ? "#4a6fa5" : "#1e2d42",
                  color: (editorSettings.colorTheme ?? "dark") === t ? "#7ab3e0" : "#3a5570",
                  cursor: "pointer", fontSize: 12, borderRadius: 4, fontFamily: "inherit",
                }}
              >
                {t === "dark" ? "ダーク" : t === "light" ? "ライト" : "システム"}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#2a4060", marginTop: 6 }}>
            {(editorSettings.colorTheme ?? "dark") === "system" ? "OSの設定に従います" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};
