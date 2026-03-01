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
import type { Scene, Settings, Manuscripts, EditorSettings, AiHistoryItem, Backup } from "../types";
import { useStudioStore } from "../stores/useStudioStore";

// ---------------------------------------------------------------------------
// Provider: side effects only
// ---------------------------------------------------------------------------

export function StudioProvider({ children, user }: { children: React.ReactNode; user: User }) {
  const store = useStudioStore();
  const syncAllRef = useRef<() => Promise<void>>(async () => {});

  // --- Initial load ---
  useEffect(() => {
    (async () => {
      store.setLoaded(false);
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
      if (sc) store.setScenes(sc);
      if (st) store.setSettings(st);
      if (ms) store.setManuscripts(ms);
      if (pt !== null) store.setProjectTitle(pt);
      if (bk) store.setBackups(bk);
      if (es) store.setEditorSettings(es);
      if (ah) store.setAiHistory(ah);
      if (ab) store.setAutoBackups(ab);
      if (sf !== null) store.setSidebarFloat(sf);
      if (af !== null) store.setAiFloat(af);
      store.setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // --- Auto-save (debounced 1 s) ---
  const { scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, sidebarFloat, aiFloat, loaded } = store;

  useEffect(() => {
    if (!loaded) return;
    const syncAll = async () => {
      store.setSaveStatus("saving");
      try {
        const results = await Promise.all([
          storageSet("minato:scenes", scenes),
          storageSet("minato:settings", settings),
          storageSet("minato:manuscripts", manuscripts),
          storageSet("minato:title", projectTitle),
          storageSet("minato:editorSettings", editorSettings),
          storageSet("minato:backups", useStudioStore.getState().backups),
          storageSet("minato:aiHistory", aiHistory),
          storageSet("minato:autoBackups", autoBackups),
          storageSet("minato:sidebarFloat", sidebarFloat),
          storageSet("minato:aiFloat", aiFloat),
        ]);
        if (results.every(r => r)) {
          store.setSaveStatus("saved");
          store.setLastSavedTime(new Date());
        } else {
          store.setSaveStatus(navigator.onLine ? "error" : "offline");
        }
      } catch {
        store.setSaveStatus("error");
      }
    };
    syncAllRef.current = syncAll;
    const t = setTimeout(syncAll, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, settings, manuscripts, projectTitle, editorSettings, aiHistory, autoBackups, sidebarFloat, aiFloat, loaded]);

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
    const theme = editorSettings.colorTheme ?? "dark";
    const apply = (t: "dark" | "light" | "system") => {
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

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// useStudio — drop-in replacement for the old context hook
// ---------------------------------------------------------------------------

export { useStudioStore as useStudio };
