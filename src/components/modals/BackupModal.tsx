import { useRef, useState } from "react";
import { Scene, Settings, Manuscripts, Backup } from "../../types";

type BackupModalProps = {
  backups: Backup[];
  autoBackups: Backup[];
  _scenes: Scene[];
  _settings: Settings;
  _manuscripts: Manuscripts;
  onRestore: (scenes: Scene[], manuscripts: Manuscripts, settings?: Settings, projectTitle?: string) => void;
  onSaveBackup: (label: string | null) => void;
  onClose: () => void;
};

export function BackupModal({
  backups,
  autoBackups,
  _scenes,
  _settings,
  _manuscripts,
  onRestore,
  onSaveBackup,
  onClose,
}: BackupModalProps) {
  const backupLabelRef = useRef<HTMLInputElement>(null);
  const [track, setTrack] = useState<"manual" | "auto">("manual");

  const list = track === "manual" ? backups : autoBackups;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ background: "#0e1520", border: "1px solid #2a3f58", borderRadius: 8, padding: "24px 28px", maxWidth: 420, width: "90%" }}>
        <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 14, textAlign: "center" }}>バージョン履歴</div>

        {/* トラック切り替え */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(["manual", "auto"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              style={{
                flex: 1, padding: "5px", background: track === t ? "rgba(74,111,165,0.2)" : "transparent",
                border: "1px solid", borderColor: track === t ? "#4a6fa5" : "#1e2d42",
                color: track === t ? "#7ab3e0" : "#3a5570",
                cursor: "pointer", borderRadius: 4, fontSize: 11, fontFamily: "inherit",
              }}
            >
              {t === "manual" ? "手動（5件）" : "自動（5件）"}
            </button>
          ))}
        </div>

        {/* 手動トラックのみ「記録」ボタンを表示 */}
        {track === "manual" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              ref={backupLabelRef}
              placeholder="バージョン名（省略可）"
              style={{
                flex: 1,
                background: "#070a14",
                border: "1px solid #1e2d42",
                color: "#8ab0cc",
                padding: "5px 10px",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={() => {
                const label = backupLabelRef.current?.value || null;
                onSaveBackup(label);
                if (backupLabelRef.current) backupLabelRef.current.value = "";
              }}
              style={{
                padding: "5px 14px",
                background: "rgba(74,111,165,0.2)",
                border: "1px solid #4a6fa5",
                color: "#7ab3e0",
                cursor: "pointer",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "inherit",
              }}
            >
              記録
            </button>
          </div>
        )}
        {track === "auto" && (
          <div style={{ fontSize: 10, color: "#2a4060", marginBottom: 14, textAlign: "center" }}>10分ごとに自動記録（最新5件）</div>
        )}

        {list.length === 0 ? (
          <div style={{ fontSize: 12, color: "#3a5570", textAlign: "center", marginBottom: 20 }}>まだバックアップがありません</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {list.map((bk, i) => {
              const d = new Date(bk.timestamp);
              const timeLabel = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
              const charCount = Object.values(bk.manuscripts || {}).reduce((a, t) => a + t.replace(/\s/g, "").length, 0);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "#070a14",
                    border: "1px solid #1a2535",
                    borderRadius: 5,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#8ab0cc" }}>
                      {bk.label ? <span style={{ color: "#c8d8e8", marginRight: 6 }}>{bk.label}</span> : null}
                      <span style={{ color: "#3a5570" }}>{timeLabel}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#2a4060", marginTop: 2 }}>
                      {bk.scenes?.length || 0} シーン・{charCount.toLocaleString()} 文字
                    </div>
                  </div>
                  <button
                    onClick={() => onRestore(bk.scenes || [], bk.manuscripts || {}, bk.settings, bk.projectTitle)}
                    style={{
                      padding: "4px 12px",
                      background: "rgba(74,111,165,0.15)",
                      border: "1px solid #4a6fa5",
                      color: "#7ab3e0",
                      cursor: "pointer",
                      borderRadius: 3,
                      fontSize: 11,
                      fontFamily: "inherit",
                    }}
                  >
                    復元
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "7px",
            background: "transparent",
            border: "1px solid #1e2d42",
            color: "#3a5570",
            cursor: "pointer",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "inherit",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
