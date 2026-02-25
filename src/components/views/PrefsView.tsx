import React from "react";
import type { EditorSettings } from "../../types";

interface PrefsViewProps {
  editorSettings: EditorSettings;
  setEditorSettings: React.Dispatch<React.SetStateAction<EditorSettings>>;
}

export const PrefsView: React.FC<PrefsViewProps> = ({
  editorSettings, setEditorSettings
}) => {
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
          <div style={{ fontSize: editorSettings.fontSize, lineHeight: editorSettings.lineHeight, color: "#8ab0cc", fontFamily: "'Noto Serif JP','Georgia',serif" }}>プレビュー：夜明け前の霧の中、自律貨物船が静かに接岸した。</div>
        </div>
      </div>
    </div>
  );
};
