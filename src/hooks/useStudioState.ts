import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type {
  SceneStatus, Scene, Settings, Manuscripts, AppliedState,
  AiResults, AiLoading, AiErrors, Backup, SceneDraft, EditorSettings, TabKey, SaveStatus
} from "../types";
import { initialSettings, initialScenes } from "../constants";

interface StoredData<T> {
  value: T;
  updated_at: string;
}

async function storageGet<T = unknown>(key: string): Promise<T | null> {
  // 1. Get from LocalStorage
  const localRaw = localStorage.getItem(key);
  const localData: StoredData<T> | null = localRaw ? JSON.parse(localRaw) : null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localData?.value || null;

    // 2. Get from Supabase
    const { data, error } = await supabase
      .from("minato_data")
      .select("value, updated_at")
      .eq("user_id", user.id)
      .eq("key", key)
      .single();

    if (error || !data) return localData?.value || null;

    const remoteData: StoredData<T> = { value: data.value, updated_at: data.updated_at };

    // 3. Compare timestamps
    if (!localData || new Date(remoteData.updated_at) > new Date(localData.updated_at)) {
      // Remote is newer or local is missing
      localStorage.setItem(key, JSON.stringify(remoteData));
      return remoteData.value;
    }
    return localData.value;
  } catch {
    return localData?.value || null;
  }
}

