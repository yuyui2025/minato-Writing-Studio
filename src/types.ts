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
};

export type AiHistoryItem = {
  id: string;
  type: keyof AiResults;
  label: string;
  content: string;
  timestamp: string;
};

export type AiErrors = Record<keyof AiResults, string>;
export type AiLoading = Record<keyof AiResults, boolean>;

export type Backup = {
  timestamp: string;
  label: string | null;
  scenes: Scene[];
  manuscripts: Manuscripts;
};

export type HintItem = { hint: string; reason: string; keyword?: string };
export type PolishSuggestion = { original: string; suggestion: string; reason: string };

export type SceneDraft = Pick<Scene, "chapter" | "title" | "synopsis">;
export type EditorSettings = { fontSize: number; lineHeight: number };
export type TabKey = "write" | "structure" | "settings" | "prefs";
export type SaveStatus = "saving" | "saved" | "error" | "offline";
