import { create } from "zustand";
import type {
  SceneStatus, Scene, Settings, Manuscripts, AppliedState,
  AiResults, AiLoading, AiErrors, Backup, SceneDraft, EditorSettings, TabKey, SidebarTabKey, SaveStatus, AiHistoryItem
} from "../types";
import { initialSettings, initialScenes } from "../constants";
import { storageSet } from "../utils/storage";

interface StudioState {
  // State
  loaded: boolean;
  saveStatus: SaveStatus;
  lastSavedTime: Date | null;
  tab: TabKey;
  settings: Settings;
  settingsTab: keyof Settings;
  scenes: Scene[];
  selectedSceneId: number | null;
  manuscripts: Manuscripts;
  showSettings: boolean;
  sidebarOpen: boolean;
  newScene: SceneDraft;
  addingScene: boolean;
  confirmDelete: number | null;
  addingChapter: boolean;
  projectTitle: string;
  editingTitle: boolean;
  showExport: boolean;
  sceneSearch: string;
  backups: Backup[];
  showBackups: boolean;
  verticalPreview: boolean;
  editingSceneTitle: boolean;
  editingSceneSynopsis: boolean;
  sidebarFloat: boolean;
  sidebarTab: SidebarTabKey;
  editorSettings: EditorSettings;
  aiFloat: boolean;
  aiWide: boolean;
  aiResults: AiResults;
  aiErrors: AiErrors;
  aiLoading: AiLoading;
  aiApplied: AppliedState;
  hintApplied: AppliedState;
  aiHistory: AiHistoryItem[];
  autoBackups: Backup[];

  // Derived (Computed)
  selectedScene: Scene | null;
  manuscriptText: string;
  wordCount: number;
  
