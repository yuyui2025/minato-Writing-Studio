import { useRef, useState, useCallback } from "react";
import { useStudioStore } from "../../stores/useStudioStore";
import { parseDocument } from "../../utils/textAnalyzer";
import { extractImportMetadataBySections } from "../../utils/importExtractor";
import type { ImportData, ParsedSection, ProjectFile } from "../../types";

type Step = "pick" | "analyzing" | "preview";
type ImportMode = "new" | "append" | "replace";

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

/** Uint8Array をエンコード自動検出してデコードする */
function decodeBuffer(uint8: Uint8Array): string {
  if (uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
    return new TextDecoder("utf-8").decode(uint8);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(uint8);
  } catch {
    return new TextDecoder("shift-jis").decode(uint8);
  }
}

const PROJECT_FILE_RE = /\.minato-project(?:\s*\(\d+\))?\.json$/i;

function stripProjectFileSuffix(filename: string): string {
  return filename.replace(PROJECT_FILE_RE, "");
}

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
  const [importMode, setImportMode] = useState<ImportMode>("new");
  const [projectFileData, setProjectFileData] = useState<ProjectFile | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const isZip = /\.zip$/i.test(file.name);
    const isText = /\.(md|txt)$/i.test(file.name);
    const isProjectFile = PROJECT_FILE_RE.test(file.name);
    if (!isZip && !isText && !isProjectFile) {
      setError(".md / .txt / .zip / .minato-project.json ファイルを選択してください");
      return;
    }
    setError(null);
    setStep("analyzing");

    if (isProjectFile) {
      const raw = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        setError("プロジェクトファイルの JSON 解析に失敗しました");
        setStep("pick");
        return;
      }
      const candidate = parsed as Partial<ProjectFile>;
      if (candidate.format !== "minato-project" || candidate.version !== 1 || !candidate.project) {
        setError("対応していないプロジェクトファイル形式です");
        setStep("pick");
        return;
      }
      const pf = candidate as ProjectFile;
      setProjectFileData(pf);
      setProjectTitle(pf.project.title || stripProjectFileSuffix(file.name));
      setSections(pf.project.scenes.map((scene) => ({
        chapter: scene.chapter || "",
        title: scene.title || "",
        content: pf.project.manuscripts[scene.id] || "",
      })));
      setCharacters(pf.project.settings?.characters || "");
      setWorld(pf.project.settings?.world || "");
      setStep("preview");
      return;
    }

    let combinedText: string;
    let titleFromFile: string;

    if (isZip) {
      // YUY-43: zip 展開
      const buffer = await file.arrayBuffer();
      const { unzipSync } = await import("fflate");
      let unzipped: Record<string, Uint8Array>;
      try {
        unzipped = unzipSync(new Uint8Array(buffer));
      } catch {
        setError("zip ファイルの展開に失敗しました");
        setStep("pick");
        return;
      }
      const textFiles = Object.entries(unzipped)
        .filter(([name]) => /\.(md|txt)$/i.test(name) && !name.includes("__MACOSX"))
        .sort(([a], [b]) => a.localeCompare(b, "ja"));
      if (textFiles.length === 0) {
        setError("zip 内に .md / .txt ファイルが見つかりませんでした");
        setStep("pick");
        return;
      }
      combinedText = textFiles.map(([, data]) => decodeBuffer(data)).join("\n\n");
      titleFromFile = file.name.replace(/\.zip$/i, "");
    } else {
      const buffer = await file.arrayBuffer();
      combinedText = decodeBuffer(new Uint8Array(buffer));
      titleFromFile = file.name.replace(/\.(md|txt)$/i, "");
    }

    const parsed = await parseDocument(combinedText);
    const aiResult = await extractImportMetadataBySections(
      parsed?.sections ?? [],
      combinedText
    );

    setProjectFileData(null);
    setProjectTitle(parsed?.title || titleFromFile);
    setSections(parsed?.sections ?? [{ chapter: "", title: "", content: combinedText }]);
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
    if (projectFileData) {
      store.importProjectFile(projectFileData);
      return;
    }

    const now = Date.now();
    const scenes = sections.map((s, i) => ({
      id: now + i,
      chapter: s.chapter || "第一章",
      title: s.title || `シーン${i + 1}`,
      synopsis: "",
      status: "draft" as const,
    }));
    const manuscripts: Record<number, string> = {};
    scenes.forEach((sc, i) => { manuscripts[sc.id] = sections[i].content; });
    const data: ImportData = {
      scenes,
      manuscripts,
      settings: { characters, world },
      projectTitle: projectTitle || undefined,
    };
    if (importMode === "new") {
      store.createProjectFromImport(data);
    } else if (importMode === "append") {
      await store.appendToProject(data);
    } else {
      await store.importProject(data);
    }
  }, [sections, characters, world, projectTitle, importMode, projectFileData, store]);

  const IMPORT_MODES: { mode: ImportMode; label: string; desc: string }[] = [
    { mode: "new", label: "新規プロジェクト", desc: "現在のプロジェクトを残したまま新しいプロジェクトを作成します" },
    { mode: "append", label: "現在に追加", desc: "現在のプロジェクトの末尾にシーンを追加します（設定は変更しません）" },
    { mode: "replace", label: "現在を置き換え", desc: "現在のプロジェクトを置き換えます（バックアップ自動生成）" },
  ];

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
              <span>.md / .txt / .zip / .minato-project.json をドロップ、またはクリックして選択</span>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt,.zip,.json"
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
            {/* YUY-38: インポートモード選択 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#5a8aaa", display: "block", marginBottom: 6 }}>
                インポート方法
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {!projectFileData && IMPORT_MODES.map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => setImportMode(mode)}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      background: importMode === mode ? "rgba(74,111,165,0.2)" : "transparent",
                      border: `1px solid ${importMode === mode ? "#4a6fa5" : "#2a3f58"}`,
                      color: importMode === mode ? "#7ab3e0" : "#4a6080",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 11,
                      fontFamily: "inherit",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {!projectFileData && (
                <div style={{ marginTop: 4, fontSize: 10, color: "#3a5070" }}>
                  {IMPORT_MODES.find(m => m.mode === importMode)?.desc}
                </div>
              )}
              {projectFileData && (
                <div style={{ marginTop: 4, fontSize: 10, color: "#5a8aaa" }}>
                  プロジェクトファイルは新規プロジェクトとして読み込みます。
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#5a8aaa", display: "block", marginBottom: 4 }}>
                {importMode === "new" ? "新規プロジェクト名" : "プロジェクト名（参考）"}
              </label>
              <input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                style={{ ...TEXTAREA, minHeight: "unset", height: 32, resize: "none" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#5a8aaa", marginBottom: 8 }}>
                検出シーン（{sections.length} 件）
              </div>
              <div style={{ border: "1px solid #1e2d42", borderRadius: 4, maxHeight: 160, overflowY: "auto" }}>
                {sections.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "7px 10px",
                      borderBottom: i < sections.length - 1 ? "1px solid #1a2535" : "none",
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: "#4a7090" }}>{s.chapter ? `${s.chapter} / ` : ""}</span>
                    <span style={{ color: "#7ab3e0" }}>{s.title || "（タイトルなし）"}</span>
                    <span style={{ color: "#3a5570", marginLeft: 8 }}>
                      {s.content.slice(0, 40).replace(/\n/g, " ")}
                      {s.content.length > 40 ? "…" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {importMode !== "append" && !projectFileData && (
              <>
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
              </>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => store.setShowImport(false)}
                style={{ ...BTN, flex: 1, background: "transparent", border: "1px solid #1e2d42", color: "#3a5570" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleImport}
                style={{ ...BTN, flex: 2, background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0" }}
              >
                インポート実行
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 10, color: "#2a3f58", textAlign: "center" }}>
              {projectFileData && "現在のプロジェクトは保持され、インポートしたプロジェクトへ切り替わります"}
              {!projectFileData && importMode === "replace" && "現在のデータはインポート前にバックアップされます"}
              {!projectFileData && importMode === "append" && "現在のシーンの末尾に追加されます"}
              {!projectFileData && importMode === "new" && "現在のプロジェクトはそのまま保持されます"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
