import { Scene } from "../../types";

type DeleteConfirmModalProps = {
  scene: Scene | undefined;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmModal({ scene, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!scene) return null;

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
      <div
        style={{
          background: "#0e1520",
          border: "1px solid #2a3f58",
          borderRadius: 8,
          padding: "28px 32px",
          maxWidth: 320,
          width: "90%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 8 }}>削除の確認</div>
        <div style={{ fontSize: 15, color: "#c8d8e8", marginBottom: 6 }}>「{scene.title}」</div>
        <div style={{ fontSize: 12, color: "#3a5570", marginBottom: 24 }}>この操作は取り消せません。</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "7px 20px",
              background: "transparent",
              border: "1px solid #1e2d42",
              color: "#4a6fa5",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "7px 20px",
              background: "rgba(180,40,40,0.2)",
              border: "1px solid #7a2020",
              color: "#e08080",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
