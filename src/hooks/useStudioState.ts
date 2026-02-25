import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type {
  SceneStatus, Scene, Settings, Manuscripts, AppliedState,
  AiResults, AiLoading, Backup, SceneDraft, EditorSettings, TabKey, SaveStatus
} from "../types";
import { initialSettings, initialScenes } from "../constants";

async function storageGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("minato_data")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", key)
      .single();
    return data ? data.value : null;
  } catch { return null; }
}

async function storageSet(key: string, value: unknown): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("minato_data").upsert({
      user_id: user.id,
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,key" });
  } catch (e) { console.error(e); }
}

export function useStudioState(user: User) {
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [tab, setTab] = useState<TabKey>("write");
  const [settings, setSettings] = useState(initialSettings);
  const [settingsTab, setSettingsTab] = useState<keyof Settings>("world");
  const [scenes, setScenes] = useState(initialScenes);
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [manuscripts, setManuscripts] = useState<Manuscripts>({});
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newScene, setNewScene] = useState<SceneDraft>({ chapter: "", title: "", synopsis: "" });
  const [addingScene, setAddingScene] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [addingChapter, setAddingChapter] = useState(false);
  const [projectTitle, setProjectTitle] = useState("港に届いた例外");
  const [editingTitle, setEditingTitle] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [sceneSearch, setSceneSearch] = useState("");
  const [backups, setBackups] = useState<Backup[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [verticalPreview, setVerticalPreview] = useState(false);
  const [editingSceneTitle, setEditingSceneTitle] = useState(false);
  const [editingSceneSynopsis, setEditingSceneSynopsis] = useState(false);
  const [sidebarFloat, setSidebarFloat] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<TabKey>("write");
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({ fontSize: 15, lineHeight: 2.2 });
  const [aiFloat, setAiFloat] = useState(false);
  const [aiWide, setAiWide] = useState(false);
  const [aiResults, setAiResults] = useState<AiResults>({ polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "" });
  const [aiLoading, setAiLoading] = useState<AiLoading>({ polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false });
  const [aiApplied, setAiApplied] = useState<AppliedState>({});
  const [hintApplied, setHintApplied] = useState<AppliedState>({});
  const [exportContent, setExportContent] = useState<string>("");
  const [showExportContent, setShowExportContent] = useState<boolean>(false);

  const selectedScene = scenes.find(s => s.id === selectedSceneId) || null;
  const manuscriptText = selectedSceneId ? (manuscripts[selectedSceneId] || "") : "";
  const wordCount = manuscriptText.replace(/\s/g, "").length;

  useEffect(() => {
    (async () => {
      const [sc, st, ms, pt, bk, es] = await Promise.all([
        storageGet<Scene[]>("minato:scenes"),
        storageGet<Settings>("minato:settings"),
        storageGet<Manuscripts>("minato:manuscripts"),
        storageGet<string>("minato:title"),
        storageGet<Backup[]>("minato:backups"),
        storageGet<EditorSettings>("minato:editorSettings"),
      ]);
      if (sc) setScenes(sc);
      if (st) setSettings(st);
      if (ms) setManuscripts(ms);
      if (pt) setProjectTitle(pt);
      if (bk) setBackups(bk);
      if (es) setEditorSettings(es);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storageSet("minato:editorSettings", editorSettings);
  }, [editorSettings, loaded]);

  const saveWithBackup = async (sc: Scene[], st: Settings, ms: Manuscripts, pt: string, label: string | null = null) => {
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

  const handleSceneSelect = (scene: Scene) => { setSelectedSceneId(scene.id); setTab("write"); };
  const handleManuscriptChange = (text: string) => setManuscripts(prev => ({ ...prev, [selectedSceneId as number]: text }));
  const handleStatusChange = (id: number, status: SceneStatus) => setScenes(scenes.map(s => s.id === id ? { ...s, status } : s));
  const handleAddScene = () => {
    const scene = { ...newScene, id: Date.now(), status: "empty" };
    setScenes([...scenes, scene]);
    setNewScene({ chapter: "", title: "", synopsis: "" });
    setAddingScene(false);
  };
  const handleDeleteScene = (id: number) => setConfirmDelete(id);
  const confirmDeleteExecute = () => {
    const id = confirmDelete;
    if (id === null) return;
    setScenes(prev => prev.filter(s => s.id !== id));
    if (selectedSceneId === id) setSelectedSceneId(null);
    setManuscripts(prev => { const n = { ...prev }; delete n[id]; return n; });
    setConfirmDelete(null);
  };

  const downloadFile = (content: string) => {
    setExportContent(content);
    setShowExportContent(true);
  };

  const exportScene = (fmt: "md" | "txt") => {
    if (!selectedScene) return;
    const text = manuscripts[selectedScene.id] || "";
    const content = fmt === "md"
      ? `# ${selectedScene.chapter} — ${selectedScene.title}

${selectedScene.synopsis ? `> ${selectedScene.synopsis}

` : ""}${text}`
      : `${selectedScene.chapter} — ${selectedScene.title}
${"=".repeat(30)}
${selectedScene.synopsis ? `${selectedScene.synopsis}

` : ""}${text}`;
    downloadFile(content);
    setShowExport(false);
  };

  const exportAll = (fmt: "md" | "txt") => {
    const content = fmt === "md"
      ? `# ${projectTitle}

` + scenes.map(s => `## ${s.chapter} — ${s.title}

${s.synopsis ? `> ${s.synopsis}

` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("

---

")
      : scenes.map(s => `${s.chapter} — ${s.title}
${"=".repeat(30)}
${s.synopsis ? `${s.synopsis}

` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("

" + "─".repeat(40) + "

");
    downloadFile(content);
    setShowExport(false);
  };

  const handleSaveBackup = (label: string | null) => {
    const newBackup = {
      timestamp: new Date().toISOString(),
      label,
      scenes,
      manuscripts,
    };
    const updated = [newBackup, ...backups].slice(0, 5);
    setBackups(updated);
    storageSet("minato:backups", updated);
  };

  return {
    loaded, saveStatus, lastSavedTime, tab, setTab, settings, setSettings,
    settingsTab, setSettingsTab, scenes, setScenes, selectedSceneId, setSelectedSceneId,
    manuscripts, setManuscripts, showSettings, setShowSettings, sidebarOpen, setSidebarOpen,
    newScene, setNewScene, addingScene, setAddingScene, confirmDelete, setConfirmDelete,
    addingChapter, setAddingChapter, projectTitle, setProjectTitle, editingTitle, setEditingTitle,
    showExport, setShowExport, sceneSearch, setSceneSearch, backups, setBackups,
    showBackups, setShowBackups, verticalPreview, setVerticalPreview,
    editingSceneTitle, setEditingSceneTitle, editingSceneSynopsis, setEditingSceneSynopsis,
    sidebarFloat, setSidebarFloat, sidebarTab, setSidebarTab, editorSettings, setEditorSettings,
    aiFloat, setAiFloat, aiWide, setAiWide, aiResults, setAiResults, aiLoading, setAiLoading,
    aiApplied, setAiApplied, hintApplied, setHintApplied, exportContent, setExportContent,
    showExportContent, setShowExportContent, selectedScene, manuscriptText, wordCount,
    handleSceneSelect, handleManuscriptChange, handleStatusChange, handleAddScene,
    handleDeleteScene, confirmDeleteExecute, saveWithBackup, exportScene, exportAll,
    handleSaveBackup
  };
}
