export type SceneStatus = "done" | "draft" | "empty";

export type Scene = {
  id: number;
  chapter: string;
  title: string;
  status: SceneStatus;
  synopsis: string;
};

export type Settings = {
  world: string;
  characters: string;
  theme: string;
};

export type Manuscripts = Record<number, string>;
export type AppliedState = Record<number, boolean | "replace" | "insert">;

export type AiResults = {
  polish: string;
  hint: string;
  check: string;
  continue: string;
  synopsis: string;
  worldExpand: string;
  characterExpand: string;
  themeExpand: string;
  freeInstruct: string;
};

export type AiErrors = Record<keyof AiResults, string>;
export type AiLoading = Record<keyof AiResults, boolean>;

export type Backup = {
  timestamp: string;
  label: string | null;
  scenes: Scene[];
  manuscripts: Manuscripts;
  settings: Settings;
  projectTitle: string;
};

export type HintItem = { hint: string; reason: string; keyword?: string };
export type PolishSuggestion = { original: string; suggestion: string; reason: string };

export type SceneDraft = Pick<Scene, "chapter" | "title" | "synopsis">;
export type EditorSettings = { fontSize: number; lineHeight: number; colorTheme: "dark" | "light" | "system" | "focus" };
export type TabKey = "write" | "structure" | "settings" | "prefs" | "ai";
export type SidebarTabKey = TabKey | "ai";
export type SaveStatus = "saving" | "saved" | "error" | "offline";

export type AiHistoryItem = {
  id: number;
  timestamp: string;
  label: string;
  content: string;
  sceneTitle?: string;
  sceneId?: number;
};

export type TextMetrics = {
  char_count: number;
  sentence_count: number;
  paragraph_count: number;
  kanji_rate: number;
  reading_time_sec: number;
};

export type ParsedSection = {
  chapter: string;
  title: string;
  content: string;
};

export type ParsedDocument = {
  title: string;
  sections: ParsedSection[];
};

export type AiExtractResult = {
  characters: string;
  world: string;
};

export type ImportData = {
  scenes: Scene[];
  manuscripts: Manuscripts;
  settings: Partial<Settings>;
  projectTitle?: string;
};

export type ProjectRecord = {
  id: string;
  title: string;
  updatedAt: string;
  scenes: Scene[];
  manuscripts: Manuscripts;
  settings: Settings;
  backups: Backup[];
  aiHistory?: AiHistoryItem[];
};

export type ProjectFile = {
  format: "minato-project";
  version: 1;
  exportedAt: string;
  project: ProjectRecord;
};
