import { Scene } from "../../types";

type ExportModalProps = {
  selectedScene: Scene | null;
  projectTitle: string;
  onExportScene: (fmt: "md" | "txt") => void;
  onExportAll: (fmt: "md" | "txt") => void;
  onClose: () => void;
};

export function ExportModal({
  selectedScene,
  projectTitle,
  onExportScene,
  onExportAll,
  onClose,
}: ExportModalProps) {
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
      <div style={{ background: "#0e1520", border: "1px solid #2a3f58", borderRadius: 8, padding: "28px 32px", maxWidth: 340, width: "90%" }}>
        <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 20, textAlign: "center" }}>出力</div>
        {selectedScene && (
          <>
            <div style={{ fontSize: 11, color: "#3a5570", marginBottom: 10 }}>選択中のシーン：「{selectedScene.title}」</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => onExportScene("md")}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "rgba(74,111,165,0.15)",
                  border: "1px solid #4a6fa5",
                  color: "#7ab3e0",
                  cursor: "pointer",
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              >
                .md
              </button>
              <button
                onClick={() => onExportScene("txt")}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "rgba(74,111,165,0.15)",
                  border: "1px solid #4a6fa5",
                  color: "#7ab3e0",
                  cursor: "pointer",
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              >
                .txt
              </button>
            </div>
          </>
        )}
        <div style={{ fontSize: 11, color: "#3a5570", marginBottom: 10 }}>全シーンまとめて</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => onExportAll("md")}
            style={{
              flex: 1,
              padding: "8px",
              background: "rgba(74,111,165,0.1)",
              border: "1px solid #2a4060",
              color: "#5a8aaa",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            .md
          </button>
          <button
            onClick={() => onExportAll("txt")}
            style={{
              flex: 1,
              padding: "8px",
              background: "rgba(74,111,165,0.1)",
              border: "1px solid #2a4060",
              color: "#5a8aaa",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            .txt
          </button>
        </div>
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
          キャンセル
        </button>
      </div>
    </div>
  );
}
