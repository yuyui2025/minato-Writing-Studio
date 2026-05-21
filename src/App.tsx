import { useState, useEffect, lazy, Suspense } from "react";
import type { User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { WriteView } from "./components/views/WriteView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StudioProvider, useStudio } from "./contexts/StudioContext";

const AiAssistant = lazy(() => import("./components/ai/AiAssistant").then(m => ({ default: m.AiAssistant })));
const StructureView = lazy(() => import("./components/views/StructureView").then(m => ({ default: m.StructureView })));
const SettingsView = lazy(() => import("./components/views/SettingsView").then(m => ({ default: m.SettingsView })));
const PrefsView = lazy(() => import("./components/views/PrefsView").then(m => ({ default: m.PrefsView })));
const BackupModal = lazy(() => import("./components/modals/BackupModal").then(m => ({ default: m.BackupModal })));
const ExportModal = lazy(() => import("./components/modals/ExportModal").then(m => ({ default: m.ExportModal })));
const ImportModal = lazy(() => import("./components/modals/ImportModal").then(m => ({ default: m.ImportModal })));
const ProjectShelfModal = lazy(() => import("./components/modals/ProjectShelfModal").then(m => ({ default: m.ProjectShelfModal })));
const DeleteConfirmModal = lazy(() => import("./components/modals/DeleteConfirmModal").then(m => ({ default: m.DeleteConfirmModal })));
const TutorialModal = lazy(() => import("./components/modals/TutorialModal").then(m => ({ default: m.TutorialModal })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [launchMode, setLaunchMode] = useState<"select" | "offline" | "authenticated">("select");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLaunchMode(session?.user ? "authenticated" : "select");
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLaunchMode(session?.user ? "authenticated" : "select");
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0e1a", gap: 8 }}>
      <div style={{ color: "#2a4060", fontSize: 12, letterSpacing: 2 }}>読み込み中…</div>
      <div aria-hidden="true" style={{ color: "#1e3050", fontSize: 11, letterSpacing: 1 }}>minato Writing Studio</div>
    </div>
  );

  if (!user && launchMode === "select") return (
    <main style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0e1a", gap: 24 }}>
      <div aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="20" height="20" rx="2" stroke="#1e3050" strokeWidth="1.5"/>
          <line x1="8" y1="9" x2="20" y2="9" stroke="#2a4060" strokeWidth="1.2"/>
          <line x1="8" y1="13" x2="20" y2="13" stroke="#2a4060" strokeWidth="1.2"/>
          <line x1="8" y1="17" x2="16" y2="17" stroke="#1e3050" strokeWidth="1.2"/>
          <circle cx="22" cy="22" r="5" fill="#0a0e1a" stroke="#4a6fa5" strokeWidth="1"/>
          <line x1="20" y1="22" x2="24" y2="22" stroke="#4a6fa5" strokeWidth="1"/>
          <line x1="22" y1="20" x2="22" y2="24" stroke="#4a6fa5" strokeWidth="1"/>
        </svg>
        <div aria-hidden="true" style={{ fontSize: 7, letterSpacing: 1.5, color: "#1e3050", textAlign: "center", marginTop: 4 }}>minato ws</div>
      </div>
      <div style={{ fontSize: 18, color: "#c8d8e8", fontWeight: 700, fontFamily: "'Noto Serif JP','Georgia',serif", letterSpacing: 1 }}>minato Writing Studio</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })} style={{
          padding: "10px 28px", background: "rgba(74,111,165,0.15)", border: "1px solid #4a6fa5",
          color: "#7ab3e0", cursor: "pointer", borderRadius: 6, fontSize: 13, fontFamily: "inherit", letterSpacing: 1,
        }}>Googleでログイン</button>
        <button
          onClick={() => setLaunchMode("offline")}
          style={{
            padding: "10px 28px", background: "transparent", border: "1px solid #2a4060",
            color: "#6f8baa", cursor: "pointer", borderRadius: 6, fontSize: 12, fontFamily: "inherit", letterSpacing: 1,
          }}
        >
          オフラインで開始
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#7a9ac0", textAlign: "center", lineHeight: 1.8 }}>
        DBログインすると端末間でデータを同期できます。<br />
        オフライン起動時は、この端末のローカル保存のみ利用します。
      </p>
      <a
        href="https://www.notion.so/36750786cdc380a8b2bdd4ca481f327f"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, color: "#2a4060", textDecoration: "none" }}
      >
        プライバシーポリシー
      </a>
    </main>
  );

  if (!user && launchMode === "offline") {
    return (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <StudioProvider user={null}>
            <Studio />
          </StudioProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <StudioProvider user={user}>
          <Studio />
        </StudioProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

function Studio() {
  const {
    loaded, tab, sidebarOpen, showSettings,
    confirmDelete, showExport, showBackups, showImport, showProjectShelf, showTutorial, setSidebarOpen, setShowSettings,
    sidebarFloat, aiHistory, clearAiHistory, manuscriptText, handleManuscriptChange,
    scenes, selectedSceneId, handleSceneSelect, manuscripts, setTab,
  } = useStudio();
  const [showCurrentOnly, setShowCurrentOnly] = useState(false);

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <div style={{ color: "#2a4060", fontSize: 12, letterSpacing: 3 }}>loading...</div>
      <div aria-hidden="true" style={{ color: "#1e3050", fontSize: 11, letterSpacing: 1 }}>minato Writing Studio</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#c8d8e8", fontFamily: "'Noto Serif JP','Georgia',serif", display: "flex", flexDirection: "column" }}>
      <Suspense fallback={null}>
        {confirmDelete && <DeleteConfirmModal />}
        {showExport && <ExportModal />}
        {showImport && <ImportModal />}
        {showTutorial && <TutorialModal />}
        {showBackups && <BackupModal />}
        {showProjectShelf && <ProjectShelfModal />}
      </Suspense>
      <Header />

      <div id="studio-main-shell" style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {/* フロートオーバーレイ背景 */}
        {((sidebarOpen && sidebarFloat) || (showSettings && tab === "write")) && (
          <div onClick={() => { setSidebarOpen(false); setShowSettings(false); }} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)" }} />
        )}
        <Sidebar />

        <main id={tab === "write" ? "studio-write-stage" : undefined} style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#0a0e1a" }}>
          {tab === "write" && <WriteView />}
          <Suspense fallback={null}>
            {tab === "structure" && <StructureView />}
            {tab === "settings" && <SettingsView />}
            {tab === "prefs" && <PrefsView />}
          </Suspense>
          {tab === "ai" && (
            <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", width: "100%", boxSizing: "border-box", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #1e2d42", paddingBottom: "12px" }}>
                <h2 style={{ fontSize: "18px", color: "#7ab3e0", margin: 0, letterSpacing: "2px" }}>AI 履歴</h2>
                <div style={{ marginLeft: "auto", display: "flex", gap: "12px", alignItems: "center" }}>
                  {/* YUY-25: 現在シーンのみフィルタ */}
                  {selectedSceneId && (
                    <button
                      onClick={() => setShowCurrentOnly(v => !v)}
                      style={{ fontSize: "11px", padding: "4px 12px", background: showCurrentOnly ? "rgba(74,111,165,0.2)" : "transparent", border: `1px solid ${showCurrentOnly ? "#4a6fa5" : "#1e2d42"}`, color: showCurrentOnly ? "#7ab3e0" : "#3a5570", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {showCurrentOnly ? "現在のシーンのみ" : "全て表示"}
                    </button>
                  )}
                  {aiHistory.length > 0 && (
                    <button onClick={clearAiHistory} style={{ fontSize: "11px", padding: "4px 12px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}>履歴をすべて消去</button>
                  )}
                </div>
              </div>
              {(() => {
                const filtered = showCurrentOnly
                  ? aiHistory.filter(item => item.sceneId === selectedSceneId)
                  : aiHistory;
                if (filtered.length === 0) return (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#2a4060", fontSize: "14px" }}>
                    {showCurrentOnly ? "このシーンの履歴はありません" : "まだ履歴がありません"}
                  </div>
                );
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filtered.map(item => {
                      const d = new Date(item.timestamp);
                      const timeLabel = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
                      const isDifferentScene = item.sceneId && item.sceneId !== selectedSceneId;
                      // YUY-27: 追記先シーンへ移動してから追記
                      const handleInsert = () => {
                        if (item.sceneId && item.sceneId !== selectedSceneId) {
                          const targetScene = scenes.find(s => s.id === item.sceneId);
                          if (targetScene) {
                            handleSceneSelect(targetScene);
                            setTab("write");
                            const targetText = manuscripts[item.sceneId] || "";
                            handleManuscriptChange(targetText + (targetText ? "\n\n" : "") + item.content);
                            return;
                          }
                        }
                        handleManuscriptChange(manuscriptText + (manuscriptText ? "\n\n" : "") + item.content);
                      };
                      return (
                        <div key={item.id} style={{ padding: "20px", background: "#0a0f1a", border: "1px solid #1a2535", borderRadius: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <span style={{ fontSize: "12px", color: "#4a6fa5", fontWeight: "bold", background: "rgba(74,111,165,0.1)", padding: "2px 8px", borderRadius: "4px" }}>{item.label}</span>
                            <span style={{ fontSize: "11px", color: "#2a4060" }}>{timeLabel}</span>
                            {item.sceneTitle && (
                              <span style={{ fontSize: "11px", color: isDifferentScene ? "#4a6fa5" : "#3a5570", fontStyle: "italic", marginLeft: "auto" }}>{item.sceneTitle}</span>
                            )}
                          </div>
                          <div style={{ fontSize: "14px", color: "#8ab0cc", lineHeight: "1.8", whiteSpace: "pre-wrap", marginBottom: "16px", maxHeight: "400px", overflowY: "auto", padding: "12px", background: "#070a14", borderRadius: "4px" }}>
                            {item.content}
                          </div>
                          <div style={{ display: "flex", gap: "12px" }}>
                            {/* YUY-27: 追記ボタン（表示シーン以外にも正しく適用） */}
                            <button
                              onClick={handleInsert}
                              style={{ fontSize: "12px", padding: "6px 16px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a6050", color: "#5ab090", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}
                              title={isDifferentScene ? `「${item.sceneTitle}」へ移動して追記` : "現在のシーンに追記"}
                            >
                              {isDifferentScene ? `「${item.sceneTitle}」へ移動して追記` : "現在のシーンに追記する"}
                            </button>
                            {/* YUY-26: シーン移動ボタン */}
                            {item.sceneId && (
                              <button
                                onClick={() => {
                                  const targetScene = scenes.find(s => s.id === item.sceneId);
                                  if (targetScene) { handleSceneSelect(targetScene); setTab("write"); }
                                }}
                                style={{ fontSize: "12px", padding: "6px 16px", background: "transparent", border: "1px solid #1e2d42", color: isDifferentScene ? "#4a6fa5" : "#3a5570", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}
                              >
                                シーンへ移動
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </main>

        {/* AI Assistant */}
        {tab === "write" && (
          <ErrorBoundary fallback={<div style={{ position: "fixed", right: 16, bottom: 16, padding: "8px 16px", background: "#0a0e1a", border: "1px solid #2a4060", color: "#e05555", fontSize: 11, borderRadius: 4 }}>AIアシスタントでエラーが発生しました</div>}>
            <Suspense fallback={null}>
              <AiAssistant />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

    </div>
  );
}
