import React from "react";
import { useStudio } from "../../contexts/StudioContext";
import { useUserProfile } from "../../hooks/useUserProfile";

/**
 * YUY-71: 非動画バナー広告
 * 表示条件: plan=free かつ write/verticalPreview 以外の画面
 * BYOK モード時は非表示
 */
export const AdBanner: React.FC = () => {
  const { tab, verticalPreview, aiMode } = useStudio();
  const profile = useUserProfile();

  // 非表示条件
  if (tab === "write") return null;
  if (verticalPreview) return null;
  if (aiMode === "byok_local" || aiMode === "byok_cloud") return null;
  if (profile && profile.plan !== "free") return null;

  // 表示対象タブ: structure, settings, prefs
  if (!["structure", "settings", "prefs"].includes(tab)) return null;

  return (
    <div
      style={{
        padding: "8px 16px",
        background: "#070a14",
        borderTop: "1px solid #1a2535",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 10, color: "#2a4060", flexShrink: 0 }}>広告</div>
      {/* 広告スロット: 静的バナーを配置する場所 */}
      <div
        style={{
          flex: 1,
          height: 36,
          background: "#0d1520",
          border: "1px dashed #1a2535",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#1e2d42",
        }}
      >
        {/* TODO: 実際の広告タグをここに挿入 */}
        広告スロット
      </div>
    </div>
  );
};
