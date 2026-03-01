import { useRef, useState, useCallback } from "react";
import { useStudioStore } from "../../stores/useStudioStore";
import { parseDocument } from "../../utils/textAnalyzer";
import { extractImportMetadata } from "../../utils/importExtractor";
import type { ImportData, ParsedSection } from "../../types";

type Step = "pick" | "analyzing" | "preview";

const BTN: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
};

const TEXTAREA: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #2a3f58",
  borderRadius: 4,
  color: "#a8cce0",
  fontSize: 12,
  fontFamily: "inherit",
  padding: "8px",
  resize: "vertical",
  boxSizing: "border-box",
};

export function ImportModal() {
  const store = useStudioStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview state
  const [projectTitle, setProjectTitle] = useState("");
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [characters, setCharacters] = useState("");
  const [world, setWorld] = useState("");

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(md|txt)$/i)) {
      setError(".md または .txt ファイルを選択してください");
      return;
    }
    setError(null);
    setStep("analyzing");

    const text = await file.text();

    const [parsed, aiResult] = await Promise.all([
      parseDocument(text),
      extractImportMetadata(text),
    ]);

    const detectedTitle = parsed?.title || file.name.replace(/\.(md|txt)$/i, "");
    const detectedSections = parsed?.sections ?? [{ chapter: "", title: "", content: text }];

    setProjectTitle(detectedTitle);
    setSections(detectedSections);
    setCharacters(aiResult?.characters ?? "");
    setWorld(aiResult?.world ?? "");
    setStep("preview");
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = useCallback(async () => {
    const now = Date.now();
    const scenes = sections.map((s, i) => ({
      id: now + i,
      chapter: s.chapter || "第一章",
      title: s.title || `シーン${i + 1}`,
      synopsis: "",
      status: "draft" as const,
    }));
    const manuscripts: Record<number, string> = {};
    scenes.forEach((sc, i) => {
      manuscripts[sc.id] = sections[i].content;
    });
    const data: ImportData = {
      scenes,
      manuscripts,
      settings: { characters, world },
      projectTitle: projectTitle || undefined,
    };
    await store.importProject(data);
  }, [sections, characters, world, projectTitle, store]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
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
          width: "min(560px, 94vw)",
          maxHeight: "88vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 20, textAlign: "center" }}>
          ファイルインポート
        </div>

        {/* ── Step 1: Pick ── */}
        {step === "pick" && (
          <>
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: `2px dashed ${dragging ? "#7ab3e0" : "#2a3f58"}`,
                borderRadius: 6,
                padding: "36px 24px",
                cursor: "pointer",
                color: dragging ? "#7ab3e0" : "#3a5570",
                fontSize: 13,
                marginBottom: 20,
                transition: "border-color 0.15s, color 0.15s",
              }}
            >
              <span style={{ fontSize: 28 }}>↑</span>
              <span>.md / .txt をドロップ、またはクリックして選択</span>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </label>
            {error && (
              <div style={{ color: "#e07a7a", fontSize: 12, marginBottom: 16, textAlign: "center" }}>
                {error}
              </div>
            )}
            <button
              onClick={() => store.setShowImport(false)}
              style={{ ...BTN, width: "100%", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570" }}
            >
              キャンセル
            </button>
          </>
        )}

        {/* ── Step 2: Analyzing ── */}
        {step === "analyzing" && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#5a8aaa", fontSize: 13 }}>
            <div style={{ marginBottom: 12 }}>⟳ Rust でシーン構造を解析中…</div>
            <div>⟳ AI でキャラ・世界観を抽出中…</div>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {step === "preview" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#5a8aaa", display: "block", marginBottom: 4 }}>
                プロジェクト名
              </label>
              <input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                style={{
                  ...TEXTAREA,
                  minHeight: "unset",
                  height: 32,
                  resize: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#5a8aaa", marginBottom: 8 }}>
                検出シーン（{sections.length} 件）
              </div>
              <div
                style={{
                  border: "1px solid #1e2d42",
                  borderRadius: 4,
                  maxHeight: 160,
                  overflowY: "auto",
                }}
              >
                {sections.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "7px 10px",
                      borderBottom: i < sections.length - 1 ? "1px solid #1a2535" : "none",
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: "#4a7090" }}>
                      {s.chapter ? `${s.chapter} / ` : ""}
                    </span>
                    <span style={{ color: "#7ab3e0" }}>
                      {s.title || `（タイトルなし）`}
                    </span>
                    <span style={{ color: "#3a5570", marginLeft: 8 }}>
                      {s.content.slice(0, 40).replace(/\n/g, " ")}
                      {s.content.length > 40 ? "…" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#5a8aaa", display: "block", marginBottom: 4 }}>
                キャラクター（AI 抽出・編集可）
              </label>
              <textarea
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="（抽出できませんでした。手入力してください）"
                style={TEXTAREA}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: "#5a8aaa", display: "block", marginBottom: 4 }}>
                世界観（AI 抽出・編集可）
              </label>
              <textarea
                value={world}
                onChange={(e) => setWorld(e.target.value)}
                placeholder="（抽出できませんでした。手入力してください）"
                style={TEXTAREA}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => store.setShowImport(false)}
                style={{
                  ...BTN,
                  flex: 1,
                  background: "transparent",
                  border: "1px solid #1e2d42",
                  color: "#3a5570",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleImport}
                style={{
                  ...BTN,
                  flex: 2,
                  background: "rgba(74,111,165,0.2)",
                  border: "1px solid #4a6fa5",
                  color: "#7ab3e0",
                }}
              >
                インポート実行
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 10, color: "#2a3f58", textAlign: "center" }}>
              現在のデータはインポート前にバックアップされます
            </div>
          </>
        )}
      </div>
    </div>
  );
}