  // Actions
  setLoaded: (loaded: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedTime: (time: Date | null) => void;
  setTab: (tab: TabKey) => void;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
  setSettingsTab: (tab: keyof Settings) => void;
  setScenes: (scenes: Scene[] | ((prev: Scene[]) => Scene[])) => void;
  setSelectedSceneId: (id: number | null) => void;
  setManuscripts: (manuscripts: Manuscripts | ((prev: Manuscripts) => Manuscripts)) => void;
  setShowSettings: (show: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setNewScene: (scene: SceneDraft) => void;
  setAddingScene: (adding: boolean) => void;
  setConfirmDelete: (id: number | null) => void;
  setAddingChapter: (adding: boolean) => void;
  setProjectTitle: (title: string) => void;
  setEditingTitle: (editing: boolean) => void;
  setShowExport: (show: boolean) => void;
  setSceneSearch: (search: string) => void;
  setBackups: (backups: Backup[]) => void;
  setShowBackups: (show: boolean) => void;
  setVerticalPreview: (vertical: boolean) => void;
  setEditingSceneTitle: (editing: boolean) => void;
  setEditingSceneSynopsis: (editing: boolean) => void;
  setSidebarFloat: (float: boolean) => void;
  setSidebarTab: (tab: SidebarTabKey) => void;
  setEditorSettings: (settings: EditorSettings | ((prev: EditorSettings) => EditorSettings)) => void;
  setAiFloat: (float: boolean) => void;
  setAiWide: (wide: boolean) => void;
  setAiResults: (results: AiResults | ((prev: AiResults) => AiResults)) => void;
  setAiErrors: (errors: AiErrors | ((prev: AiErrors) => AiErrors)) => void;
  setAiLoading: (loading: AiLoading | ((prev: AiLoading) => AiLoading)) => void;
  setAiApplied: (applied: AppliedState | ((prev: AppliedState) => AppliedState)) => void;
  setHintApplied: (applied: AppliedState | ((prev: AppliedState) => AppliedState)) => void;
  setAutoBackups: (backups: Backup[] | ((prev: Backup[]) => Backup[])) => void;
  setAiHistory: (history: AiHistoryItem[] | ((prev: AiHistoryItem[]) => AiHistoryItem[])) => void;

  // Complex Actions
  addAiHistory: (label: string, content: string, sceneTitle?: string) => void;
  clearAiHistory: () => void;
  handleSceneSelect: (scene: Scene) => void;
  handleManuscriptChange: (text: string) => void;
  handleStatusChange: (id: number, status: SceneStatus) => void;
  handleAddScene: () => void;
  handleDeleteScene: (id: number) => void;
  confirmDeleteExecute: () => void;
  saveWithBackup: (sc: Scene[], st: Settings, ms: Manuscripts, pt: string, label?: string | null) => Promise<void>;
  handleSaveBackup: (label: string | null) => void;
  exportScene: (fmt: "md" | "txt") => void;
  exportAll: (fmt: "md" | "txt") => void;
}

export const useStudioStore = create<StudioState>((set, get) => {
  // Derived state updater
  const updateDerived = (state: Partial<StudioState>) => {
    const nextScenes = state.scenes ?? get().scenes;
    const nextManuscripts = state.manuscripts ?? get().manuscripts;
    const nextSelectedId = state.selectedSceneId !== undefined ? state.selectedSceneId : get().selectedSceneId;

    const selectedScene = nextScenes.find(s => s.id === nextSelectedId) ?? null;
    const manuscriptText = nextSelectedId ? (nextManuscripts[nextSelectedId] ?? "") : "";
    const wordCount = manuscriptText.replace(/\s/g, "").length;

    return { selectedScene, manuscriptText, wordCount };
  };

  return {
    // Initial State
    loaded: false,
    saveStatus: "saved",
    lastSavedTime: null,
    tab: "write",
    settings: initialSettings,
    settingsTab: "world",
    scenes: initialScenes,
    selectedSceneId: null,
    manuscripts: {},
    showSettings: false,
    sidebarOpen: true,
    newScene: { chapter: "", title: "", synopsis: "" },
    addingScene: false,
    confirmDelete: null,
    addingChapter: false,
    projectTitle: "港に届いた例外",
    editingTitle: false,
    showExport: false,
    sceneSearch: "",
    backups: [],
    showBackups: false,
    verticalPreview: false,
    editingSceneTitle: false,
    editingSceneSynopsis: false,
    sidebarFloat: true,
    sidebarTab: "write",
    editorSettings: { fontSize: 15, lineHeight: 2.2, colorTheme: "dark" },
    aiFloat: false,
    aiWide: false,
    aiResults: { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" },
    aiErrors: { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" },
    aiLoading: { polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false, freeInstruct: false },
    aiApplied: {},
    hintApplied: {},
    aiHistory: [],
    autoBackups: [],

    // Initial Derived
    selectedScene: null,
    manuscriptText: "",
    wordCount: 0,

    // Setters
    setLoaded: (v) => set({ loaded: v }),
    setSaveStatus: (v) => set({ saveStatus: v }),
    setLastSavedTime: (v) => set({ lastSavedTime: v }),
    setTab: (v) => set({ tab: v }),
    setSettings: (v) => set((state) => ({ settings: typeof v === "function" ? v(state.settings) : v })),
    setSettingsTab: (v) => set({ settingsTab: v }),
    setScenes: (v) => set((state) => {
      const nextScenes = typeof v === "function" ? v(state.scenes) : v;
      return { scenes: nextScenes, ...updateDerived({ scenes: nextScenes }) };
    }),
    setSelectedSceneId: (v) => set((state) => {
      return { selectedSceneId: v, ...updateDerived({ selectedSceneId: v }) };
    }),
    setManuscripts: (v) => set((state) => {
      const nextManuscripts = typeof v === "function" ? v(state.manuscripts) : v;
      return { manuscripts: nextManuscripts, ...updateDerived({ manuscripts: nextManuscripts }) };
    }),
    setShowSettings: (v) => set({ showSettings: v }),
    setSidebarOpen: (v) => set({ sidebarOpen: v }),
    setNewScene: (v) => set({ newScene: v }),
    setAddingScene: (v) => set({ addingScene: v }),
    setConfirmDelete: (v) => set({ confirmDelete: v }),
    setAddingChapter: (v) => set({ addingChapter: v }),
    setProjectTitle: (v) => set({ projectTitle: v }),
    setEditingTitle: (v) => set({ editingTitle: v }),
    setShowExport: (v) => set({ showExport: v }),
    setSceneSearch: (v) => set({ sceneSearch: v }),
    setBackups: (v) => set({ backups: v }),
    setShowBackups: (v) => set({ showBackups: v }),
    setVerticalPreview: (v) => set({ verticalPreview: v }),
    setEditingSceneTitle: (v) => set({ editingSceneTitle: v }),
    setEditingSceneSynopsis: (v) => set({ editingSceneSynopsis: v }),
    setSidebarFloat: (v) => set({ sidebarFloat: v }),
    setSidebarTab: (v) => set({ sidebarTab: v }),
    setEditorSettings: (v) => set((state) => ({ editorSettings: typeof v === "function" ? v(state.editorSettings) : v })),
    setAiFloat: (v) => set({ aiFloat: v }),
    setAiWide: (v) => set({ aiWide: v }),
    setAiResults: (v) => set((state) => ({ aiResults: typeof v === "function" ? v(state.aiResults) : v })),
    setAiErrors: (v) => set((state) => ({ aiErrors: typeof v === "function" ? v(state.aiErrors) : v })),
    setAiLoading: (v) => set((state) => ({ aiLoading: typeof v === "function" ? v(state.aiLoading) : v })),
    setAiApplied: (v) => set((state) => {
      const next = typeof v === "function" ? v(state.aiApplied) : v;
      return { aiApplied: next };
    }),
    setHintApplied: (v) => set((state) => {
      const next = typeof v === "function" ? v(state.hintApplied) : v;
      return { hintApplied: next };
    }),
    setAutoBackups: (v) => set((state) => ({ autoBackups: typeof v === "function" ? v(state.autoBackups) : v })),
    setAiHistory: (v) => set((state) => ({ aiHistory: typeof v === "function" ? v(state.aiHistory) : v })),

    // Complex Actions
    addAiHistory: (label, content, sceneTitle) => {
      if (!content.trim()) return;
      const item: AiHistoryItem = { id: Date.now(), timestamp: new Date().toISOString(), label, content, sceneTitle };
      set(state => ({ aiHistory: [item, ...state.aiHistory].slice(0, 30) }));
    },

    clearAiHistory: () => {
      set({ aiHistory: [] });
      storageSet("minato:aiHistory", []);
    },

    handleSceneSelect: (scene) => {
      set({ selectedSceneId: scene.id, tab: "write", ...updateDerived({ selectedSceneId: scene.id }) });
    },

    handleManuscriptChange: (text) => {
      const { selectedSceneId, manuscripts } = get();
      if (selectedSceneId !== null) {
        const nextManuscripts = { ...manuscripts, [selectedSceneId]: text };
        set({ manuscripts: nextManuscripts, ...updateDerived({ manuscripts: nextManuscripts }) });
      }
    },

    handleStatusChange: (id, status) => {
      const nextScenes = get().scenes.map(s => s.id === id ? { ...s, status } : s);
      set({ scenes: nextScenes, ...updateDerived({ scenes: nextScenes }) });
    },

    handleAddScene: () => {
      const { newScene, scenes } = get();
      const scene: Scene = { ...newScene, id: Date.now(), status: "empty" };
      const nextScenes = [...scenes, scene];
      set({
        scenes: nextScenes,
        newScene: { chapter: "", title: "", synopsis: "" },
        addingScene: false,
        ...updateDerived({ scenes: nextScenes })
      });
    },

    handleDeleteScene: (id) => set({ confirmDelete: id }),

    confirmDeleteExecute: () => {
      const { confirmDelete, scenes, selectedSceneId, manuscripts } = get();
      if (confirmDelete === null) return;
      const nextScenes = scenes.filter(s => s.id !== confirmDelete);
      const nextManuscripts = { ...manuscripts };
      delete nextManuscripts[confirmDelete];
      
      const nextSelectedId = selectedSceneId === confirmDelete ? null : selectedSceneId;
      
      set({
        scenes: nextScenes,
        manuscripts: nextManuscripts,
        selectedSceneId: nextSelectedId,
        confirmDelete: null,
        ...updateDerived({ scenes: nextScenes, manuscripts: nextManuscripts, selectedSceneId: nextSelectedId })
      });
    },

    saveWithBackup: async (sc, st, ms, pt, label = null) => {
      set({ saveStatus: "saving" });
      const { backups } = get();
      try {
        const newBackup = { timestamp: new Date().toISOString(), label, scenes: sc, manuscripts: ms, settings: st, projectTitle: pt };
        const updatedBackups = [newBackup, ...backups].slice(0, 5);
        set({ backups: updatedBackups });
        
        const success = await Promise.all([
          storageSet("minato:scenes", sc),
          storageSet("minato:settings", st),
          storageSet("minato:manuscripts", ms),
          storageSet("minato:title", pt),
          storageSet("minato:backups", updatedBackups),
        ]);

        if (success.every(r => r)) {
          set({ saveStatus: "saved", lastSavedTime: new Date() });
        } else {
          set({ saveStatus: navigator.onLine ? "error" : "offline" });
        }
      } catch { set({ saveStatus: "error" }); }
    },

    handleSaveBackup: (label) => {
      const { backups, scenes, manuscripts, settings, projectTitle } = get();
      const newBackup = {
        timestamp: new Date().toISOString(),
        label,
        scenes,
        manuscripts,
        settings,
        projectTitle,
      };
      const updated = [newBackup, ...backups].slice(0, 5);
      set({ backups: updated });
      storageSet("minato:backups", updated);
    },

    exportScene: (fmt) => {
      const { scenes, selectedSceneId, manuscripts, setShowExport } = get();
      const selectedScene = scenes.find(s => s.id === selectedSceneId);
      if (!selectedScene) return;
      
      const text = manuscripts[selectedScene.id] || "";
      const content = fmt === "md"
        ? `# ${selectedScene.chapter} — ${selectedScene.title}\n\n${selectedScene.synopsis ? `> ${selectedScene.synopsis}\n\n` : ""}${text}`
        : `${selectedScene.chapter} — ${selectedScene.title}\n${"=".repeat(30)}\n${selectedScene.synopsis ? `${selectedScene.synopsis}\n\n` : ""}${text}`;
      
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedScene.title}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(`${selectedScene.title}.${fmt} を出力しました。`);
      setShowExport(false);
    },

    exportAll: (fmt) => {
      const { projectTitle, scenes, manuscripts, setShowExport } = get();
      const content = fmt === "md"
        ? `# ${projectTitle}\n\n` + scenes.map(s => `## ${s.chapter} — ${s.title}\n\n${s.synopsis ? `> ${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n---\n\n")
        : scenes.map(s => `${s.chapter} — ${s.title}\n${"=".repeat(30)}\n${s.synopsis ? `${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n" + "─".repeat(40) + "\n\n");
      
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectTitle}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(`${projectTitle}.${fmt} を出力しました。`);
      setShowExport(false);
    }
  };
});
