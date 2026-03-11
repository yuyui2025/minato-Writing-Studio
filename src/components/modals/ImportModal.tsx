import { useRef, useState, useCallback } from "react";
import { useStudioStore } from "../../stores/useStudioStore";
import { parseDocument } from "../../utils/textAnalyzer";
import { extractImportMetadataBySections } from "../../utils/importExtractor";
import type { ImportData, ParsedSection, ProjectFile } from "../../types";

type Step = "pick" | "mode" | "analyzing" | "preview";
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
const PROJECT_GZ_RE = /(?:\.minato-project)?(?:\s*\(\d+\))?\.gz$/i;

function stripProjectFileSuffix(filename: string): string {
  return filename.replace(PROJECT_FILE_RE, "").replace(PROJECT_GZ_RE, "");
}

async function parseImportedText(text: string): Promise<{ title: string; sections: ParsedSection[] }> {
  const parsed = await parseDocument(text);
  if (parsed?.sections?.length) {
    return {
      title: parsed.title || "",
      sections: parsed.sections,
    };
  }
  return {
    title: "",
    sections: [{ chapter: "", title: "", content: text }],
  };
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
  // YUY-51: ファイル選択後、モード確定前に保持しておく
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const analyzeFile = useCallback(async (file: File, mode: ImportMode) => {
    const isZip = /\.zip$/i.test(file.name);
    setStep("analyzing");

    let combinedText: string;
    let titleFromFile: string;
    let parsedSections: ParsedSection[] = [];
    let detectedTitle = "";

    if (/\.zip$/i.test(file.name)) {
      // YUY-43: zip 展開
      const buffer = await file.arrayBuffer();
      const { unzipSync } = await import("fflate");
      let unzipped: Record<string, Uint8Array>;
      try {
        unzipped = unzipSync(new Uint8Array(buffer));
      } catch {
        setError("zip ファイルの展開に失敗しました");
        setStep("mode");
        return;
      }
      const textFiles = Object.entries(unzipped)
        .filter(([name]) => /\.(md|txt)$/i.test(name) && !name.includes("__MACOSX"))
        .sort(([a], [b]) => a.localeCompare(b, "ja"));
      if (textFiles.length === 0) {
        setError("zip 内に .md / .txt ファイルが見つかりませんでした");
        setStep("mode");
        return;
      }
      const decodedFiles = textFiles.map(([name, data]) => ({
        name,
        text: decodeBuffer(data),
      }));
      combinedText = decodedFiles.map(({ text }) => text).join("\n\n---\n\n");
      const parsedByFile = await Promise.all(
        decodedFiles.map(async ({ name, text }) => {
          const parsed = await parseImportedText(text);
          const fallbackLabel = stripProjectFileSuffix(name);
          const shouldUseFileLabel =
            parsed.sections.length === 1 &&
            !parsed.sections[0]?.chapter &&
            !parsed.sections[0]?.title;
          return parsed.sections.map((section) => ({
            chapter: shouldUseFileLabel ? fallbackLabel : section.chapter,
            title: section.title,
            content: section.content,
          }));
        })
      );
      parsedSections = parsedByFile.flat();
      titleFromFile = file.name.replace(/\.zip$/i, "");
    } else {
      const buffer = await file.arrayBuffer();
      combinedText = decodeBuffer(new Uint8Array(buffer));
      titleFromFile = file.name.replace(/\.(md|txt)$/i, "");
      const parsed = await parseImportedText(combinedText);
      detectedTitle = parsed.title;
      parsedSections = parsed.sections;
    }

    void isZip; // suppress unused warning

    // appendモードはAI抽出をスキップしてトークン節約
    let aiResult: { characters?: string; world?: string } | null = null;
    if (mode !== "append") {
      aiResult = await extractImportMetadataBySections(
        parsedSections,
        combinedText
      );
    }

    setProjectFileData(null);
    setProjectTitle(detectedTitle || titleFromFile);
    setSections(parsedSections);
    setCharacters(aiResult?.characters ?? "");
    setWorld(aiResult?.world ?? "");
    setStep("preview");
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const isZip = /\.zip$/i.test(file.name);
    const isText = /\.(md|txt)$/i.test(file.name);
    const isProjectFile = PROJECT_FILE_RE.test(file.name);
    const isGzProjectFile = PROJECT_GZ_RE.test(file.name);
    if (!isZip && !isText && !isProjectFile && !isGzProjectFile) {
      setError(".md / .txt / .zip / .gz / .minato-project.json ファイルを選択してください");
      return;
    }
    setError(null);

    // プロジェクトファイル（.gz / .minato-project.json）は3択不要でそのまま読み込む
    if (isProjectFile || isGzProjectFile) {
      setStep("analyzing");
      let raw: string;
      try {
        if (isGzProjectFile) {
          const { gunzipSync } = await import("fflate");
          const buffer = await file.arrayBuffer();
          const decompressed = gunzipSync(new Uint8Array(buffer));
          raw = new TextDecoder().decode(decompressed);
        } else {
          raw = await file.text();
        }
      } catch {
        setError("ファイルの読み込みに失敗しました");
        setStep("pick");
        return;
      }
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

    // テキスト/ZIPはまず3択を選ばせてから解析
    setPendingFile(file);
    setStep("mode");
  }, []);

  const handleModeConfirm = useCallback(() => {
    if (!pendingFile) return;
    analyzeFile(pendingFile, importMode);
  }, [pendingFile, importMode, analyzeFile]);

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
    { mode: "append", label: "現在に追加", desc: "現在のプロジェクトの末尾にシーンを追加します（AI抽出・設定変更なし）" },
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
              <span>.md / .txt / .zip / .gz をドロップ、またはクリックして選択</span>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt,.zip,.gz,.json"
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

        {/* ── Step 2: Mode selection (YUY-51) ── */}
        {step === "mode" && (
          <>
            <div style={{ fontSize: 11, color: "#5a8aaa", marginBottom: 8 }}>
              ファイル: <span style={{ color: "#7ab3e0" }}>{pendingFile?.name}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#5a8aaa", marginBottom: 10 }}>インポート方法を選択してください</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {IMPORT_MODES.map(({ mode, label, desc }) => (
                  <button
                    key={mode}
                    onClick={() => setImportMode(mode)}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      background: importMode === mode ? "rgba(74,111,165,0.15)" : "transparent",
                      border: `1px solid ${importMode === mode ? "#4a6fa5" : "#2a3f58"}`,
                      color: importMode === mode ? "#7ab3e0" : "#4a6080",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div style={{ color: "#e07a7a", fontSize: 12, marginBottom: 12, textAlign: "center" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => { setStep("pick"); setPendingFile(null); setError(null); }}
                style={{ ...BTN, flex: 1, background: "transparent", border: "1px solid #1e2d42", color: "#3a5570" }}
              >
                戻る
              </button>
              <button
                onClick={handleModeConfirm}
                style={{ ...BTN, flex: 2, background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0" }}
              >
                解析開始
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Analyzing ── */}
        {step === "analyzing" && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#5a8aaa", fontSize: 13 }}>
            <div style={{ marginBottom: 12 }}>⟳ Rust でシーン構造を解析中…</div>
            {importMode !== "append" && <div>⟳ AI でキャラ・世界観を抽出中…</div>}
          </div>
        )}

        {/* ── Step 4: Preview ── */}
        {step === "preview" && (
          <>
            {/* インポートモード表示 */}
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
