import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

import { AiAssistant } from "./components/ai/AiAssistant";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { WriteView } from "./components/views/WriteView";
import { StructureView } from "./components/views/StructureView";
import { SettingsView } from "./components/views/SettingsView";
import { PrefsView } from "./components/views/PrefsView";
import { useStudioState } from "./hooks/useStudioState";
import { BackupModal } from "./components/modals/BackupModal";
import { ExportModal } from "./components/modals/ExportModal";
import { DeleteConfirmModal } from "./components/modals/DeleteConfirmModal";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0e1a", gap: 8 }}>
      <div style={{ color: "#2a4060", fontSize: 12, letterSpacing: 2 }}>読み込み中…</div>
      <div style={{ color: "#1e3050", fontSize: 11, letterSpacing: 1 }}>minato Writing Studio</div>
    </div>
  );

  if (!user) return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0e1a", gap: 24 }}>
      <div>
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="4" width="20" height="20" rx="2" stroke="#1e3050" strokeWidth="1.5"/>
          <line x1="8" y1="9" x2="20" y2="9" stroke="#2a4060" strokeWidth="1.2"/>
          <line x1="8" y1="13" x2="20" y2="13" stroke="#2a4060" strokeWidth="1.2"/>
          <line x1="8" y1="17" x2="16" y2="17" stroke="#1e3050" strokeWidth="1.2"/>
          <circle cx="22" cy="22" r="5" fill="#0a0e1a" stroke="#4a6fa5" strokeWidth="1"/>
          <line x1="20" y1="22" x2="24" y2="22" stroke="#4a6fa5" strokeWidth="1"/>
          <line x1="22" y1="20" x2="22" y2="24" stroke="#4a6fa5" strokeWidth="1"/>
        </svg>
        <div style={{ fontSize: 7, letterSpacing: 1.5, color: "#1e3050", textAlign: "center", marginTop: 4 }}>minato ws</div>
      </div>
      <div style={{ fontSize: 18, color: "#c8d8e8", fontWeight: 700, fontFamily: "'Noto Serif JP','Georgia',serif", letterSpacing: 1 }}>minato Writing Studio</div>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })} style={{
        padding: "10px 28px", background: "rgba(74,111,165,0.15)", border: "1px solid #4a6fa5",
        color: "#7ab3e0", cursor: "pointer", borderRadius: 6, fontSize: 13, fontFamily: "inherit", letterSpacing: 1,
      }}>Googleでログイン</button>
    </div>
  );

  return (
    <ErrorBoundary>
      <Studio user={user} />
    </ErrorBoundary>
  );
}

