import { create } from "zustand";
import type {
  SceneStatus, Scene, Settings, Manuscripts, AppliedState,
  AiResults, AiLoading, AiErrors, Backup, SceneDraft, EditorSettings, TabKey, SidebarTabKey, SaveStatus, AiHistoryItem, TextMetrics
} from "../types";
import { initialSettings, initialScenes } from "../constants";
import { storageSet } from "../utils/storage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDerived(
  scenes: Scene[],
  manuscripts: Manuscripts,
  selectedSceneId: number | null
) {
  const selectedScene = scenes.find(s => s.id === selectedSceneId) ?? null;
  const manuscriptText = selectedSceneId ? (manuscripts[selectedSceneId] ?? "") : "";
  const wordCount = manuscriptText.replace(/\s/g, "").length;
  return { selectedScene, manuscriptText, wordCount };
}

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface StudioState {
  // persistence / loading
  loaded: boolean;
  saveStatus: SaveStatus;
  lastSavedTime: Date | null;

  // navigation
  tab: TabKey;
  sidebarTab: SidebarTabKey;
  settingsTab: keyof Settings;

  // core data
  scenes: Scene[];
  selectedSceneId: number | null;
  manuscripts: Manuscripts;
  settings: Settings;
  projectTitle: string;

  // sidebar UI
  sidebarOpen: boolean;
  sidebarFloat: boolean;

  // scene editing
  newScene: SceneDraft;
  addingScene: boolean;
  addingChapter: boolean;
  confirmDelete: number | null;
  sceneSearch: string;
  editingSceneTitle: boolean;
  editingSceneSynopsis: boolean;

  // other UI
  showSettings: boolean;
  editingTitle: boolean;
  showExport: boolean;
  showBackups: boolean;
  verticalPreview: boolean;

  // editor
  editorSettings: EditorSettings;

  // backup
  backups: Backup[];
  autoBackups: Backup[];

  // AI
  aiFloat: boolean;
  aiWide: boolean;
  aiResults: AiResults;
  aiErrors: AiErrors;
  aiLoading: AiLoading;
  aiApplied: AppliedState;
  hintApplied: AppliedState;
  aiHistory: AiHistoryItem[];

  // derived (kept in store for fast access)
  selectedScene: Scene | null;
  manuscriptText: string;
  wordCount: number;
  textMetrics: TextMetrics | null;

  // ---------------------------------------------------------------------------
  // Setters (plain state updates)
  // ---------------------------------------------------------------------------
  setLoaded: (v: boolean) => void;
  setSaveStatus: (v: SaveStatus) => void;
  setLastSavedTime: (v: Date | null) => void;
  setTab: (v: TabKey) => void;
  setSidebarTab: (v: SidebarTabKey) => void;
  setSettingsTab: (v: keyof Settings) => void;
  setScenes: (v: Scene[] | ((prev: Scene[]) => Scene[])) => void;
  setSelectedSceneId: (v: number | null) => void;
  setManuscripts: (v: Manuscripts | ((prev: Manuscripts) => Manuscripts)) => void;
  setSettings: (v: Settings | ((prev: Settings) => Settings)) => void;
  setProjectTitle: (v: string) => void;
  setSidebarOpen: (v: boolean) => void;
  setSidebarFloat: (v: boolean) => void;
  setNewScene: (v: SceneDraft) => void;
  setAddingScene: (v: boolean) => void;
  setAddingChapter: (v: boolean) => void;
  setConfirmDelete: (v: number | null) => void;
  setSceneSearch: (v: string) => void;
  setEditingSceneTitle: (v: boolean) => void;
  setEditingSceneSynopsis: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setEditingTitle: (v: boolean) => void;
  setShowExport: (v: boolean) => void;
  setShowBackups: (v: boolean) => void;
  setVerticalPreview: (v: boolean) => void;
  setEditorSettings: (v: EditorSettings | ((prev: EditorSettings) => EditorSettings)) => void;
  setBackups: (v: Backup[] | ((prev: Backup[]) => Backup[])) => void;
  setAutoBackups: (v: Backup[] | ((prev: Backup[]) => Backup[])) => void;
  setAiFloat: (v: boolean) => void;
  setAiWide: (v: boolean) => void;
  setAiResults: (v: AiResults | ((prev: AiResults) => AiResults)) => void;
  setAiErrors: (v: AiErrors | ((prev: AiErrors) => AiErrors)) => void;
  setAiLoading: (v: AiLoading | ((prev: AiLoading) => AiLoading)) => void;
  setAiApplied: (v: AppliedState | ((prev: AppliedState) => AppliedState)) => void;
  setHintApplied: (v: AppliedState | ((prev: AppliedState) => AppliedState)) => void;
  setAiHistory: (v: AiHistoryItem[] | ((prev: AiHistoryItem[]) => AiHistoryItem[])) => void;
  setTextMetrics: (v: TextMetrics | null) => void;

  // ---------------------------------------------------------------------------
  // Actions (business logic)
  // ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const aiResultsInit: AiResults = { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" };
const aiErrorsInit: AiErrors = { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" };
const aiLoadingInit: AiLoading = { polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false, freeInstruct: false };

function downloadFile(content: string, filename: string) {
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
}

export const useStudioStore = create<StudioState>((set, get) => ({
  // Initial state
  loaded: false,
  saveStatus: "saved",
  lastSavedTime: null,
  tab: "write",
  sidebarTab: "write",
  settingsTab: "world",
  scenes: initialScenes,
  selectedSceneId: null,
  manuscripts: {},
  settings: initialSettings,
  projectTitle: "",
  sidebarOpen: true,
  sidebarFloat: true,
  newScene: { chapter: "", title: "", synopsis: "" },
  addingScene: false,
  addingChapter: false,
  confirmDelete: null,
  sceneSearch: "",
  editingSceneTitle: false,
  editingSceneSynopsis: false,
  showSettings: false,
  editingTitle: false,
  showExport: false,
  showBackups: false,
  verticalPreview: false,
  editorSettings: { fontSize: 15, lineHeight: 2.2, colorTheme: "dark" },
  backups: [],
  autoBackups: [],
  aiFloat: false,
  aiWide: false,
  aiResults: aiResultsInit,
  aiErrors: aiErrorsInit,
  aiLoading: aiLoadingInit,
  aiApplied: {},
  hintApplied: {},
  aiHistory: [],
  selectedScene: null,
  manuscriptText: "",
  wordCount: 0,
  textMetrics: null,

  // ---------------------------------------------------------------------------
  // Setters
  // ---------------------------------------------------------------------------
  setLoaded: (v) => set({ loaded: v }),
  setSaveStatus: (v) => set({ saveStatus: v }),
  setLastSavedTime: (v) => set({ lastSavedTime: v }),
  setTab: (v) => set({ tab: v }),
  setSidebarTab: (v) => set({ sidebarTab: v }),
  setSettingsTab: (v) => set({ settingsTab: v }),
  setScenes: (v) => set((s) => {
    const next = typeof v === "function" ? v(s.scenes) : v;
    return { scenes: next, ...computeDerived(next, s.manuscripts, s.selectedSceneId) };
  }),
  setSelectedSceneId: (v) => set((s) => ({
    selectedSceneId: v,
    ...computeDerived(s.scenes, s.manuscripts, v),
  })),
  setManuscripts: (v) => set((s) => {
    const next = typeof v === "function" ? v(s.manuscripts) : v;
    return { manuscripts: next, ...computeDerived(s.scenes, next, s.selectedSceneId) };
  }),
  setSettings: (v) => set((s) => ({ settings: typeof v === "function" ? v(s.settings) : v })),
  setProjectTitle: (v) => set({ projectTitle: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setSidebarFloat: (v) => set({ sidebarFloat: v }),
  setNewScene: (v) => set({ newScene: v }),
  setAddingScene: (v) => set({ addingScene: v }),
  setAddingChapter: (v) => set({ addingChapter: v }),
  setConfirmDelete: (v) => set({ confirmDelete: v }),
  setSceneSearch: (v) => set({ sceneSearch: v }),
  setEditingSceneTitle: (v) => set({ editingSceneTitle: v }),
  setEditingSceneSynopsis: (v) => set({ editingSceneSynopsis: v }),
  setShowSettings: (v) => set({ showSettings: v }),
  setEditingTitle: (v) => set({ editingTitle: v }),
  setShowExport: (v) => set({ showExport: v }),
  setShowBackups: (v) => set({ showBackups: v }),
  setVerticalPreview: (v) => set({ verticalPreview: v }),
  setEditorSettings: (v) => set((s) => ({ editorSettings: typeof v === "function" ? v(s.editorSettings) : v })),
  setBackups: (v) => set((s) => ({ backups: typeof v === "function" ? v(s.backups) : v })),
  setAutoBackups: (v) => set((s) => ({ autoBackups: typeof v === "function" ? v(s.autoBackups) : v })),
  setAiFloat: (v) => set({ aiFloat: v }),
  setAiWide: (v) => set({ aiWide: v }),
  setAiResults: (v) => set((s) => ({ aiResults: typeof v === "function" ? v(s.aiResults) : v })),
  setAiErrors: (v) => set((s) => ({ aiErrors: typeof v === "function" ? v(s.aiErrors) : v })),
  setAiLoading: (v) => set((s) => ({ aiLoading: typeof v === "function" ? v(s.aiLoading) : v })),
  setAiApplied: (v) => set((s) => ({ aiApplied: typeof v === "function" ? v(s.aiApplied) : v })),
  setHintApplied: (v) => set((s) => ({ hintApplied: typeof v === "function" ? v(s.hintApplied) : v })),
  setAiHistory: (v) => set((s) => ({ aiHistory: typeof v === "function" ? v(s.aiHistory) : v })),
  setTextMetrics: (v) => set({ textMetrics: v }),

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  addAiHistory: (label, content, sceneTitle) => {
    if (!content.trim()) return;
    const item: AiHistoryItem = { id: Date.now(), timestamp: new Date().toISOString(), label, content, sceneTitle };
    set(s => ({ aiHistory: [item, ...s.aiHistory].slice(0, 30) }));
  },

  clearAiHistory: () => {
    set({ aiHistory: [] });
    storageSet("minato:aiHistory", []);
  },

  handleSceneSelect: (scene) => set((s) => ({
    selectedSceneId: scene.id,
    tab: "write",
    ...computeDerived(s.scenes, s.manuscripts, scene.id),
  })),

  handleManuscriptChange: (text) => {
    const { selectedSceneId, manuscripts, scenes } = get();
    if (selectedSceneId === null) return;
    const next = { ...manuscripts, [selectedSceneId]: text };
    set({ manuscripts: next, ...computeDerived(scenes, next, selectedSceneId) });
  },

  handleStatusChange: (id, status) => set((s) => {
    const next = s.scenes.map(sc => sc.id === id ? { ...sc, status } : sc);
    return { scenes: next, ...computeDerived(next, s.manuscripts, s.selectedSceneId) };
  }),

  handleAddScene: () => set((s) => {
    const scene: Scene = { ...s.newScene, id: Date.now(), status: "empty" };
    const next = [...s.scenes, scene];
    return {
      scenes: next,
      newScene: { chapter: "", title: "", synopsis: "" },
      addingScene: false,
      ...computeDerived(next, s.manuscripts, s.selectedSceneId),
    };
  }),

  handleDeleteScene: (id) => set({ confirmDelete: id }),

  confirmDeleteExecute: () => set((s) => {
    if (s.confirmDelete === null) return {};
    const id = s.confirmDelete;
    const nextScenes = s.scenes.filter(sc => sc.id !== id);
    const nextManuscripts = { ...s.manuscripts };
    delete nextManuscripts[id];
    const nextSelectedId = s.selectedSceneId === id ? null : s.selectedSceneId;
    return {
      scenes: nextScenes,
      manuscripts: nextManuscripts,
      selectedSceneId: nextSelectedId,
      confirmDelete: null,
      ...computeDerived(nextScenes, nextManuscripts, nextSelectedId),
    };
  }),

  saveWithBackup: async (sc, st, ms, pt, label = null) => {
    set({ saveStatus: "saving" });
    const { backups } = get();
    try {
      const newBackup = { timestamp: new Date().toISOString(), label, scenes: sc, manuscripts: ms, settings: st, projectTitle: pt };
      const updatedBackups = [newBackup, ...backups].slice(0, 5);
      set({ backups: updatedBackups });
      const results = await Promise.all([
        storageSet("minato:scenes", sc),
        storageSet("minato:settings", st),
        storageSet("minato:manuscripts", ms),
        storageSet("minato:title", pt),
        storageSet("minato:backups", updatedBackups),
      ]);
      if (results.every(r => r)) {
        set({ saveStatus: "saved", lastSavedTime: new Date() });
      } else {
        set({ saveStatus: navigator.onLine ? "error" : "offline" });
      }
    } catch {
      set({ saveStatus: "error" });
    }
  },

  handleSaveBackup: (label) => {
    const { backups, scenes, manuscripts, settings, projectTitle } = get();
    const newBackup = { timestamp: new Date().toISOString(), label, scenes, manuscripts, settings, projectTitle };
    const updated = [newBackup, ...backups].slice(0, 5);
    set({ backups: updated });
    storageSet("minato:backups", updated);
  },

  exportScene: (fmt) => {
    const { scenes, selectedSceneId, manuscripts } = get();
    const scene = scenes.find(s => s.id === selectedSceneId);
    if (!scene) return;
    const text = manuscripts[scene.id] || "";
    const content = fmt === "md"
      ? `# ${scene.chapter} — ${scene.title}\n\n${scene.synopsis ? `> ${scene.synopsis}\n\n` : ""}${text}`
      : `${scene.chapter} — ${scene.title}\n${"=".repeat(30)}\n${scene.synopsis ? `${scene.synopsis}\n\n` : ""}${text}`;
    downloadFile(content, `${scene.title}.${fmt}`);
    set({ showExport: false });
  },

  exportAll: (fmt) => {
    const { projectTitle, scenes, manuscripts } = get();
    const content = fmt === "md"
      ? `# ${projectTitle}\n\n` + scenes.map(s => `## ${s.chapter} — ${s.title}\n\n${s.synopsis ? `> ${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n---\n\n")
      : scenes.map(s => `${s.chapter} — ${s.title}\n${"=".repeat(30)}\n${s.synopsis ? `${s.synopsis}\n\n` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n" + "─".repeat(40) + "\n\n");
    downloadFile(content, `${projectTitle}.${fmt}`);
    set({ showExport: false });
  },
}));

// テスト用: ストアを初期状態にリセットする
export function resetStudioStore() {
  useStudioStore.setState({
    loaded: false,
    saveStatus: "saved",
    lastSavedTime: null,
    tab: "write",
    sidebarTab: "write",
    settingsTab: "world",
    scenes: initialScenes,
    selectedSceneId: null,
    manuscripts: {},
    settings: initialSettings,
    projectTitle: "",
    sidebarOpen: true,
    sidebarFloat: true,
    newScene: { chapter: "", title: "", synopsis: "" },
    addingScene: false,
    addingChapter: false,
    confirmDelete: null,
    sceneSearch: "",
    editingSceneTitle: false,
    editingSceneSynopsis: false,
    showSettings: false,
    editingTitle: false,
    showExport: false,
    showBackups: false,
    verticalPreview: false,
    editorSettings: { fontSize: 15, lineHeight: 2.2, colorTheme: "dark" },
    backups: [],
    autoBackups: [],
    aiFloat: false,
    aiWide: false,
    aiResults: { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" },
    aiErrors: { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" },
    aiLoading: { polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false, freeInstruct: false },
    aiApplied: {},
    hintApplied: {},
    aiHistory: [],
    selectedScene: null,
    manuscriptText: "",
    wordCount: 0,
    textMetrics: null,
  });
}
