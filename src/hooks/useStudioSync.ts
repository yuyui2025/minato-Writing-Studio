import { useEffect, useRef, useCallback, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useStudioStore } from "../stores/useStudioStore";
import { storageGet, storageSet } from "../utils/storage";
import type { Scene, Settings, Manuscripts, Backup, EditorSettings, AiHistoryItem } from "../types";

export function useStudioSync(user: User | null) {
  const store = useStudioStore();
  const previousIsOnlineRef = useRef(navigator.onLine);
  const syncAllRef = useRef<() => Promise<void>>(async () => {});
  const latestStateRef = useRef({ scenes: store.scenes, manuscripts: store.manuscripts });

  // Sync latestStateRef
  useEffect(() => {
    latestStateRef.current = { scenes: store.scenes, manuscripts: store.manuscripts };
  }, [store.scenes, store.manuscripts]);

  // Track online status
  const [isOnlineState, setIsOnlineState] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setIsOnlineState(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    (async () => {
      store.setLoaded(false);
      const [sc, st, ms, pt, bk, es, ah, ab] = await Promise.all([
        storageGet<Scene[]>("minato:scenes"),
        storageGet<Settings>("minato:settings"),
        storageGet<Manuscripts>("minato:manuscripts"),
        storageGet<string>("minato:title"),
        storageGet<Backup[]>("minato:backups"),
        storageGet<EditorSettings>("minato:editorSettings"),
        storageGet<AiHistoryItem[]>("minato:aiHistory"),
        storageGet<Backup[]>("minato:autoBackups"),
      ]);
      if (sc) store.setScenes(sc);
      if (st) store.setSettings(st);
      if (ms) store.setManuscripts(ms);
      if (pt) store.setProjectTitle(pt);
      if (bk) store.setBackups(bk);
      if (es) store.setEditorSettings(es);
      if (ah) store.setAiHistory(ah);
      if (ab) store.setAutoBackups(ab);
      store.setLoaded(true);
    })();
  }, [user?.id]); // Reload when user changes

  // Auto-Save Sync Logic
  const syncAll = useCallback(async () => {
    if (!store.loaded) return;
    store.setSaveStatus("saving");
    try {
      const results = await Promise.all([
        storageSet("minato:scenes", store.scenes),
        storageSet("minato:settings", store.settings),
        storageSet("minato:manuscripts", store.manuscripts),
        storageSet("minato:title", store.projectTitle),
        storageSet("minato:editorSettings", store.editorSettings),
        storageSet("minato:backups", store.backups),
        storageSet("minato:aiHistory", store.aiHistory),
        storageSet("minato:autoBackups", store.autoBackups),
      ]);

      const allSuccess = results.every(r => r);
      if (allSuccess) {
        store.setSaveStatus("saved");
        store.setLastSavedTime(new Date());
      } else {
        store.setSaveStatus(navigator.onLine ? "error" : "offline");
      }
    } catch {
      store.setSaveStatus("error");
    }
  }, [
    store.scenes, store.settings, store.manuscripts, store.projectTitle,
    store.editorSettings, store.backups, store.aiHistory, store.autoBackups, store.loaded
  ]);

  useEffect(() => {
    syncAllRef.current = syncAll;
  }, [syncAll]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!store.loaded) return;
    const t = setTimeout(syncAll, 1000);
    return () => clearTimeout(t);
  }, [
    store.scenes, store.settings, store.manuscripts, store.projectTitle,
    store.editorSettings, store.aiHistory, store.autoBackups, store.loaded, syncAll
  ]);

  // Force sync when coming back online
  useEffect(() => {
    if (!store.loaded) return;
    if (isOnlineState && !previousIsOnlineRef.current) {
        syncAllRef.current();
    }
    previousIsOnlineRef.current = isOnlineState;
  }, [isOnlineState, store.loaded]);


  // Auto-backup every 10 minutes
  useEffect(() => {
    if (!store.loaded) return;
    const timer = setInterval(() => {
      const { scenes: sc, manuscripts: ms } = latestStateRef.current;
      const newAutoBackup: Backup = { timestamp: new Date().toISOString(), label: null, scenes: sc, manuscripts: ms, settings: store.settings, projectTitle: store.projectTitle };
      store.setAutoBackups((prev) => [newAutoBackup, ...prev].slice(0, 5));
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [store.loaded, store.settings, store.projectTitle]);
}
