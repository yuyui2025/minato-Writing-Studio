type ExportContentModalProps = {
  content: string;
  onClose: () => void;
};

export function ExportContentModal({ content, onClose }: ExportContentModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 1000,
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
          padding: "24px 28px",
          width: "80%",
          maxWidth: 600,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 12 }}>
          出力テキスト <span style={{ fontSize: 11, color: "#3a5570" }}>— コピーして使用してください</span>
        </div>
        <textarea
          readOnly
          value={content}
          style={{
            flex: 1,
            minHeight: 300,
            background: "#070a14",
            border: "1px solid #1a2535",
            color: "#c8d8e8",
            fontFamily: "inherit",
            fontSize: 12,
            lineHeight: 1.8,
            padding: "10px",
            resize: "none",
            outline: "none",
            borderRadius: 4,
          }}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: "8px",
              background: "rgba(74,111,165,0.2)",
              border: "1px solid #4a6fa5",
              color: "#7ab3e0",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            クリップボードにコピー
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
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
    </div>
  );
}
