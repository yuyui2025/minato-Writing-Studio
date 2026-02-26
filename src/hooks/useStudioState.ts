import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type {
  SceneStatus, Scene, Settings, Manuscripts, AppliedState,
  AiResults, AiLoading, AiErrors, Backup, SceneDraft, EditorSettings, TabKey, SidebarTabKey, SaveStatus, AiHistoryItem
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
  const [sidebarTab, setSidebarTab] = useState<SidebarTabKey>("write");
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({ fontSize: 15, lineHeight: 2.2 });
  const [aiFloat, setAiFloat] = useState(false);
  const [aiWide, setAiWide] = useState(false);
  const [aiResults, setAiResults] = useState<AiResults>({ polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" });
  const [aiErrors, setAiErrors] = useState<AiErrors>({ polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" });
  const [aiLoading, setAiLoading] = useState<AiLoading>({ polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false, freeInstruct: false });
  const [aiApplied, setAiApplied] = useState<AppliedState>({});
  const [hintApplied, setHintApplied] = useState<AppliedState>({});
  const [aiHistory, setAiHistory] = useState<AiHistoryItem[]>([]);
  const [autoBackups, setAutoBackups] = useState<Backup[]>([]);
  const [exportContent, setExportContent] = useState<string>("");
  const [showExportContent, setShowExportContent] = useState<boolean>(false);
  const previousIsOnlineRef = useRef(navigator.onLine);
  const syncAllRef = useRef<() => Promise<void>>(async () => {});
  const latestStateRef = useRef({ scenes: initialScenes, manuscripts: {} as Manuscripts });

  const selectedScene = useMemo(
    () => scenes.find(s => s.id === selectedSceneId) ?? null,
    [scenes, selectedSceneId]
  );
  const manuscriptText = useMemo(
    () => (selectedSceneId ? (manuscripts[selectedSceneId] ?? "") : ""),
    [manuscripts, selectedSceneId]
  );
  const wordCount = useMemo(
    () => manuscriptText.replace(/\s/g, "").length,
    [manuscriptText]
  );

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
      const [sc, st, ms, pt, bk, es, ah, ab] = await Promise.all([
        storageGet<Scene[]>("minato:scenes"),
        storageGet<Settings>("minato:settings"),
        storageGet<Manuscripts>("minato:manuscripts"),
        storageGet<string>("minato:title"),
        storageGet<Backup[]>("minato:backups"),
        storageGet<EditorSettings>("minato:editorSettings"),
        storageGet<AiHistoryItem[]>("minato:aiHistory"),
        storageGet<Backup[]>("minato:autoBackups"),
      ]);
      if (sc) setScenes(sc);
      if (st) setSettings(st);
      if (ms) setManuscripts(ms);
      if (pt) setProjectTitle(pt);
      if (bk) setBackups(bk);
      if (es) setEditorSettings(es);
      if (ah) setAiHistory(ah);
      if (ab) setAutoBackups(ab);
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
        storageSet("minato:backups", backups),
        storageSet("minato:aiHistory", aiHistory),
        storageSet("minato:autoBackups", autoBackups),
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
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, backups, aiHistory, autoBackups, loaded]);

  useEffect(() => {
    syncAllRef.current = syncAll;
  }, [syncAll]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(syncAll, 1000);
    return () => clearTimeout(t);
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, loaded, syncAll]);

  // Force sync when coming back online
  useEffect(() => {
    if (!loaded) return;
    const wasOnline = previousIsOnlineRef.current;
    if (!wasOnline && isOnline) {
      syncAllRef.current();
    }
    previousIsOnlineRef.current = isOnline;
  }, [isOnline, loaded]);

  const saveWithBackup = async (sc: Scene[], st: Settings, ms: Manuscripts, pt: string, label: string | null = null) => {
    setSaveStatus("saving");
    try {
      const newBackup = { timestamp: new Date().toISOString(), label, scenes: sc, manuscripts: ms };
      const updatedBackups = [newBackup, ...backups].slice(0, 5);
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

  // Keep latestStateRef current for use in the auto-backup timer
  useEffect(() => { latestStateRef.current = { scenes, manuscripts }; }, [scenes, manuscripts]);

  const addAiHistory = useCallback((label: string, content: string, sceneTitle?: string) => {
    if (!content.trim()) return;
    const item: AiHistoryItem = { id: Date.now(), timestamp: new Date().toISOString(), label, content, sceneTitle };
    setAiHistory(prev => [item, ...prev].slice(0, 30));
  }, []);

  const clearAiHistory = useCallback(() => { setAiHistory([]); storageSet("minato:aiHistory", []); }, []);

  // Auto-backup every 10 minutes
  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      const { scenes: sc, manuscripts: ms } = latestStateRef.current;
      const newAutoBackup: Backup = { timestamp: new Date().toISOString(), label: null, scenes: sc, manuscripts: ms };
      setAutoBackups(prev => [newAutoBackup, ...prev].slice(0, 5));
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loaded]);

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
    aiFloat, setAiFloat, aiWide, setAiWide, aiResults, setAiResults, aiErrors, setAiErrors, aiLoading, setAiLoading,
    aiApplied, setAiApplied, hintApplied, setHintApplied,
    aiHistory, addAiHistory, clearAiHistory, autoBackups,
    selectedScene, manuscriptText, wordCount,
    handleSceneSelect, handleManuscriptChange, handleStatusChange, handleAddScene,
    handleDeleteScene, confirmDeleteExecute, saveWithBackup, exportScene, exportAll,
    handleSaveBackup
  };
}
