/**
 * StudioContext — compatibility shim
 *
 * State は useStudioStore (zustand) が保持する。
 * このファイルは:
 *   1. StudioProvider: データロード・副作用（自動保存・テーマ・オフライン同期）を担当
 *   2. useStudio(): useStudioStore() の再エクスポート（既存コンポーネントを無変更で使える）
 */
import React, { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { storageGet, storageSet } from "../utils/storage";
import type { Scene, Settings, Manuscripts, EditorSettings, AiHistoryItem, Backup, ProjectRecord } from "../types";
import { useStudioStore } from "../stores/useStudioStore";
import { analyzeText } from "../utils/textAnalyzer";

// ---------------------------------------------------------------------------
// Provider: side effects only
// ---------------------------------------------------------------------------

export function StudioProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const store = useStudioStore();
  const syncAllRef = useRef<() => Promise<void>>(async () => {});
  const skipInitialSaveRef = useRef(true);

  // --- Sync user to store ---
  useEffect(() => {
    store.setUser(user);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- Initial load ---
  useEffect(() => {
    (async () => {
      store.setLoaded(false);
      const [sc, st, ms, pt, bk, es, ah, ab, sf, sw, af, apw, projects, activeProjectId] = await Promise.all([
        storageGet<Scene[]>("minato:scenes"),
        storageGet<Settings>("minato:settings"),
        storageGet<Manuscripts>("minato:manuscripts"),
        storageGet<string>("minato:title"),
        storageGet<Backup[]>("minato:backups"),
        storageGet<EditorSettings>("minato:editorSettings"),
        storageGet<AiHistoryItem[]>("minato:aiHistory"),
        storageGet<Backup[]>("minato:autoBackups"),
        storageGet<boolean>("minato:sidebarFloat"),
        storageGet<number>("minato:sidebarWidth"),
        storageGet<boolean>("minato:aiFloat"),
        storageGet<number>("minato:aiPanelWidth"),
        storageGet<ProjectRecord[]>("minato:projects"),
        storageGet<string>("minato:activeProjectId"),
      ]);
      const resolvedScenes = sc ?? store.scenes;
      const resolvedSettings = st ?? store.settings;
      const resolvedManuscripts = ms ?? store.manuscripts;
      const resolvedTitle = pt ?? store.projectTitle;
      const resolvedBackups = bk ?? store.backups;

      if (sc) store.setScenes(sc);
      if (st) store.setSettings(st);
      if (ms) store.setManuscripts(ms);
      if (pt !== null) store.setProjectTitle(pt);
      if (bk) store.setBackups(bk);
      if (es) store.setEditorSettings(es);
      if (ah) store.setAiHistory(ah);
      if (ab) store.setAutoBackups(ab);
      if (sf !== null) store.setSidebarFloat(sf);
      if (typeof sw === "number") store.setSidebarWidth(sw);
      if (af !== null) store.setAiFloat(af);
      if (typeof apw === "number") store.setAiPanelWidth(apw);

      const defaultProject: ProjectRecord = {
        id: activeProjectId || "default",
        title: resolvedTitle?.trim() || "無題プロジェクト",
        updatedAt: new Date().toISOString(),
        scenes: resolvedScenes,
        manuscripts: resolvedManuscripts,
        settings: resolvedSettings,
        backups: resolvedBackups,
      };
      const loadedProjects = (projects && projects.length > 0) ? projects : [defaultProject];
      const loadedActiveId = activeProjectId || loadedProjects[0].id;
      const activeProject = loadedProjects.find(p => p.id === loadedActiveId) ?? loadedProjects[0];
      store.setProjects(loadedProjects);
      store.setActiveProjectId(activeProject.id);
      store.setScenes(activeProject.scenes);
      store.setManuscripts(activeProject.manuscripts);
      store.setSettings(activeProject.settings);
      store.setProjectTitle(activeProject.title);
      store.setBackups(activeProject.backups);
      if (activeProject.aiHistory != null) store.setAiHistory(activeProject.aiHistory);

      store.setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // --- Auto-save (debounced 1 s) ---
  const { scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, sidebarFloat, sidebarWidth, aiFloat, aiPanelWidth, loaded, projects, activeProjectId, backups } = store;

  useEffect(() => {
    if (!loaded) return;
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }
    const syncAll = async () => {
      await Promise.all([
        storageSet("minato:scenes", scenes),
        storageSet("minato:settings", settings),
        storageSet("minato:manuscripts", manuscripts),
        storageSet("minato:title", projectTitle),
        storageSet("minato:editorSettings", editorSettings),
        storageSet("minato:backups", useStudioStore.getState().backups),
        storageSet("minato:aiHistory", aiHistory),
        storageSet("minato:autoBackups", autoBackups),
        storageSet("minato:sidebarFloat", sidebarFloat),
        storageSet("minato:sidebarWidth", sidebarWidth),
        storageSet("minato:aiFloat", aiFloat),
        storageSet("minato:aiPanelWidth", aiPanelWidth),
        storageSet("minato:activeProjectId", activeProjectId),
        storageSet("minato:projects", (() => {
          const now = new Date().toISOString();
          const currentRecord: ProjectRecord = {
            id: activeProjectId,
            title: projectTitle.trim() || "無題プロジェクト",
            updatedAt: now,
            scenes,
            manuscripts,
            settings,
            backups,
            aiHistory,
          };
          const rest = projects.filter(p => p.id !== activeProjectId);
          return [currentRecord, ...rest];
        })()),
      ]).catch(() => {/* ignore storage errors */});
    };
    syncAllRef.current = syncAll;
    const t = setTimeout(syncAll, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, sidebarFloat, sidebarWidth, aiFloat, aiPanelWidth, loaded, projects, activeProjectId, backups]);

  // --- Online / offline sync ---
  useEffect(() => {
    let isOnline = navigator.onLine;
    const handleOnline = () => {
      if (!isOnline) syncAllRef.current();
      isOnline = true;
    };
    const handleOffline = () => { isOnline = false; };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- Theme ---
  useEffect(() => {
    const theme = editorSettings.colorTheme ?? "focus";
    const apply = (t: "dark" | "light" | "focus" | "system") => {
      if (t === "system") {
        document.documentElement.setAttribute("data-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-theme", t);
      }
    };
    apply(theme);
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [editorSettings.colorTheme]);

  // --- Auto backup every 10 min ---
  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      const s = useStudioStore.getState();
      const entry: Backup = { timestamp: new Date().toISOString(), label: null, scenes: s.scenes, manuscripts: s.manuscripts, settings: s.settings, projectTitle: s.projectTitle };
      store.setAutoBackups(prev => [entry, ...prev].slice(0, 5));
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // --- WASM text analysis (debounced 500 ms) ---
  const { manuscriptText } = store;
  useEffect(() => {
    if (!manuscriptText) { store.setTextMetrics(null); return; }
    const t = setTimeout(async () => {
      const metrics = await analyzeText(manuscriptText);
      store.setTextMetrics(metrics);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscriptText]);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// useStudio — drop-in replacement for the old context hook
// ---------------------------------------------------------------------------

export { useStudioStore as useStudio };
