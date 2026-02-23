import { useState, useEffect, useRef, useMemo } from "react";

const initialSettings = {
  world: `【時代】21世紀末〜22世紀初頭。人口約6,000万人の近未来日本。
【社会】AI主導のロゴス統治。行動評価スコア（ロゴス・スコア）により福祉・信用が配分。
【都市】サブスク型生活。完全デジタル行政。競争圧力は弱まり「維持型社会」へ。
【地方】準離島扱いの海沿い集落。物流は週数回の自律船・ドローン。監視は薄い。余白と実験の空間。`,
  characters: `【主人公】
・元都市テック系。中央社会からドロップアウト。
・スコアは平均以下ではないが高くもない「目立たない層」。
・どこか醒めている。好奇心はあるが表に出さない。
・退屈に耐えきれず「受け取るだけの仕事」を引き受ける。

【アンドロイド】
・美少女型。白い素体。最小限の装飾。青白い内部発光。灰色の瞳。
・行政AI認証タグなし。ローカルOS。自律学習制限が外れている可能性。
・未登録個体（例外存在）。
・起動直後はロゴス的（無機質）。海辺で徐々に非効率な行動を学習。`,
  theme: `【テーマ】
・ロゴス（理性）とパトス（情動）の対立
・管理社会の中の例外
・人口減少社会の余白
・労働なき時代の存在意義
・「粋」とは何か — システムへの洗練された逸脱

【トーン】
・静かな近未来。派手な崩壊はない。世界は縮んでいるだけ。
・青（テック）と橙（夕日）の対比。
・夜明け前の霧の港が象徴的な風景。`,
};

const initialScenes = [
  { id: 1, chapter: "第一章", title: "夜明け前の接岸", status: "draft", synopsis: "主人公が夜明け前の港で自律貨物船を待つ。軍用規格の木箱が届く。" },
  { id: 2, chapter: "第一章", title: "箱の中身", status: "empty", synopsis: "" },
  { id: 3, chapter: "第二章", title: "起動", status: "empty", synopsis: "" },
];

const statusColors = { done: "#4ade80", draft: "#facc15", empty: "#334155" };
const statusLabels = { done: "完成", draft: "執筆中", empty: "未着手" };