function Studio({ user }: { user: User }) {
  const {
    loaded, saveStatus, lastSavedTime, tab, setTab, settings, setSettings,
    settingsTab, setSettingsTab, scenes, setScenes, selectedSceneId,
    manuscripts, setManuscripts, showSettings, setShowSettings, sidebarOpen, setSidebarOpen,
    newScene, setNewScene, addingScene, setAddingScene, confirmDelete, setConfirmDelete,
    addingChapter, setAddingChapter, projectTitle, setProjectTitle, editingTitle, setEditingTitle,
    showExport, setShowExport, sceneSearch, setSceneSearch, backups,
    showBackups, setShowBackups, verticalPreview, setVerticalPreview,
    editingSceneTitle, setEditingSceneTitle, editingSceneSynopsis, setEditingSceneSynopsis,
    sidebarFloat, setSidebarFloat, sidebarTab, setSidebarTab, editorSettings, setEditorSettings,
    aiFloat, setAiFloat, aiWide, setAiWide, aiResults, setAiResults, aiErrors, setAiErrors, aiLoading, setAiLoading,
    aiApplied, setAiApplied, hintApplied, setHintApplied,
    selectedScene, manuscriptText, wordCount,
    handleSceneSelect, handleManuscriptChange, handleStatusChange, handleAddScene,
    handleDeleteScene, confirmDeleteExecute, saveWithBackup, exportScene, exportAll,
    handleSaveBackup, aiHistory, addAiHistory, clearAiHistory, autoBackups,
  } = useStudioState(user);

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <div style={{ color: "#2a4060", fontSize: 12, letterSpacing: 3 }}>loading...</div>
      <div style={{ color: "#1e3050", fontSize: 11, letterSpacing: 1 }}>minato Writing Studio</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#c8d8e8", fontFamily: "'Noto Serif JP','Georgia',serif", display: "flex", flexDirection: "column" }}>
      {/* Delete confirm modal */}
      {confirmDelete && (
        <DeleteConfirmModal
          scene={scenes.find((s) => s.id === confirmDelete)}
          onConfirm={confirmDeleteExecute}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {/* Export modal */}
      {showExport && (
        <ExportModal
          selectedScene={selectedScene}
          _projectTitle={projectTitle}
          onExportScene={exportScene}
          onExportAll={exportAll}
          onClose={() => setShowExport(false)}
        />
      )}
      {/* Backup modal */}
      {showBackups && (
        <BackupModal
          backups={backups}
          autoBackups={autoBackups}
          _scenes={scenes}
          _settings={settings}
          _manuscripts={manuscripts}
          onRestore={(sc, ms, restoredSettings, restoredTitle) => {
            setScenes(sc);
            setManuscripts(ms);
            if (restoredSettings) setSettings(restoredSettings);
            if (restoredTitle) setProjectTitle(restoredTitle);
            setShowBackups(false);
          }}
          onSaveBackup={handleSaveBackup}
          onClose={() => setShowBackups(false)}
        />
      )}
      <Header
        projectTitle={projectTitle}
        setProjectTitle={setProjectTitle}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        scenes={scenes}
        settings={settings}
        manuscripts={manuscripts}
        saveWithBackup={saveWithBackup}
        setShowBackups={setShowBackups}
        setShowExport={setShowExport}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {/* フロートオーバーレイ背景 */}
        {((sidebarOpen && sidebarFloat) || (showSettings && aiFloat && tab === "write")) && (
          <div onClick={() => { setSidebarOpen(false); setShowSettings(false); }} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)" }} />
        )}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarFloat={sidebarFloat}
          setSidebarFloat={setSidebarFloat}
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          tab={tab}
          setTab={setTab}
          scenes={scenes}
          selectedSceneId={selectedSceneId}
          manuscripts={manuscripts}
          sceneSearch={sceneSearch}
          setSceneSearch={setSceneSearch}
          newScene={newScene}
          setNewScene={setNewScene}
          addingScene={addingScene}
          setAddingScene={setAddingScene}
          addingChapter={addingChapter}
          setAddingChapter={setAddingChapter}
          settings={settings}
          setSettings={setSettings}
          editorSettings={editorSettings}
          setEditorSettings={setEditorSettings}
          handleSceneSelect={handleSceneSelect}
          handleAddScene={handleAddScene}
          aiHistory={aiHistory}
          onInsertHistory={(content) => handleManuscriptChange(manuscriptText + (manuscriptText ? "\n" : "") + content)}
          onClearHistory={clearAiHistory}
        />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {tab === "write" && (
            <WriteView
              selectedScene={selectedScene}
              scenes={scenes}
              setScenes={setScenes}
              selectedSceneId={selectedSceneId}
              editingSceneTitle={editingSceneTitle}
              setEditingSceneTitle={setEditingSceneTitle}
              editingSceneSynopsis={editingSceneSynopsis}
              setEditingSceneSynopsis={setEditingSceneSynopsis}
              handleStatusChange={handleStatusChange}
              verticalPreview={verticalPreview}
              setVerticalPreview={setVerticalPreview}
              handleDeleteScene={handleDeleteScene}
              manuscriptText={manuscriptText}
              handleManuscriptChange={handleManuscriptChange}
              editorSettings={editorSettings}
              handleSceneSelect={handleSceneSelect}
              wordCount={wordCount}
              aiResults={aiResults}
              setAiResults={setAiResults}
              aiErrors={aiErrors}
              setAiErrors={setAiErrors}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
              settings={settings}
              addAiHistory={addAiHistory}
            />
          )}

          {tab === "structure" && (
            <StructureView
              scenes={scenes}
              setScenes={setScenes}
              manuscripts={manuscripts}
              addingScene={addingScene}
              setAddingScene={setAddingScene}
              newScene={newScene}
              setNewScene={setNewScene}
              handleAddScene={handleAddScene}
              addingChapter={addingChapter}
              setAddingChapter={setAddingChapter}
              handleSceneSelect={handleSceneSelect}
              selectedSceneId={selectedSceneId}
            />
          )}

          {tab === "settings" && (
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              settingsTab={settingsTab}
              setSettingsTab={setSettingsTab}
              aiResults={aiResults}
              setAiResults={setAiResults}
              aiErrors={aiErrors}
              setAiErrors={setAiErrors}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
            />
          )}
          {tab === "prefs" && (
            <PrefsView
              editorSettings={editorSettings}
              setEditorSettings={setEditorSettings}
            />
          )}
          {tab === "ai" && (
            <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", width: "100%", boxSizing: "border-box", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #1e2d42", paddingBottom: "12px" }}>
                <h2 style={{ fontSize: "18px", color: "#7ab3e0", margin: 0, letterSpacing: "2px" }}>AI 履歴</h2>
                <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
                  {aiHistory.length > 0 && (
                    <button onClick={clearAiHistory} style={{ fontSize: "11px", padding: "4px 12px", background: "transparent", border: "1px solid #1e2d42", color: "#3a5570", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}>履歴をすべて消去</button>
                  )}
                </div>
              </div>
              {aiHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#2a4060", fontSize: "14px" }}>まだ履歴がありません</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {aiHistory.map(item => {
                    const d = new Date(item.timestamp);
                    const timeLabel = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
                    return (
                      <div key={item.id} style={{ padding: "20px", background: "#0a0f1a", border: "1px solid #1a2535", borderRadius: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          <span style={{ fontSize: "12px", color: "#4a6fa5", fontWeight: "bold", background: "rgba(74,111,165,0.1)", padding: "2px 8px", borderRadius: "4px" }}>{item.label}</span>
                          <span style={{ fontSize: "11px", color: "#2a4060" }}>{timeLabel}</span>
                          {item.sceneTitle && (
                            <span style={{ fontSize: "11px", color: "#3a5570", fontStyle: "italic", marginLeft: "auto" }}>{item.sceneTitle}</span>
                          )}
                        </div>
                        <div style={{ fontSize: "14px", color: "#8ab0cc", lineHeight: "1.8", whiteSpace: "pre-wrap", marginBottom: "16px", maxHeight: "400px", overflowY: "auto", padding: "12px", background: "#070a14", borderRadius: "4px" }}>
                          {item.content}
                        </div>
                        <button
                          onClick={() => handleManuscriptChange(manuscriptText + (manuscriptText ? "\n\n" : "") + item.content)}
                          style={{ fontSize: "12px", padding: "6px 16px", background: "rgba(42,128,96,0.15)", border: "1px solid #2a6050", color: "#5ab090", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          現在のシーンに追記する
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* AI Assistant */}
        {tab === "write" && (
          <ErrorBoundary fallback={<div style={{ position: "fixed", right: 16, bottom: 16, padding: "8px 16px", background: "#0a0e1a", border: "1px solid #2a4060", color: "#e05555", fontSize: 11, borderRadius: 4 }}>AIアシスタントでエラーが発生しました</div>}>
            <AiAssistant
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              aiFloat={aiFloat}
              setAiFloat={setAiFloat}
              aiWide={aiWide}
              setAiWide={setAiWide}
              aiResults={aiResults}
              setAiResults={setAiResults}
              aiErrors={aiErrors}
              setAiErrors={setAiErrors}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
              aiApplied={aiApplied}
              setAiApplied={setAiApplied}
              hintApplied={hintApplied}
              setHintApplied={setHintApplied}
              manuscriptText={manuscriptText}
              handleManuscriptChange={handleManuscriptChange}
              settings={settings}
              selectedScene={selectedScene}
              addAiHistory={addAiHistory}
            />
          </ErrorBoundary>
        )}
      </div>

    </div>
  );
}
