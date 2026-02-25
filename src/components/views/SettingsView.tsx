import React from "react";
import { AiPanel } from "../ai/AiPanel";
import type { Settings, AiResults, AiLoading } from "../../types";

interface SettingsViewProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  settingsTab: keyof Settings;
  setSettingsTab: (v: keyof Settings) => void;
  aiResults: AiResults;
  setAiResults: React.Dispatch<React.SetStateAction<AiResults>>;
  aiLoading: AiLoading;
  setAiLoading: React.Dispatch<React.SetStateAction<AiLoading>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings, setSettings, settingsTab, setSettingsTab,
  aiResults, setAiResults, aiLoading, setAiLoading
}) => {
  return (
    <div style={{ padding: "24px 32px", overflowY: "auto" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#7ab3e0", fontWeight: 400, letterSpacing: 2 }}>世界観メモ</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["world", "characters", "theme"] as const).map((key) => (
          <button key={key} onClick={() => setSettingsTab(key)} style={{ padding: "6px 16px", borderRadius: 4, border: "1px solid", borderColor: settingsTab === key ? "#4a6fa5" : "#1e2d42", background: settingsTab === key ? "rgba(74,111,165,0.15)" : "transparent", color: settingsTab === key ? "#7ab3e0" : "#3a5570", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            {key === "world" ? "世界観" : key === "characters" ? "キャラクター" : "テーマ"}
          </button>
        ))}
      </div>
      <textarea value={settings[settingsTab]} onChange={e => setSettings({ ...settings, [settingsTab]: e.target.value })} style={{ width: "100%", minHeight: 280, background: "#070a14", border: "1px solid #1a2535", color: "#8ab0cc", fontFamily: "'Noto Serif JP','Georgia',serif", fontSize: 13, lineHeight: 2, padding: "20px 24px", resize: "vertical", outline: "none", borderRadius: 6, boxSizing: "border-box" }} />
      <AiPanel
        label="AIで意味を拡張"
        result={aiResults.worldExpand || ""}
        onResult={t => setAiResults(r => ({ ...r, worldExpand: t }))}
        onLoading={v => setAiLoading(l => ({ ...l, worldExpand: v }))}
        loading={aiLoading.worldExpand}
        prompt={`以下の創作設定メモを読んで、含意・伏線の可能性・派生しうる要素・見落とされがちな矛盾を簡潔に指摘してください。箇条書きで3〜5点。

【${settingsTab === "world" ? "世界観" : settingsTab === "characters" ? "キャラクター" : "テーマ"}】
${settings[settingsTab]}`}
        onAppend={text => setSettings(prev => ({ ...prev, [settingsTab]: prev[settingsTab] + "

---AI拡張---
" + text }))}
      />
    </div>
  );
};