async function storageSet(key: string, value: unknown): Promise<boolean> {
  const updatedAt = new Date().toISOString();
  const data = { value, updated_at: updatedAt };
  
  // Always save to localStorage first
  localStorage.setItem(key, JSON.stringify(data));

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("minato_data").upsert({
      user_id: user.id,
      key,
      value,
      updated_at: updatedAt,
    }, { onConflict: "user_id,key" });

    return !error;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function useStudioState(_user: User) {
  const [loaded, setLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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
  const [aiErrors, setAiErrors] = useState<AiErrors>({ polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "" });
  const [aiLoading, setAiLoading] = useState<AiLoading>({ polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false });
  const [aiApplied, setAiApplied] = useState<AppliedState>({});
  const [hintApplied, setHintApplied] = useState<AppliedState>({});
  // バックアップが信頼できるソース（localStorage/Supabase）から読み込まれたか追跡
  const backupsConfirmed = useRef(false);

  const selectedScene = scenes.find(s => s.id === selectedSceneId) || null;
  const manuscriptText = selectedSceneId ? (manuscripts[selectedSceneId] || "") : "";
  const wordCount = manuscriptText.replace(/\s/g, "").length;

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    (async () => {
      setLoaded(false); // Reload data when user changes
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
      if (bk) { setBackups(bk); backupsConfirmed.current = true; }
      if (es) setEditorSettings(es);
      setLoaded(true);
    })();
  }, [_user?.id]); // Re-run when user logs in/out

  const syncAll = useCallback(async () => {
    if (!loaded) return;
    setSaveStatus("saving");
    try {
      const results = await Promise.all([
        storageSet("minato:scenes", scenes),
        storageSet("minato:settings", settings),
        storageSet("minato:manuscripts", manuscripts),
        storageSet("minato:title", projectTitle),
        storageSet("minato:editorSettings", editorSettings),
        // バックアップはsaveWithBackup/handleSaveBackupで明示的に管理する
        // ここで同期すると、オフライン初期ロード時の空配列でSupabaseを上書きしてしまうため
      ]);

      const allSuccess = results.every(r => r);
      if (allSuccess) {
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      } else {
        setSaveStatus(navigator.onLine ? "error" : "offline");
      }
    } catch {
      setSaveStatus("error");
    }
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(syncAll, 1000);
    return () => clearTimeout(t);
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, loaded, syncAll]);

  // Force sync when coming back online
  useEffect(() => {
    if (isOnline && loaded) syncAll();
  }, [isOnline, loaded, syncAll]);

  // オフラインで作成したバックアップをオンライン復帰時に同期
  useEffect(() => {
    if (isOnline && loaded && backupsConfirmed.current && backups.length > 0) {
      storageSet("minato:backups", backups);
    }
  }, [isOnline, loaded, backups]);

  const saveWithBackup = async (sc: Scene[], st: Settings, ms: Manuscripts, pt: string, label: string | null = null) => {
    setSaveStatus("saving");
    try {
      // オフライン初期ロードで backups が未確認の場合、最新を取得してから追記
      let baseBackups = backups;
      if (!backupsConfirmed.current) {
        const fetched = await storageGet<Backup[]>("minato:backups");
        if (fetched) { baseBackups = fetched; setBackups(fetched); }
        backupsConfirmed.current = true;
      }

      const newBackup = { timestamp: new Date().toISOString(), label, scenes: sc, manuscripts: ms };
      const updatedBackups = [newBackup, ...baseBackups].slice(0, 5);
      setBackups(updatedBackups);

      const success = await Promise.all([
        storageSet("minato:scenes", sc),
        storageSet("minato:settings", st),
        storageSet("minato:manuscripts", ms),
        storageSet("minato:title", pt),
        storageSet("minato:backups", updatedBackups),
      ]);

      if (success.every(r => r)) {
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      } else {
        setSaveStatus(navigator.onLine ? "error" : "offline");
      }
    } catch { setSaveStatus("error"); }
  };

  const handleSceneSelect = (scene: Scene) => { setSelectedSceneId(scene.id); setTab("write"); };
  const handleManuscriptChange = (text: string) => setManuscripts(prev => ({ ...prev, [selectedSceneId as number]: text }));
  const handleStatusChange = (id: number, status: SceneStatus) => setScenes(scenes.map(s => s.id === id ? { ...s, status } : s));
  const handleAddScene = () => {
    const scene: Scene = { ...newScene, id: Date.now(), status: "empty" };
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

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportScene = (fmt: "md" | "txt") => {
    if (!selectedScene) return;
    const text = manuscripts[selectedScene.id] || "";
    const content = fmt === "md"
      ? `# ${selectedScene.chapter} — ${selectedScene.title}\n\n${selectedScene.synopsis ? `> ${selectedScene.synopsis}\n\n` : ""}${text}`
      : `${selectedScene.chapter} — ${selectedScene.title}\n${"=".repeat(30)}\n${selectedScene.synopsis ? `${selectedScene.synopsis}\n\n` : ""}${text}`;
    downloadFile(content, `${selectedScene.title}.${fmt}`);
    setShowExport(false);
  };

  const exportAll = (fmt: "md" | "txt") => {
    const content = fmt === "md"
      ? `# ${projectTitle}\n\n` + scenes.map(s => `## ${s.chapter} — ${s.title}\n\n${s.synopsis ? `> ${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n---\n\n")
      : scenes.map(s => `${s.chapter} — ${s.title}\n${"=".repeat(30)}\n${s.synopsis ? `${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n" + "─".repeat(40) + "\n\n");
    downloadFile(content, `${projectTitle}.${fmt}`);
    setShowExport(false);
  };

  const handleSaveBackup = async (label: string | null) => {
    let baseBackups = backups;
    if (!backupsConfirmed.current) {
      const fetched = await storageGet<Backup[]>("minato:backups");
      if (fetched) { baseBackups = fetched; setBackups(fetched); }
      backupsConfirmed.current = true;
    }
    const newBackup = { timestamp: new Date().toISOString(), label, scenes, manuscripts };
    const updated = [newBackup, ...baseBackups].slice(0, 5);
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
    aiFloat, setAiFloat, aiWide, setAiWide, aiResults, setAiResults, aiErrors, setAiErrors, aiLoading, setAiLoading,
    aiApplied, setAiApplied, hintApplied, setHintApplied,
    selectedScene, manuscriptText, wordCount,
    handleSceneSelect, handleManuscriptChange, handleStatusChange, handleAddScene,
    handleDeleteScene, confirmDeleteExecute, saveWithBackup, exportScene, exportAll,
    handleSaveBackup
  };
}
