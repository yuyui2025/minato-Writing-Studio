import { Scene, Settings, SceneStatus } from "./types";

export const initialSettings: Settings = {
  world: "",
  characters: "",
  theme: "",
};

export const initialScenes: Scene[] = [];

export const statusColors: Record<SceneStatus, string> = { done: "#4ade80", draft: "#facc15", empty: "#334155" };
export const statusLabels: Record<SceneStatus, string> = { done: "完成", draft: "執筆中", empty: "未着手" };
