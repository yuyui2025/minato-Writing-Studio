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

  // Computed (will be derived in hook or selectors, but here we keep raw state)
  
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
  setAiApplied: (applied: AppliedState) => void;
  setHintApplied: (applied: AppliedState) => void;
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

export const useStudioStore = create<StudioState>((set, get) => ({
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
  editorSettings: { fontSize: 15, lineHeight: 2.2 },
  aiFloat: false,
  aiWide: false,
  aiResults: { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" },
  aiErrors: { polish: "", hint: "", check: "", continue: "", synopsis: "", worldExpand: "", freeInstruct: "" },
  aiLoading: { polish: false, hint: false, check: false, continue: false, synopsis: false, worldExpand: false, freeInstruct: false },
  aiApplied: {},
  hintApplied: {},
  aiHistory: [],
  autoBackups: [],

  // Setters
  setLoaded: (v) => set({ loaded: v }),
  setSaveStatus: (v) => set({ saveStatus: v }),
  setLastSavedTime: (v) => set({ lastSavedTime: v }),
  setTab: (v) => set({ tab: v }),
  setSettings: (v) => set((state) => ({ settings: typeof v === "function" ? v(state.settings) : v })),
  setSettingsTab: (v) => set({ settingsTab: v }),
  setScenes: (v) => set((state) => ({ scenes: typeof v === "function" ? v(state.scenes) : v })),
  setSelectedSceneId: (v) => set({ selectedSceneId: v }),
  setManuscripts: (v) => set((state) => ({ manuscripts: typeof v === "function" ? v(state.manuscripts) : v })),
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
  setAiApplied: (v) => set({ aiApplied: v }),
  setHintApplied: (v) => set({ hintApplied: v }),
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
    set({ selectedSceneId: scene.id, tab: "write" });
  },

  handleManuscriptChange: (text) => {
    const { selectedSceneId, manuscripts } = get();
    if (selectedSceneId !== null) {
      set({ manuscripts: { ...manuscripts, [selectedSceneId]: text } });
    }
  },

  handleStatusChange: (id, status) => {
    set(state => ({ scenes: state.scenes.map(s => s.id === id ? { ...s, status } : s) }));
  },

  handleAddScene: () => {
    const { newScene, scenes } = get();
    const scene: Scene = { ...newScene, id: Date.now(), status: "empty" };
    set({
      scenes: [...scenes, scene],
      newScene: { chapter: "", title: "", synopsis: "" },
      addingScene: false
    });
  },

  handleDeleteScene: (id) => set({ confirmDelete: id }),

  confirmDeleteExecute: () => {
    const { confirmDelete, scenes, selectedSceneId, manuscripts } = get();
    if (confirmDelete === null) return;
    const nextScenes = scenes.filter(s => s.id !== confirmDelete);
    const nextManuscripts = { ...manuscripts };
    delete nextManuscripts[confirmDelete];
    
    set({
      scenes: nextScenes,
      manuscripts: nextManuscripts,
      selectedSceneId: selectedSceneId === confirmDelete ? null : selectedSceneId,
      confirmDelete: null
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
      ? `# ${selectedScene.chapter} — ${selectedScene.title}

${selectedScene.synopsis ? `> ${selectedScene.synopsis}

` : ""}${text}`
      : `${selectedScene.chapter} — ${selectedScene.title}
${"=".repeat(30)}
${selectedScene.synopsis ? `${selectedScene.synopsis}

` : ""}${text}`;
    
    // Download logic directly in store action? Ideally separated but keeping logic together for now
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
      ? `# ${projectTitle}

` + scenes.map(s => `## ${s.chapter} — ${s.title}

${s.synopsis ? `> ${s.synopsis}

` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n---\n\n")
      : scenes.map(s => `${s.chapter} — ${s.title}
${"=".repeat(30)}
${s.synopsis ? `${s.synopsis}

` : ""}${manuscripts[s.id] || "（未執筆）"}`).join("\n\n" + "─".repeat(40) + "\n\n");
    
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
}));
