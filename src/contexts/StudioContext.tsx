import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { storageGet, storageSet } from "../utils/storage";
import type {
  SceneStatus, Scene, Settings, Manuscripts, AppliedState,
  AiResults, AiLoading, AiErrors, Backup, SceneDraft, EditorSettings, TabKey, SidebarTabKey, SaveStatus, AiHistoryItem
} from "../types";
import { initialSettings, initialScenes } from "../constants";

interface StudioContextType {
  loaded: boolean;
  saveStatus: SaveStatus;
  lastSavedTime: Date | null;
  tab: TabKey;
  setTab: React.Dispatch<React.SetStateAction<TabKey>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  settingsTab: keyof Settings;
  setSettingsTab: React.Dispatch<React.SetStateAction<keyof Settings>>;
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  selectedSceneId: number | null;
  setSelectedSceneId: React.Dispatch<React.SetStateAction<number | null>>;
  manuscripts: Manuscripts;
  setManuscripts: React.Dispatch<React.SetStateAction<Manuscripts>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newScene: SceneDraft;
  setNewScene: React.Dispatch<React.SetStateAction<SceneDraft>>;
  addingScene: boolean;
  setAddingScene: React.Dispatch<React.SetStateAction<boolean>>;
  confirmDelete: number | null;
  setConfirmDelete: React.Dispatch<React.SetStateAction<number | null>>;
  addingChapter: boolean;
  setAddingChapter: React.Dispatch<React.SetStateAction<boolean>>;
  projectTitle: string;
  setProjectTitle: React.Dispatch<React.SetStateAction<string>>;
  editingTitle: boolean;
  setEditingTitle: React.Dispatch<React.SetStateAction<boolean>>;
  showExport: boolean;
  setShowExport: React.Dispatch<React.SetStateAction<boolean>>;
  sceneSearch: string;
  setSceneSearch: React.Dispatch<React.SetStateAction<string>>;
  backups: Backup[];
  setBackups: React.Dispatch<React.SetStateAction<Backup[]>>;
  showBackups: boolean;
  setShowBackups: React.Dispatch<React.SetStateAction<boolean>>;
  verticalPreview: boolean;
  setVerticalPreview: React.Dispatch<React.SetStateAction<boolean>>;
  editingSceneTitle: boolean;
  setEditingSceneTitle: React.Dispatch<React.SetStateAction<boolean>>;
  editingSceneSynopsis: boolean;
  setEditingSceneSynopsis: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarFloat: boolean;
  setSidebarFloat: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarTab: SidebarTabKey;
  setSidebarTab: React.Dispatch<React.SetStateAction<SidebarTabKey>>;
  editorSettings: EditorSettings;
  setEditorSettings: React.Dispatch<React.SetStateAction<EditorSettings>>;
  aiFloat: boolean;
  setAiFloat: React.Dispatch<React.SetStateAction<boolean>>;
  aiWide: boolean;
  setAiWide: React.Dispatch<React.SetStateAction<boolean>>;
  aiResults: AiResults;
  setAiResults: React.Dispatch<React.SetStateAction<AiResults>>;
  aiErrors: AiErrors;
  setAiErrors: React.Dispatch<React.SetStateAction<AiErrors>>;
  aiLoading: AiLoading;
  setAiLoading: React.Dispatch<React.SetStateAction<AiLoading>>;
  aiApplied: AppliedState;
  setAiApplied: React.Dispatch<React.SetStateAction<AppliedState>>;
  hintApplied: AppliedState;
  setHintApplied: React.Dispatch<React.SetStateAction<AppliedState>>;
  aiHistory: AiHistoryItem[];
  addAiHistory: (label: string, content: string, sceneTitle?: string) => void;
  clearAiHistory: () => void;
  autoBackups: Backup[];
  selectedScene: Scene | null;
  manuscriptText: string;
  wordCount: number;
  handleSceneSelect: (scene: Scene) => void;
  handleManuscriptChange: (text: string) => void;
  handleStatusChange: (id: number, status: SceneStatus) => void;
  handleAddScene: () => void;
  handleDeleteScene: (id: number) => void;
  confirmDeleteExecute: () => void;
  saveWithBackup: (sc: Scene[], st: Settings, ms: Manuscripts, pt: string, label?: string | null) => Promise<void>;
  exportScene: (fmt: "md" | "txt") => void;
  exportAll: (fmt: "md" | "txt") => void;
  handleSaveBackup: (label: string | null) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children, user }: { children: React.ReactNode, user: User }) {
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
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({ fontSize: 15, lineHeight: 2.2, colorTheme: "dark" });
  const [aiFloat, setAiFloat] = useState(false);
  const [aiWide, setAiWide] = useState(false);
  const [aiResults, setAiResults] = useState<AiResults>({ polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" });
  const [aiErrors, setAiErrors] = useState<AiErrors>({ polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" });
  const [aiLoading, setAiLoading] = useState<AiLoading>({ polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false, freeInstruct: false });
  const [aiApplied, setAiApplied] = useState<AppliedState>({});
  const [hintApplied, setHintApplied] = useState<AppliedState>({});
  const [aiHistory, setAiHistory] = useState<AiHistoryItem[]>([]);
  const [autoBackups, setAutoBackups] = useState<Backup[]>([]);
  
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
      setLoaded(false);
      const [sc, st, ms, pt, bk, es, ah, ab, sf, af] = await Promise.all([
        storageGet<Scene[]>("minato:scenes"),
        storageGet<Settings>("minato:settings"),
        storageGet<Manuscripts>("minato:manuscripts"),
        storageGet<string>("minato:title"),
        storageGet<Backup[]>("minato:backups"),
        storageGet<EditorSettings>("minato:editorSettings"),
        storageGet<AiHistoryItem[]>("minato:aiHistory"),
        storageGet<Backup[]>("minato:autoBackups"),
        storageGet<boolean>("minato:sidebarFloat"),
        storageGet<boolean>("minato:aiFloat"),
      ]);
      if (sc) setScenes(sc);
      if (st) setSettings(st);
      if (ms) setManuscripts(ms);
      if (pt !== null) setProjectTitle(pt);
      if (bk) setBackups(bk);
      if (es) setEditorSettings(es);
      if (ah) setAiHistory(ah);
      if (ab) setAutoBackups(ab);
      if (sf !== null) setSidebarFloat(sf);
      if (af !== null) setAiFloat(af);
      setLoaded(true);
    })();
  }, [user?.id]);

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
        storageSet("minato:sidebarFloat", sidebarFloat),
        storageSet("minato:aiFloat", aiFloat),
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
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, backups, aiHistory, autoBackups, sidebarFloat, aiFloat, loaded]);

  useEffect(() => {
    syncAllRef.current = syncAll;
  }, [syncAll]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(syncAll, 1000);
    return () => clearTimeout(t);
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, sidebarFloat, aiFloat, loaded, syncAll]);

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
      const newBackup = { timestamp: new Date().toISOString(), label, scenes: sc, manuscripts: ms, settings: st, projectTitle: pt };
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

  useEffect(() => { latestStateRef.current = { scenes, manuscripts }; }, [scenes, manuscripts]);

  const addAiHistory = useCallback((label: string, content: string, sceneTitle?: string) => {
    if (!content.trim()) return;
    const item: AiHistoryItem = { id: Date.now(), timestamp: new Date().toISOString(), label, content, sceneTitle };
    setAiHistory(prev => [item, ...prev].slice(0, 30));
  }, []);

  const clearAiHistory = useCallback(() => { setAiHistory([]); storageSet("minato:aiHistory", []); }, []);

  useEffect(() => {
    const applyTheme = (theme: "dark" | "light" | "system") => {
      if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
    };
    const currentTheme = editorSettings.colorTheme ?? "dark";
    applyTheme(currentTheme);
    if (currentTheme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [editorSettings.colorTheme]);

  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      const { scenes: sc, manuscripts: ms } = latestStateRef.current;
      const newAutoBackup: Backup = { timestamp: new Date().toISOString(), label: null, scenes: sc, manuscripts: ms, settings, projectTitle };
      setAutoBackups(prev => [newAutoBackup, ...prev].slice(0, 5));
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loaded, settings, projectTitle]);

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
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`${filename} を出力しました。`);
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
      settings,
      projectTitle,
    };
    const updated = [newBackup, ...backups].slice(0, 5);
    setBackups(updated);
    storageSet("minato:backups", updated);
  };

  const value: StudioContextType = {
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

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