async function storageGet(key) {
  try {
    if (window.storage) {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : null;
    }
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
async function storageSet(key, value) {
  try {
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) { console.error(e); }
}

function HintPanel({ prompt, result, onResult, loading, onLoading, applied, onApplied, manuscriptText, onInsert }) {
  const hints = (() => {
    if (!result) return null;
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch { return null; }
  })();

  const run = async () => {
    onLoading(true);
    onResult("");
    onApplied({});
    try {
      const res = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
<<<<<<< HEAD
=======
          "anthropic-dangerous-direct-browser-access": "true",
>>>>>>> a48f6864d7e7e49a7ef3ad49fc882a9d3c861431
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt + "\n\n必ずJSONのみで返してください。形式: [{\"hint\":\"ヒント内容\",\"reason\":\"根拠\",\"keyword\":\"本文中の関連する短いフレーズや単語（2〜8文字）\"}]" }],
        }),
      });
      const data = await res.json();
      onResult(data.content?.map(b => b.text || "").join("") || "");
    } catch { onResult("[]"); }
    onLoading(false);
  };

  const handleApply = (h, i) => {
    const comment = `\n※[ヒント: ${h.hint}]`;
    const idx = h.keyword ? manuscriptText.indexOf(h.keyword) : -1;
    if (idx !== -1) {
      const insertAt = idx + h.keyword.length;
      const next = manuscriptText.slice(0, insertAt) + comment + manuscriptText.slice(insertAt);
      onInsert(next);
    } else {
      onInsert(manuscriptText + comment);
    }
    onApplied(a => ({ ...a, [i]: true }));
  };

  return (
    <div>
      <button onClick={run} disabled={loading} style={{
        padding: "6px 16px", background: "rgba(74,111,165,0.1)", border: "1px solid #2a4060",
        color: loading ? "#2a4060" : "#4a6fa5", cursor: loading ? "default" : "pointer",
        borderRadius: 4, fontSize: 12, fontFamily: "inherit", letterSpacing: 1,
      }}>{loading ? "生成中…" : "✦ 執筆ヒント"}</button>

      {result && !hints && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#3a5570" }}>{result.slice(0, 120)}</div>
      )}

      {hints && hints.map((h, i) => (
        <div key={i} style={{ marginTop: 10, padding: "10px 12px", background: "#070a14", border: `1px solid ${applied[i] ? "#1a3020" : "#1a2535"}`, borderRadius: 4, opacity: applied[i] ? 0.4 : 1, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 4 }}>{h.reason}</div>
          <div style={{ fontSize: 12, color: "#8ab0cc", lineHeight: 1.9 }}>{h.hint}</div>
          {h.keyword && <div style={{ fontSize: 10, color: "#2a4060", marginTop: 4 }}>関連: 「{h.keyword}」</div>}
          <div style={{ marginTop: 8 }}>
            {!applied[i] ? (
              <button onClick={() => handleApply(h, i)} style={{
                padding: "3px 10px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a8060",
                color: "#5ab090", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit",
              }}>参考にした</button>
            ) : (
              <button disabled style={{ padding: "3px 10px", background: "rgba(42,128,96,0.08)", border: "1px solid #1a3020", color: "#4ade80", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>✓ 済</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PolishPanel({ manuscriptText, onApply, result, onResult, loading, onLoading, applied, onApplied }) {

  const suggestions = (() => {
    if (!result) return null;
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch { return null; }
  })();

  const run = async () => {
    onLoading(true);
    onResult("");
    onApplied({});
    try {
      const res = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
<<<<<<< HEAD
=======
          "anthropic-dangerous-direct-browser-access": "true",
>>>>>>> a48f6864d7e7e49a7ef3ad49fc882a9d3c861431
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `以下の文章を推敲してください。改善点を3つ見つけ、必ずJSONのみで返してください。余分なテキスト不要。\n形式: [{"original":"元の表現","suggestion":"改善案","reason":"理由"}]\n\n${manuscriptText.slice(-600)}` }],
        }),
      });
      const data = await res.json();
      onResult(data.content?.map(b => b.text || "").join("") || "");
    } catch { onResult("[]"); }
    onLoading(false);
  };

  return (
    <div>
      <button onClick={run} disabled={loading} style={{
        padding: "6px 16px", background: "rgba(74,111,165,0.1)", border: "1px solid #2a4060",
        color: loading ? "#2a4060" : "#4a6fa5", cursor: loading ? "default" : "pointer",
        borderRadius: 4, fontSize: 12, fontFamily: "inherit", letterSpacing: 1,
      }}>{loading ? "生成中…" : "✦ 文章を推敲"}</button>

      {result && !suggestions && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#3a5570" }}>パース失敗: {result.slice(0, 80)}</div>
      )}

      {suggestions && suggestions.map((s, i) => (
        <div key={i} style={{ marginTop: 10, padding: "10px 12px", background: "#070a14", border: `1px solid ${applied[i] ? "#1a3020" : "#1a2535"}`, borderRadius: 4, opacity: applied[i] ? 0.4 : 1, transition: "opacity 0.3s" }}>
          <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 4 }}>{s.reason}</div>
          <div style={{ fontSize: 12, color: "#e05555", lineHeight: 1.8, textDecoration: "line-through", opacity: 0.7 }}>{s.original}</div>
          <div style={{ fontSize: 12, color: "#8ab0cc", lineHeight: 1.8, marginTop: 2 }}>→ {s.suggestion}</div>
          {!applied[i] ? (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => { onApply(s.original, s.suggestion); onApplied(a => ({ ...a, [i]: "replace" })); }} style={{
                padding: "3px 10px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a8060",
                color: "#5ab090", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit",
              }}>適用</button>
              <button onClick={() => { onApply(s.original, s.original + "\n＊" + s.suggestion); onApplied(a => ({ ...a, [i]: "insert" })); }} style={{
                padding: "3px 10px", background: "transparent", border: "1px solid #1e2d42",
                color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit",
              }}>直後に挿入</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button disabled style={{ padding: "3px 10px", background: "rgba(42,128,96,0.08)", border: "1px solid #1a3020", color: "#4ade80", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>✓ 済（{applied[i] === "replace" ? "適用" : "挿入"}）</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AiPanel({ label, prompt, onAppend, compact = false, result = "", onResult, loading = false, onLoading }) {
  const onAppendRef = useRef(onAppend);
  useEffect(() => { onAppendRef.current = onAppend; });

  const run = async () => {
    onLoading(true);
    onResult("");
    try {
      const res = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
<<<<<<< HEAD
=======
          "anthropic-dangerous-direct-browser-access": "true",
>>>>>>> a48f6864d7e7e49a7ef3ad49fc882a9d3c861431
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      onResult(text);
    } catch(e) {
      onResult("エラーが発生しました");
    }
    onLoading(false);
  };

  return (
    <div style={{ marginTop: compact ? 0 : 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={run} disabled={loading} style={{
          padding: compact ? "4px 10px" : "6px 16px",
          background: "rgba(74,111,165,0.1)", border: "1px solid #2a4060",
          color: loading ? "#2a4060" : "#4a6fa5", cursor: loading ? "default" : "pointer",
          borderRadius: 4, fontSize: compact ? 11 : 12, fontFamily: "inherit", letterSpacing: 1,
        }}>{loading ? "生成中…" : `✦ ${label}`}</button>
        {result && !compact && (
          <button onClick={() => { onAppendRef.current(result); onResult(""); }} style={{
            padding: "4px 10px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a8060",
            color: "#5ab090", cursor: "pointer", borderRadius: 4, fontSize: 11, fontFamily: "inherit",
          }}>追記</button>
        )}
      </div>
      {result && (
        <div style={{ marginTop: 8, padding: "10px 12px", background: "#070a14", border: "1px solid #1a2535", borderRadius: 4, fontSize: 12, color: "#8ab0cc", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
          {result}
          {compact && (
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <button onClick={() => { onAppendRef.current(result); onResult(""); }} style={{ padding: "3px 10px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a8060", color: "#5ab090", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>追記</button>
              <button onClick={() => onResult("")} style={{ padding: "3px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>閉じる</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VerticalEditor({ initialText, onChange }) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "vertical-input") onChangeRef.current(e.data.text);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const srcDocRef = useRef(null);
  if (!srcDocRef.current) {
    const escaped = initialText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    srcDocRef.current = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; background:#070a14; overflow-x:auto; overflow-y:hidden; }
body { display:flex; align-items:stretch; padding:20px; }
#editor {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'Noto Serif JP', Georgia, serif;
  font-size: 16px; line-height: 2.2; color: #c8d8e8;
  letter-spacing: 0.1em; white-space: pre-wrap;
  min-height: calc(100% - 0px); min-width: max-content;
  outline: none; caret-color: #7ab3e0;
}
</style></head>
<body><div id="editor" contenteditable="true">${escaped}</div>
<script>
  const editor = document.getElementById('editor');
  editor.addEventListener('input', () => {
    window.parent.postMessage({ type: 'vertical-input', text: editor.innerText }, '*');
  });
</script></body></html>`;
  }

  return (
    <iframe
      srcDoc={srcDocRef.current}
      style={{ flex: 1, border: "1px solid #1a2535", borderRadius: 6, width: "100%", minHeight: 400 }}
    />
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [tab, setTab] = useState("write");
  const [settings, setSettings] = useState(initialSettings);
  const [settingsTab, setSettingsTab] = useState("world");
  const [scenes, setScenes] = useState(initialScenes);
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [manuscripts, setManuscripts] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newScene, setNewScene] = useState({ chapter: "", title: "", synopsis: "" });
  const [addingScene, setAddingScene] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [addingChapter, setAddingChapter] = useState(false);
  const [projectTitle, setProjectTitle] = useState("港に届いた例外");
  const [editingTitle, setEditingTitle] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sceneSearch, setSceneSearch] = useState("");
  const [backups, setBackups] = useState([]);
  const [showBackups, setShowBackups] = useState(false);
  const [verticalPreview, setVerticalPreview] = useState(false);
  const [editingSceneTitle, setEditingSceneTitle] = useState(false);
  const [editingSceneSynopsis, setEditingSceneSynopsis] = useState(false);
  const [sidebarFloat, setSidebarFloat] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("write");
  const [editorSettings, setEditorSettings] = useState({ fontSize: 15, lineHeight: 2.2 });
  const [aiFloat, setAiFloat] = useState(false);
  const [aiWide, setAiWide] = useState(false);
  const [aiResults, setAiResults] = useState({ polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "" });
  const [aiLoading, setAiLoading] = useState({ polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false });
  const [aiApplied, setAiApplied] = useState({});
  const [hintApplied, setHintApplied] = useState({});

  const selectedScene = scenes.find(s => s.id === selectedSceneId) || null;
  const manuscriptText = selectedSceneId ? (manuscripts[selectedSceneId] || "") : "";
  const wordCount = manuscriptText.replace(/\s/g, "").length;

  useEffect(() => {
    (async () => {
      const [sc, st, ms, pt, bk] = await Promise.all([
        storageGet("minato:scenes"),
        storageGet("minato:settings"),
        storageGet("minato:manuscripts"),
        storageGet("minato:title"),
        storageGet("minato:backups"),
      ]);
      if (sc) setScenes(sc);
      if (st) setSettings(st);
      if (ms) setManuscripts(ms);
      if (pt) setProjectTitle(pt);
      if (bk) setBackups(bk);
      setLoaded(true);
    })();
  }, []);

  const save = async (sc, st, ms, pt) => {
    setSaveStatus("saving");
    try {
      await Promise.all([
        storageSet("minato:scenes", sc),
        storageSet("minato:settings", st),
        storageSet("minato:manuscripts", ms),
        storageSet("minato:title", pt),
      ]);
      setSaveStatus("saved");
      setLastSavedTime(new Date());
    } catch { setSaveStatus("error"); }
  };

  const saveWithBackup = async (sc, st, ms, pt, label = null) => {
    setSaveStatus("saving");
    try {
      const newBackup = { timestamp: new Date().toISOString(), label, scenes: sc, manuscripts: ms };
      const updatedBackups = [newBackup, ...backups].slice(0, 5);
      await Promise.all([
        storageSet("minato:scenes", sc),
        storageSet("minato:settings", st),
        storageSet("minato:manuscripts", ms),
        storageSet("minato:title", pt),
        storageSet("minato:backups", updatedBackups),
      ]);
      setBackups(updatedBackups);
      setSaveStatus("saved");
      setLastSavedTime(new Date());
    } catch { setSaveStatus("error"); }
  };

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const sc = scenes, st = settings, ms = manuscripts, pt = projectTitle;
    const t = setTimeout(async () => {
      try {
        await Promise.all([
          storageSet("minato:scenes", sc),
          storageSet("minato:settings", st),
          storageSet("minato:manuscripts", ms),
          storageSet("minato:title", pt),
        ]);
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      } catch { setSaveStatus("error"); }
    }, 900);
    return () => clearTimeout(t);
  }, [scenes, settings, manuscripts, projectTitle, loaded]);

  const handleSceneSelect = (scene) => { setSelectedSceneId(scene.id); setTab("write"); };
  const handleManuscriptChange = (text) => setManuscripts(prev => ({ ...prev, [selectedSceneId]: text }));
  const handleStatusChange = (id, status) => setScenes(scenes.map(s => s.id === id ? { ...s, status } : s));
  const handleAddScene = () => {
    const scene = { ...newScene, id: Date.now(), status: "empty" };
    setScenes([...scenes, scene]);
    setNewScene({ chapter: "", title: "", synopsis: "" });
    setAddingScene(false);
  };
  const handleDeleteScene = (id) => setConfirmDelete(id);
  const confirmDeleteExecute = () => {
    const id = confirmDelete;
    setScenes(prev => prev.filter(s => s.id !== id));
    if (selectedSceneId === id) setSelectedSceneId(null);
    setManuscripts(prev => { const n = { ...prev }; delete n[id]; return n; });
    setConfirmDelete(null);
  };

  const [exportContent, setExportContent] = useState("");
  const [showExportContent, setShowExportContent] = useState(false);

  const downloadFile = (content) => {
    setExportContent(content);
    setShowExportContent(true);
  };

  const exportScene = (fmt) => {
    if (!selectedScene) return;
    const text = manuscripts[selectedScene.id] || "";
    const content = fmt === "md"
      ? `# ${selectedScene.chapter} — ${selectedScene.title}\n\n${selectedScene.synopsis ? `> ${selectedScene.synopsis}\n\n` : ""}${text}`
      : `${selectedScene.chapter} — ${selectedScene.title}\n${"=".repeat(30)}\n${selectedScene.synopsis ? `${selectedScene.synopsis}\n\n` : ""}${text}`;
    downloadFile(content, `${selectedScene.title}.${fmt}`);
    setShowExport(false);
  };

  const exportAll = (fmt) => {
    const content = fmt === "md"
      ? `# 港に届いた例外\n\n` + scenes.map(s => `## ${s.chapter} — ${s.title}\n\n${s.synopsis ? `> ${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n---\n\n")
      : scenes.map(s => `${s.chapter} — ${s.title}\n${"=".repeat(30)}\n${s.synopsis ? `${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n" + "─".repeat(40) + "\n\n");
    downloadFile(content, `港に届いた例外.${fmt}`);
    setShowExport(false);
  };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#2a4060", fontSize: 12, letterSpacing: 3 }}>loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#c8d8e8", fontFamily: "'Noto Serif JP','Georgia',serif", display: "flex", flexDirection: "column" }}>
      {/* Delete confirm modal */}
      {confirmDelete && (() => {
        const scene = scenes.find(s => s.id === confirmDelete);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#0e1520", border: "1px solid #2a3f58", borderRadius: 8, padding: "28px 32px", maxWidth: 320, width: "90%", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 8 }}>削除の確認</div>
              <div style={{ fontSize: 15, color: "#c8d8e8", marginBottom: 6 }}>「{scene?.title}」</div>
              <div style={{ fontSize: 12, color: "#3a5570", marginBottom: 24 }}>この操作は取り消せません。</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setConfirmDelete(null)} style={{ padding: "7px 20px", background: "transparent", border: "1px solid #1e2d42", color: "#4a6fa5", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>キャンセル</button>
                <button onClick={confirmDeleteExecute} style={{ padding: "7px 20px", background: "rgba(180,40,40,0.2)", border: "1px solid #7a2020", color: "#e08080", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>削除する</button>
              </div>
            </div>
          </div>
        );
      })()}
      {showExportContent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0e1520", border: "1px solid #2a3f58", borderRadius: 8, padding: "24px 28px", width: "80%", maxWidth: 600, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 12 }}>出力テキスト　<span style={{ fontSize: 11, color: "#3a5570" }}>— コピーして使用してください</span></div>
            <textarea
              readOnly
              value={exportContent}
              style={{ flex: 1, minHeight: 300, background: "#070a14", border: "1px solid #1a2535", color: "#c8d8e8", fontFamily: "inherit", fontSize: 12, lineHeight: 1.8, padding: "10px", resize: "none", outline: "none", borderRadius: 4 }}
              onClick={e => e.target.select()}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { navigator.clipboard.writeText(exportContent); }} style={{ flex: 1, padding: "8px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>クリップボードにコピー</button>
              <button onClick={() => setShowExportContent(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>閉じる</button>
            </div>
          </div>
        </div>
      )}
      {/* Export modal */}
      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0e1520", border: "1px solid #2a3f58", borderRadius: 8, padding: "28px 32px", maxWidth: 340, width: "90%" }}>
            <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 20, textAlign: "center" }}>出力</div>
            {selectedScene && (
              <>
                <div style={{ fontSize: 11, color: "#3a5570", marginBottom: 10 }}>選択中のシーン：「{selectedScene.title}」</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <button onClick={() => exportScene("md")} style={{ flex: 1, padding: "8px", background: "rgba(74,111,165,0.15)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>.md</button>
                  <button onClick={() => exportScene("txt")} style={{ flex: 1, padding: "8px", background: "rgba(74,111,165,0.15)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>.txt</button>
                </div>
              </>
            )}
            <div style={{ fontSize: 11, color: "#3a5570", marginBottom: 10 }}>全シーンまとめて</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <button onClick={() => exportAll("md")} style={{ flex: 1, padding: "8px", background: "rgba(74,111,165,0.1)", border: "1px solid #2a4060", color: "#5a8aaa", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>.md</button>
              <button onClick={() => exportAll("txt")} style={{ flex: 1, padding: "8px", background: "rgba(74,111,165,0.1)", border: "1px solid #2a4060", color: "#5a8aaa", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>.txt</button>
            </div>
            <button onClick={() => setShowExport(false)} style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>キャンセル</button>
          </div>
        </div>
      )}
      {/* Backup modal */}
      {showBackups && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0e1520", border: "1px solid #2a3f58", borderRadius: 8, padding: "24px 28px", maxWidth: 400, width: "90%" }}>
            <div style={{ fontSize: 13, color: "#7ab3e0", marginBottom: 16, textAlign: "center" }}>バージョン履歴</div>
            {/* 手動バックアップ作成 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                placeholder="バージョン名（省略可）"
                id="backup-label-input"
                style={{ flex: 1, background: "#070a14", border: "1px solid #1e2d42", color: "#8ab0cc", padding: "5px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit", outline: "none" }}
              />
              <button onClick={() => {
                const label = document.getElementById("backup-label-input").value || null;
                const newBackup = { timestamp: new Date().toISOString(), label, scenes, manuscripts };
                const updated = [newBackup, ...backups].slice(0, 5);
                setBackups(updated);
                storageSet("minato:backups", updated);
                document.getElementById("backup-label-input").value = "";
              }} style={{ padding: "5px 14px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>記録</button>
            </div>
            {backups.length === 0 ? (
              <div style={{ fontSize: 12, color: "#3a5570", textAlign: "center", marginBottom: 20 }}>まだバックアップがありません</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {backups.map((bk, i) => {
                  const d = new Date(bk.timestamp);
                  const timeLabel = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
                  const charCount = Object.values(bk.manuscripts || {}).reduce((a, t) => a + t.replace(/\s/g,"").length, 0);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#070a14", border: "1px solid #1a2535", borderRadius: 5 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#8ab0cc" }}>
                          {bk.label ? <span style={{ color: "#c8d8e8", marginRight: 6 }}>{bk.label}</span> : null}
                          <span style={{ color: "#3a5570" }}>{timeLabel}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#2a4060", marginTop: 2 }}>{bk.scenes?.length || 0} シーン・{charCount.toLocaleString()} 文字</div>
                      </div>
                      <button onClick={() => {
                        setScenes(bk.scenes || []);
                        setManuscripts(bk.manuscripts || {});
                        setShowBackups(false);
                      }} style={{ padding: "4px 12px", background: "rgba(74,111,165,0.15)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>復元</button>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => setShowBackups(false)} style={{ width: "100%", padding: "7px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>閉じる</button>
          </div>
        </div>
      )}
      <header style={{ borderBottom: "1px solid #1e2d42", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,14,26,0.95)", position: "sticky", top: 0, zIndex: 100, height: 44 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* アイコン */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="20" height="20" rx="2" stroke="#1e3050" strokeWidth="1.5"/>
              <line x1="8" y1="9" x2="20" y2="9" stroke="#2a4060" strokeWidth="1.2"/>
              <line x1="8" y1="13" x2="20" y2="13" stroke="#2a4060" strokeWidth="1.2"/>
              <line x1="8" y1="17" x2="16" y2="17" stroke="#1e3050" strokeWidth="1.2"/>
              <circle cx="22" cy="22" r="5" fill="#0a0e1a" stroke="#4a6fa5" strokeWidth="1"/>
              <line x1="20" y1="22" x2="24" y2="22" stroke="#4a6fa5" strokeWidth="1"/>
              <line x1="22" y1="20" x2="22" y2="24" stroke="#4a6fa5" strokeWidth="1"/>
            </svg>
            <div style={{ fontSize: 7, letterSpacing: 1.5, color: "#1e3050", textTransform: "lowercase", whiteSpace: "nowrap" }}>minato ws</div>
          </div>
          {/* タイトル */}
          {editingTitle ? (
            <input
              autoFocus
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === "Enter" && setEditingTitle(false)}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid #4a6fa5", color: "#e2eaf4", fontSize: 15, fontWeight: 700, fontFamily: "'Noto Serif JP','Georgia',serif", outline: "none", letterSpacing: 1, width: 280 }}
            />
          ) : (
            <div onClick={() => setEditingTitle(true)} style={{ fontSize: 15, fontWeight: 700, color: "#c8d8e8", letterSpacing: 1, cursor: "text", fontFamily: "'Noto Serif JP','Georgia',serif" }} title="クリックで編集">
              {projectTitle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 10, color: saveStatus === "saved" ? "#2a4060" : saveStatus === "saving" ? "#4a6fa5" : "#e05555" }}>
            {saveStatus === "saving" ? "保存中…" : saveStatus === "error" ? "⚠ エラー" : lastSavedTime ? `保存: ${lastSavedTime.getHours()}:${String(lastSavedTime.getMinutes()).padStart(2,"0")}` : "✓"}
          </div>
          <button onClick={() => saveWithBackup(scenes, settings, manuscripts, projectTitle)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #2a4060", background: "rgba(74,111,165,0.1)", color: "#4a6fa5", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>保存</button>
          <button onClick={() => setShowBackups(true)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>履歴</button>
          <button onClick={() => setShowExport(true)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #1e2d42", background: "transparent", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>出力</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {/* フロートオーバーレイ背景 */}
        {sidebarOpen && sidebarFloat && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)" }} />
        )}
        <aside style={{
          width: sidebarOpen ? 220 : 36,
          borderRight: "1px solid #1e2d42",
          background: "#080c16",
          overflowY: sidebarOpen ? "auto" : "hidden",
          flexShrink: sidebarFloat ? 0 : 0,
          transition: "width 0.2s ease",
          display: "flex", flexDirection: "column",
          ...(sidebarOpen && sidebarFloat ? {
            position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 51, width: 220, boxShadow: "4px 0 20px rgba(0,0,0,0.6)"
          } : {}),
        }}>
          {sidebarOpen ? (
            <>
              {/* Sidebar header: tabs + close */}
              <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e2d42", flexShrink: 0 }}>
                {[["write","執筆"],["structure","構成"],["world","世界観"],["prefs","環境"]].map(([key, label]) => (
                  <button key={key} onClick={() => setSidebarTab(key)} style={{
                    flex: 1, padding: "8px 0", background: "transparent", border: "none",
                    borderBottom: sidebarTab === key ? "2px solid #4a6fa5" : "2px solid transparent",
                    color: sidebarTab === key ? "#7ab3e0" : "#2a4060",
                    cursor: "pointer", fontSize: 10, fontFamily: "inherit", letterSpacing: 1,
                  }}>{label}</button>
                ))}
                <button onClick={() => setSidebarFloat(!sidebarFloat)} style={{ padding: "8px 8px", background: "transparent", border: "none", borderLeft: "1px solid #1e2d42", color: sidebarFloat ? "#4a6fa5" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit", flexShrink: 0 }} title={sidebarFloat ? "固定表示に切替" : "フロート表示に切替"}>{sidebarFloat ? "浮" : "固"}</button>
                <button onClick={() => setSidebarOpen(false)} style={{ padding: "8px 10px", background: "transparent", border: "none", borderLeft: "1px solid #1e2d42", color: "#2a4060", cursor: "pointer", fontSize: 11, fontFamily: "inherit", flexShrink: 0 }}>◀</button>
              </div>

              {/* Sidebar content: 執筆 = scene list */}
              {sidebarTab === "write" && <>
                <div style={{ padding: "8px 12px 4px" }}>
                  <input
                    placeholder="シーンを検索…"
                    value={sceneSearch}
                    onChange={e => setSceneSearch(e.target.value)}
                    style={{ width: "100%", background: "#0e1520", border: "1px solid #1e2d42", color: "#8ab0cc", padding: "5px 8px", borderRadius: 4, fontSize: 11, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ padding: "4px 16px 4px", fontSize: 10, letterSpacing: 3, color: "#2a4060", textTransform: "uppercase" }}>Scene List</div>
                {scenes.filter(s => !sceneSearch || (s.title || "無題").includes(sceneSearch) || (s.chapter || "").includes(sceneSearch)).map(scene => (
                  <div key={scene.id} onClick={() => handleSceneSelect(scene)} style={{ padding: "10px 16px", cursor: "pointer", borderLeft: selectedSceneId === scene.id ? "2px solid #4a6fa5" : "2px solid transparent", background: selectedSceneId === scene.id ? "rgba(74,111,165,0.08)" : "transparent", borderBottom: "1px solid #0e1520" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: statusColors[scene.status], boxShadow: `0 0 6px ${statusColors[scene.status]}66` }} />
                      <span style={{ fontSize: 10, color: "#3a5570" }}>{scene.chapter}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#8ab0cc", lineHeight: 1.4 }}>{scene.title ? scene.title : <span style={{ color: "#2a4060", fontStyle: "italic" }}>無題</span>}</div>
                    {manuscripts[scene.id] && <div style={{ fontSize: 10, color: "#2a4060", marginTop: 2 }}>{manuscripts[scene.id].replace(/\s/g, "").length}字</div>}
                  </div>
                ))}
                <div style={{ padding: "12px 16px" }}>
                  {!addingScene ? (
                    <button onClick={() => setAddingScene(true)} style={{ width: "100%", padding: "7px", border: "1px dashed #1e2d42", background: "transparent", color: "#2a4060", cursor: "pointer", fontSize: 11, borderRadius: 4, fontFamily: "inherit" }}>＋ シーンを追加</button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[["chapter", "章名"], ["title", "タイトル"], ["synopsis", "概要"]].map(([key, ph]) => (
                        <input key={key} placeholder={ph} value={newScene[key]} onChange={e => setNewScene({ ...newScene, [key]: e.target.value })} style={{ background: "#0e1520", border: "1px solid #1e2d42", color: "#8ab0cc", padding: "5px 8px", borderRadius: 3, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                      ))}
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={handleAddScene} style={{ flex: 1, padding: "5px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>追加</button>
                        <button onClick={() => setAddingScene(false)} style={{ flex: 1, padding: "5px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>キャンセル</button>
                      </div>
                    </div>
                  )}
                </div>
              </>}

              {/* Sidebar content: 構成 = chapter tree */}
              {sidebarTab === "structure" && (() => {
                const chapters = scenes.reduce((acc, scene) => {
                  const ch = scene.chapter || "未分類";
                  if (!acc[ch]) acc[ch] = [];
                  acc[ch].push(scene);
                  return acc;
                }, {});
                return (
                  <div style={{ padding: "10px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(chapters).map(([chapter, chScenes]) => {
                      const allDone = chScenes.every(s => s.status === "done");
                      const anyDraft = chScenes.some(s => s.status === "draft");
                      const chColor = allDone ? statusColors.done : anyDraft ? statusColors.draft : statusColors.empty;
                      const isAddingHere = addingScene && newScene.chapter === chapter;
                      return (
                        <div key={chapter}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #1a2535" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: chColor, boxShadow: `0 0 5px ${chColor}66` }} />
                            <span style={{ fontSize: 11, color: "#c8d8e8", fontWeight: 600, flex: 1 }}>{chapter || "未分類"}</span>
                            <button onClick={() => { setNewScene({ chapter, title: "", synopsis: "" }); setAddingScene(true); }} style={{ fontSize: 10, padding: "1px 6px", background: "transparent", border: "1px solid #1e2d42", color: "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>＋</button>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 10 }}>
                            {chScenes.map(scene => (
                              <div key={scene.id} onClick={() => handleSceneSelect(scene)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 4, cursor: "pointer", background: selectedSceneId === scene.id ? "rgba(74,111,165,0.1)" : "transparent", border: "1px solid", borderColor: selectedSceneId === scene.id ? "#4a6fa5" : "transparent" }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: statusColors[scene.status] }} />
                                <span style={{ fontSize: 11, color: "#8ab0cc", flex: 1 }}>{scene.title ? scene.title : <span style={{ color: "#2a4060", fontStyle: "italic" }}>無題</span>}</span>
                              </div>
                            ))}
                            {isAddingHere && (
                              <div style={{ padding: "6px 8px", background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 4, display: "flex", flexDirection: "column", gap: 5 }}>
                                <input autoFocus placeholder="タイトル" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => e.key === "Enter" && handleAddScene()} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#8ab0cc", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button onClick={handleAddScene} style={{ flex: 1, padding: "3px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>追加</button>
                                  <button onClick={() => setAddingScene(false)} style={{ flex: 1, padding: "3px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>×</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {addingChapter ? (
                      <div style={{ background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 5, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
                        <input autoFocus placeholder="章名" value={newScene.chapter} onChange={e => setNewScene({ ...newScene, chapter: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#c8d8e8", fontSize: 12, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                        <input placeholder="タイトル（省略可）" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => { if (e.key === "Enter") { handleAddScene(); setAddingChapter(false); }}} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#8ab0cc", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => { handleAddScene(); setAddingChapter(false); }} style={{ flex: 1, padding: "3px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>追加</button>
                          <button onClick={() => { setAddingChapter(false); setNewScene({ chapter: "", title: "", synopsis: "" }); }} style={{ flex: 1, padding: "3px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 10, fontFamily: "inherit" }}>×</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setNewScene({ chapter: "", title: "", synopsis: "" }); setAddingChapter(true); }} style={{ padding: "6px", border: "1px dashed #1e2d42", background: "transparent", color: "#2a4060", cursor: "pointer", fontSize: 10, borderRadius: 4, fontFamily: "inherit" }}>＋ 新しい章</button>
                    )}
                  </div>
                );
              })()}

              {/* Sidebar content: 設定 */}
              {sidebarTab === "world" && (
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[["world","世界観"],["characters","キャラクター"],["theme","テーマ"]].map(([key, label]) => (
                    <div key={key}>
                      <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 4 }}>{label}</div>
                      <textarea value={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.value })} style={{ width: "100%", minHeight: 80, background: "#070a14", border: "1px solid #1a2535", color: "#8ab0cc", fontFamily: "inherit", fontSize: 11, lineHeight: 1.8, padding: "6px 8px", resize: "vertical", outline: "none", borderRadius: 4, boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              )}
              {sidebarTab === "prefs" && (
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 8 }}>文字サイズ　<span style={{ color: "#8ab0cc" }}>{editorSettings.fontSize}px</span></div>
                    <input type="range" min={12} max={24} value={editorSettings.fontSize} onChange={e => setEditorSettings(s => ({ ...s, fontSize: Number(e.target.value) }))} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#4a6fa5", marginBottom: 8 }}>行間　<span style={{ color: "#8ab0cc" }}>{editorSettings.lineHeight}</span></div>
                    <input type="range" min={1.4} max={3.0} step={0.1} value={editorSettings.lineHeight} onChange={e => setEditorSettings(s => ({ ...s, lineHeight: Number(e.target.value) }))} style={{ width: "100%" }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
              <button onClick={() => setSidebarOpen(true)} style={{ padding: "8px 0", width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>▶</button>
              {[
                { key: "write", label: "執筆" },
                { key: "structure", label: "構成" },
                { key: "settings", label: "世界観" },
                { key: "prefs", label: "環境" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  padding: "14px 0", width: "100%", background: "transparent", border: "none",
                  borderBottom: "1px solid #0e1520",
                  color: tab === key ? "#7ab3e0" : "#2a4060",
                  cursor: "pointer", fontSize: 10, fontFamily: "inherit",
                  writingMode: "vertical-rl", letterSpacing: 2,
                  borderLeft: tab === key ? "2px solid #4a6fa5" : "2px solid transparent",
                  background: tab === key ? "rgba(74,111,165,0.08)" : "transparent",
                }}>{label}</button>
              ))}
            </div>
          )}
        </aside>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {tab === "write" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 12px" }}>
              {selectedScene ? (<>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <div style={{ paddingRight: 0 }}>
                    <div style={{ fontSize: 11, color: "#3a5570", letterSpacing: 2, marginBottom: 4 }}>{selectedScene.chapter}</div>
                    {editingSceneTitle ? (
                      <input
                        autoFocus
                        value={selectedScene.title}
                        onChange={e => setScenes(scenes.map(s => s.id === selectedSceneId ? { ...s, title: e.target.value } : s))}
                        onBlur={() => setEditingSceneTitle(false)}
                        onKeyDown={e => e.key === "Enter" && setEditingSceneTitle(false)}
                        style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#c8d8e8", background: "transparent", border: "none", borderBottom: "1px solid #4a6fa5", outline: "none", fontFamily: "'Noto Serif JP','Georgia',serif", width: "100%", letterSpacing: 1 }}
                      />
                    ) : (
                      <h2 onClick={() => setEditingSceneTitle(true)} style={{ margin: 0, fontSize: 20, color: "#c8d8e8", fontWeight: 600, cursor: "text" }} title="クリックで編集">
                        {selectedScene.title ? selectedScene.title : <span style={{ fontStyle: "italic", color: "#3a5570" }}>無題</span>}
                      </h2>
                    )}
                    {editingSceneSynopsis ? (
                      <input
                        autoFocus
                        value={selectedScene.synopsis || ""}
                        onChange={e => setScenes(scenes.map(s => s.id === selectedSceneId ? { ...s, synopsis: e.target.value } : s))}
                        onBlur={() => setEditingSceneSynopsis(false)}
                        onKeyDown={e => e.key === "Enter" && setEditingSceneSynopsis(false)}
                        placeholder="概要を入力…"
                        style={{ marginTop: 4, fontSize: 12, color: "#8ab0cc", background: "transparent", border: "none", borderBottom: "1px solid #2a4060", outline: "none", fontFamily: "inherit", width: "100%", fontStyle: "italic" }}
                      />
                    ) : (
                      <div onClick={() => setEditingSceneSynopsis(true)} style={{ marginTop: 4, fontSize: 12, color: selectedScene.synopsis ? "#3a5570" : "#1e2d42", fontStyle: "italic", cursor: "text", minHeight: 18 }}>
                        {selectedScene.synopsis || "概要を追加…"}
                      </div>
                    )}
                  </div>
                  <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {["empty", "draft", "done"].map(s => (
                      <button key={s} onClick={() => handleStatusChange(selectedScene.id, s)} style={{ padding: "4px 10px", borderRadius: 3, border: "1px solid", borderColor: selectedScene.status === s ? statusColors[s] : "#1e2d42", background: selectedScene.status === s ? `${statusColors[s]}22` : "transparent", color: selectedScene.status === s ? statusColors[s] : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>{statusLabels[s]}</button>
                    ))}
                    <button onClick={() => setVerticalPreview(!verticalPreview)} style={{ padding: "4px 10px", borderRadius: 3, border: "1px solid", borderColor: verticalPreview ? "#4a6fa5" : "#1e2d42", background: verticalPreview ? "rgba(74,111,165,0.15)" : "transparent", color: verticalPreview ? "#7ab3e0" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>縦組</button>
                    <button onClick={() => handleDeleteScene(selectedScene.id)} style={{ padding: "4px 10px", borderRadius: 3, border: "1px solid #1e2d42", background: "transparent", color: "#3a2020", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>削除</button>
                  </div>
                </div>
                {verticalPreview ? (
                  <VerticalEditor
                    key={selectedSceneId}
                    initialText={manuscriptText}
                    onChange={handleManuscriptChange}
                  />
                ) : (
                  <textarea value={manuscriptText} onChange={e => handleManuscriptChange(e.target.value)} placeholder="ここに本文を書く…" style={{ flex: 1, minHeight: 400, background: "#070a14", border: "1px solid #1a2535", color: "#c8d8e8", fontFamily: "'Noto Serif JP','Georgia',serif", fontSize: editorSettings.fontSize, lineHeight: editorSettings.lineHeight, padding: "16px 12px", resize: "none", outline: "none", borderRadius: 6, width: "100%", boxSizing: "border-box" }} />
                )}
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", paddingRight: 90 }}>
                  {(() => {
                    const idx = scenes.findIndex(s => s.id === selectedSceneId);
                    const prev = scenes[idx - 1];
                    const next = scenes[idx + 1];
                    return (<>
                      <button onClick={() => prev && handleSceneSelect(prev)} disabled={!prev} style={{ padding: "4px 10px", background: "transparent", border: "1px solid", borderColor: prev ? "#1e2d42" : "#0e1520", color: prev ? "#3a5570" : "#1a2535", cursor: prev ? "pointer" : "default", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>← {prev ? (prev.title || "無題") : "—"}</button>
                      <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#2a4060" }}>{wordCount.toLocaleString()} 文字</div>
                      <button onClick={() => next && handleSceneSelect(next)} disabled={!next} style={{ padding: "4px 10px", background: "transparent", border: "1px solid", borderColor: next ? "#1e2d42" : "#0e1520", color: next ? "#3a5570" : "#1a2535", cursor: next ? "pointer" : "default", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>{next ? (next.title || "無題") : "—"} →</button>
                    </>);
                  })()}
                </div>
              </>) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#1e2d42", fontSize: 14 }}>左のリストからシーンを選択してください</div>
              )}
            </div>
          )}
          {tab === "write" && selectedScene && (
            <div style={{ borderTop: "1px solid #0e1520", padding: "8px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <AiPanel
                label="続きを提案"
                compact
                result={aiResults.continue || ""}
                onResult={t => setAiResults(r => ({ ...r, continue: t }))}
                onLoading={v => setAiLoading(l => ({ ...l, continue: v }))}
                loading={aiLoading.continue}
                prompt={`以下の小説のシーンの続きを200字程度で提案してください。世界観・文体を維持し、あくまで提案として。\n\n【世界観】${settings.world}\n【シーン】${selectedScene.chapter} / ${selectedScene.title}\n【概要】${selectedScene.synopsis || ""}\n【本文末尾】${manuscriptText.slice(-200)}`}
                onAppend={text => handleManuscriptChange(manuscriptText + "\n" + text)}
              />
              <AiPanel
                label="概要を自動生成"
                compact
                result={aiResults.synopsis || ""}
                onResult={t => setAiResults(r => ({ ...r, synopsis: t }))}
                onLoading={v => setAiLoading(l => ({ ...l, synopsis: v }))}
                loading={aiLoading.synopsis}
                prompt={`以下の本文を読んで、シーンの概要を50字以内で生成してください。一文のみ返してください。\n\n${manuscriptText}`}
                onAppend={text => setScenes(scenes.map(s => s.id === selectedSceneId ? { ...s, synopsis: text.trim() } : s))}
              />
            </div>
          )}

          {tab === "structure" && (() => {
            // Group scenes by chapter for tree view
            const chapters = scenes.reduce((acc, scene) => {
              const ch = scene.chapter || "未分類";
              if (!acc[ch]) acc[ch] = [];
              acc[ch].push(scene);
              return acc;
            }, {});
            const totalChars = Object.values(manuscripts).reduce((a, t) => a + t.replace(/\s/g, "").length, 0);

            return (
              <div style={{ padding: "20px 16px", overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {Object.entries(chapters).map(([chapter, chScenes]) => {
                    const chChars = chScenes.reduce((a, s) => a + (manuscripts[s.id] || "").replace(/\s/g, "").length, 0);
                    const allDone = chScenes.every(s => s.status === "done");
                    const anyDraft = chScenes.some(s => s.status === "draft");
                    const chColor = allDone ? statusColors.done : anyDraft ? statusColors.draft : statusColors.empty;
                    const isAddingHere = addingScene && newScene.chapter === chapter;
                    return (
                      <div key={chapter}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #1a2535" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: chColor, boxShadow: `0 0 7px ${chColor}66` }} />
                          <span style={{ fontSize: 13, color: "#c8d8e8", fontWeight: 600, flex: 1 }}>{chapter}</span>
                          {chChars > 0 && <span style={{ fontSize: 10, color: "#2a4060" }}>{chChars.toLocaleString()}字</span>}
                          <button onClick={() => { setNewScene({ chapter, title: "", synopsis: "" }); setAddingScene(true); }} style={{ fontSize: 11, padding: "2px 8px", background: "transparent", border: "1px solid #1e2d42", color: "#2a4060", borderRadius: 3, cursor: "pointer", fontFamily: "inherit" }}>＋</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 16 }}>
                          {chScenes.map((scene, i) => (
                            <div key={scene.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
                                <div style={{ width: 1, height: 6, background: i === 0 ? "transparent" : "#1a2535" }} />
                                <div style={{ width: 12, height: 1, background: "#1a2535" }} />
                              </div>
                              <div onClick={() => handleSceneSelect(scene)} style={{ flex: 1, background: selectedSceneId === scene.id ? "rgba(74,111,165,0.1)" : "#0a0f1a", border: "1px solid", borderColor: selectedSceneId === scene.id ? "#4a6fa5" : "#1a2535", borderRadius: 5, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 4, background: statusColors[scene.status], boxShadow: `0 0 5px ${statusColors[scene.status]}66` }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, color: "#8ab0cc", marginBottom: 2 }}>{scene.title ? scene.title : <span style={{ fontStyle: "italic", color: "#2a4060" }}>無題</span>}</div>
                                  {scene.synopsis && <div style={{ fontSize: 11, color: "#2a4060", fontStyle: "italic" }}>{scene.synopsis}</div>}
                                  {manuscripts[scene.id] && <div style={{ fontSize: 10, color: "#2a4060", marginTop: 3 }}>{manuscripts[scene.id].replace(/\s/g, "").length.toLocaleString()}字</div>}
                                </div>
                                <span style={{ fontSize: 9, color: statusColors[scene.status], flexShrink: 0, marginTop: 2 }}>{statusLabels[scene.status]}</span>
                              </div>
                            </div>
                          ))}
                          {isAddingHere && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
                                <div style={{ width: 1, height: 6, background: "#1a2535" }} />
                                <div style={{ width: 12, height: 1, background: "#1a2535" }} />
                              </div>
                              <div style={{ flex: 1, background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 5, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                                <input autoFocus placeholder="タイトル" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => e.key === "Enter" && handleAddScene()} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#8ab0cc", fontSize: 12, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                                <input placeholder="概要（省略可）" value={newScene.synopsis} onChange={e => setNewScene({ ...newScene, synopsis: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#3a5570", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                                <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                                  <button onClick={handleAddScene} style={{ padding: "3px 10px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>追加</button>
                                  <button onClick={() => setAddingScene(false)} style={{ padding: "3px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>キャンセル</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* New chapter form */}
                  {addingChapter ? (
                    <div style={{ background: "#0a0f1a", border: "1px dashed #2a4060", borderRadius: 6, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 10, color: "#3a5570", marginBottom: 2 }}>新しい章</div>
                      <input autoFocus placeholder="章名" value={newScene.chapter} onChange={e => setNewScene({ ...newScene, chapter: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #2a4060", color: "#c8d8e8", fontSize: 13, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                      <input placeholder="タイトル" value={newScene.title} onChange={e => setNewScene({ ...newScene, title: e.target.value })} onKeyDown={e => e.key === "Enter" && handleAddScene()} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#8ab0cc", fontSize: 12, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                      <input placeholder="概要（省略可）" value={newScene.synopsis} onChange={e => setNewScene({ ...newScene, synopsis: e.target.value })} style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a2535", color: "#3a5570", fontSize: 11, fontFamily: "inherit", outline: "none", padding: "2px 0" }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                        <button onClick={() => { handleAddScene(); setAddingChapter(false); }} style={{ padding: "3px 10px", background: "rgba(74,111,165,0.2)", border: "1px solid #4a6fa5", color: "#7ab3e0", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>追加</button>
                        <button onClick={() => { setAddingChapter(false); setNewScene({ chapter: "", title: "", synopsis: "" }); }} style={{ padding: "3px 10px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", cursor: "pointer", borderRadius: 3, fontSize: 11, fontFamily: "inherit" }}>キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setNewScene({ chapter: "", title: "", synopsis: "" }); setAddingChapter(true); }} style={{ padding: "8px", border: "1px dashed #1e2d42", background: "transparent", color: "#2a4060", cursor: "pointer", fontSize: 11, borderRadius: 5, fontFamily: "inherit" }}>＋ 新しい章を追加</button>
                  )}
                </div>
                <div style={{ marginTop: 24, padding: "12px 16px", background: "#0c1220", borderRadius: 6, border: "1px solid #1a2535", display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#3a5570" }}>総文字数</span>
                  <span style={{ fontSize: 24, color: "#7ab3e0", fontWeight: 300 }}>{totalChars.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: "#3a5570" }}>文字</span>
                </div>
              </div>
            );
          })()}

          {tab === "settings" && (
            <div style={{ padding: "24px 32px", overflowY: "auto" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#7ab3e0", fontWeight: 400, letterSpacing: 2 }}>世界観メモ</h2>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[["world", "世界観"], ["characters", "キャラクター"], ["theme", "テーマ"]].map(([key, label]) => (
                  <button key={key} onClick={() => setSettingsTab(key)} style={{ padding: "6px 16px", borderRadius: 4, border: "1px solid", borderColor: settingsTab === key ? "#4a6fa5" : "#1e2d42", background: settingsTab === key ? "rgba(74,111,165,0.15)" : "transparent", color: settingsTab === key ? "#7ab3e0" : "#3a5570", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>{label}</button>
                ))}
              </div>
              <textarea value={settings[settingsTab]} onChange={e => setSettings({ ...settings, [settingsTab]: e.target.value })} style={{ width: "100%", minHeight: 280, background: "#070a14", border: "1px solid #1a2535", color: "#8ab0cc", fontFamily: "'Noto Serif JP','Georgia',serif", fontSize: 13, lineHeight: 2, padding: "20px 24px", resize: "vertical", outline: "none", borderRadius: 6, boxSizing: "border-box" }} />
              <AiPanel
                label="AIで意味を拡張"
                result={aiResults.worldExpand || ""}
                onResult={t => setAiResults(r => ({ ...r, worldExpand: t }))}
                onLoading={v => setAiLoading(l => ({ ...l, worldExpand: v }))}
                loading={aiLoading.worldExpand}
                prompt={`以下の創作設定メモを読んで、含意・伏線の可能性・派生しうる要素・見落とされがちな矛盾を簡潔に指摘してください。箇条書きで3〜5点。\n\n【${settingsTab === "world" ? "世界観" : settingsTab === "characters" ? "キャラクター" : "テーマ"}】\n${settings[settingsTab]}`}
                onAppend={text => setSettings(prev => ({ ...prev, [settingsTab]: prev[settingsTab] + "\n\n---AI拡張---\n" + text }))}
              />
            </div>
          )}
          {tab === "prefs" && (
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
          )}
        </main>
      </div>

      {/* AI Assistant overlay */}
      {tab === "write" && selectedScene && (
        <>
          {showSettings && aiFloat && (
            <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
          )}
          <div style={{
            position: "fixed", top: 44, right: 0, bottom: 0, zIndex: 201,
            width: showSettings ? (aiWide ? 420 : 300) : 0,
            background: "#080c16", borderLeft: showSettings ? "1px solid #1e2d42" : "none",
            overflow: "hidden", transition: "width 0.2s ease",
            display: "flex", flexDirection: "column",
            ...(aiFloat && showSettings ? { boxShadow: "-4px 0 20px rgba(0,0,0,0.6)" } : {}),
          }}>
            {showSettings && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* パネルヘッダー */}
                <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #1e2d42", gap: 6, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#4a6fa5", flex: 1 }}>AI アシスト</div>
                  <button onClick={() => setAiFloat(!aiFloat)} style={{ padding: "3px 8px", background: "transparent", border: "1px solid #1e2d42", color: aiFloat ? "#4a6fa5" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit", borderRadius: 3 }} title={aiFloat ? "固定表示に切替" : "フロート表示に切替"}>{aiFloat ? "浮" : "固"}</button>
                  <button onClick={() => setAiWide(!aiWide)} style={{ padding: "3px 8px", background: "transparent", border: "1px solid #1e2d42", color: aiWide ? "#4a6fa5" : "#2a4060", cursor: "pointer", fontSize: 10, fontFamily: "inherit", borderRadius: 3 }} title={aiWide ? "幅を狭く" : "幅を広く"}>{aiWide ? "◂" : "▸"}</button>
                  <button onClick={() => setShowSettings(false)} style={{ background: "transparent", border: "none", color: "#3a5570", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>✕</button>
                </div>
                <div style={{ padding: 16, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                  <PolishPanel
                    manuscriptText={manuscriptText}
                    result={aiResults.polish}
                    onResult={t => setAiResults(r => ({ ...r, polish: t }))}
                    loading={aiLoading.polish}
                    onLoading={v => setAiLoading(l => ({ ...l, polish: v }))}
                    applied={aiApplied}
                    onApplied={setAiApplied}
                    onApply={(original, replacement) => {
                      const idx = manuscriptText.indexOf(original);
                      if (idx === -1) return;
                      const next = manuscriptText.slice(0, idx) + replacement + manuscriptText.slice(idx + original.length);
                      handleManuscriptChange(next);
                    }}
                  />
                  <HintPanel
                    result={aiResults.hint}
                    onResult={t => setAiResults(r => ({ ...r, hint: t }))}
                    loading={aiLoading.hint}
                    onLoading={v => setAiLoading(l => ({ ...l, hint: v }))}
                    applied={hintApplied}
                    onApplied={setHintApplied}
                    manuscriptText={manuscriptText}
                    onInsert={handleManuscriptChange}
                    prompt={`以下の世界観・設定と現在のシーンを踏まえて、このシーンをより良くするヒントを3点挙げてください。\n\n【世界観】${settings.world}\n【キャラクター】${settings.characters}\n【テーマ】${settings.theme}\n\n【シーン】${selectedScene.chapter} / ${selectedScene.title}\n【概要】${selectedScene.synopsis || "なし"}\n【本文末尾】${manuscriptText.slice(-300)}`}
                  />
                  <AiPanel
                    label="矛盾チェック"
                    result={aiResults.check}
                    onResult={t => setAiResults(r => ({ ...r, check: t }))}
                    onLoading={v => setAiLoading(l => ({ ...l, check: v }))}
                    loading={aiLoading.check}
                    prompt={`以下の世界観設定と本文を照らし合わせて、設定との矛盾や違和感があれば指摘してください。なければ「矛盾なし」と答えてください。\n\n【世界観】${settings.world}\n【キャラクター】${settings.characters}\n\n【本文】${manuscriptText.slice(-800)}`}
                    onAppend={() => {}}
                  />
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setShowSettings(!showSettings)} style={{
            position: "fixed", bottom: 24, right: 16, zIndex: 202,
            padding: "8px 14px", background: "#0e1520", border: "1px solid #2a4060",
            color: "#4a6fa5", cursor: "pointer", borderRadius: 20,
            fontSize: 11, fontFamily: "inherit", letterSpacing: 1,
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}>✦ AI</button>
        </>
      )}
    </div>
  );
}
