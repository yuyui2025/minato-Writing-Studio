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
import { useQuery, useMutation } from "@tanstack/react-query";
import { storageGetMany, storageSet } from "../utils/storage";
import type { Scene, Settings, Manuscripts, EditorSettings, AiHistoryItem, Backup, ProjectRecord } from "../types";
import { useStudioStore } from "../stores/useStudioStore";
import { analyzeText } from "../utils/textAnalyzer";

// ---------------------------------------------------------------------------
// Provider: side effects only
// ---------------------------------------------------------------------------

export function StudioProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const store = useStudioStore();
  const syncAllRef = useRef<() => void>(() => {});
  const skipInitialSaveRef = useRef(true);

  // --- Sync user to store ---
  useEffect(() => {
    store.setUser(user);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- Initial load via useQuery ---
  const STORAGE_KEYS = [
    "minato:scenes",
    "minato:settings",
    "minato:manuscripts",
    "minato:title",
    "minato:backups",
    "minato:editorSettings",
    "minato:aiHistory",
    "minato:autoBackups",
    "minato:sidebarFloat",
    "minato:sidebarWidth",
    "minato:aiFloat",
    "minato:aiPanelWidth",
    "minato:projects",
    "minato:activeProjectId",
  ] as const;

  const { data: loadedData, isFetching: isInitLoading } = useQuery({
    queryKey: ["studio-init", user?.id ?? "offline"],
    queryFn: () => storageGetMany(STORAGE_KEYS as unknown as string[]),
    // gcTime: 0 でアンマウント時にキャッシュを即破棄する。
    // これにより offline→authenticated→offline や user-A→user-B→user-A のように
    // 同じキーが再利用された場合でも、必ず localStorage から再読み込みされる。
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Apply loaded data to store
  useEffect(() => {
    store.setLoaded(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (isInitLoading || !loadedData) return;

    const sc = loadedData["minato:scenes"] as Scene[] | null;
    const st = loadedData["minato:settings"] as Settings | null;
    const ms = loadedData["minato:manuscripts"] as Manuscripts | null;
    const pt = loadedData["minato:title"] as string | null;
    const bk = loadedData["minato:backups"] as Backup[] | null;
    const es = loadedData["minato:editorSettings"] as EditorSettings | null;
    const ah = loadedData["minato:aiHistory"] as AiHistoryItem[] | null;
    const ab = loadedData["minato:autoBackups"] as Backup[] | null;
    const sf = loadedData["minato:sidebarFloat"] as boolean | null;
    const sw = loadedData["minato:sidebarWidth"] as number | null;
    const af = loadedData["minato:aiFloat"] as boolean | null;
    const apw = loadedData["minato:aiPanelWidth"] as number | null;
    const projects = loadedData["minato:projects"] as ProjectRecord[] | null;
    const activeProjectId = loadedData["minato:activeProjectId"] as string | null;

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

    skipInitialSaveRef.current = true;
    store.setLoaded(true);

    // YUY-93: 初回起動チュートリアル
    if (typeof localStorage !== "undefined" && !localStorage.getItem("minato:tutorialSeen")) {
      store.setShowTutorial(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedData, isInitLoading]);

  // --- Auto-save mutation ---
  const { scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, sidebarFloat, sidebarWidth, aiFloat, aiPanelWidth, loaded, projects, activeProjectId, backups } = store;

  const saveMutation = useMutation({
    mutationFn: async (data: {
      scenes: typeof scenes;
      settings: typeof settings;
      manuscripts: typeof manuscripts;
      projectTitle: typeof projectTitle;
      editorSettings: typeof editorSettings;
      aiHistory: typeof aiHistory;
      autoBackups: typeof autoBackups;
      sidebarFloat: typeof sidebarFloat;
      sidebarWidth: typeof sidebarWidth;
      aiFloat: typeof aiFloat;
      aiPanelWidth: typeof aiPanelWidth;
      projects: typeof projects;
      activeProjectId: typeof activeProjectId;
      backups: typeof backups;
    }) => {
      const now = new Date().toISOString();
      const currentRecord: ProjectRecord = {
        id: data.activeProjectId,
        title: data.projectTitle.trim() || "無題プロジェクト",
        updatedAt: now,
        scenes: data.scenes,
        manuscripts: data.manuscripts,
        settings: data.settings,
        backups: data.backups,
        aiHistory: data.aiHistory,
      };
      const updatedProjects = [currentRecord, ...data.projects.filter(p => p.id !== data.activeProjectId)];

      await Promise.all([
        storageSet("minato:scenes", data.scenes),
        storageSet("minato:settings", data.settings),
        storageSet("minato:manuscripts", data.manuscripts),
        storageSet("minato:title", data.projectTitle),
        storageSet("minato:editorSettings", data.editorSettings),
        storageSet("minato:backups", useStudioStore.getState().backups),
        storageSet("minato:aiHistory", data.aiHistory),
        storageSet("minato:autoBackups", data.autoBackups),
        storageSet("minato:sidebarFloat", data.sidebarFloat),
        storageSet("minato:sidebarWidth", data.sidebarWidth),
        storageSet("minato:aiFloat", data.aiFloat),
        storageSet("minato:aiPanelWidth", data.aiPanelWidth),
        storageSet("minato:activeProjectId", data.activeProjectId),
        storageSet("minato:projects", updatedProjects),
      ]);
    },
  });

  useEffect(() => {
    if (!loaded) return;
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }
    const snapshot = { scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, sidebarFloat, sidebarWidth, aiFloat, aiPanelWidth, projects, activeProjectId, backups };
    syncAllRef.current = () => saveMutation.mutate(snapshot);
    const t = setTimeout(() => saveMutation.mutate(snapshot), 1000);
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
