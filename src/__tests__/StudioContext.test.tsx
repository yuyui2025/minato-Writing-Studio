import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { Scene } from "../types";

// Mock supabase module
vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

import { StudioProvider, useStudio } from "../contexts/StudioContext";
import { resetStudioStore } from "../stores/useStudioStore";

const mockUser = { id: "user-1" } as User;

// テスト用の汎用シーン（作品内容に依存しない）
const testScene: Scene = { id: 1, chapter: "第一章", title: "テストシーン", status: "empty", synopsis: "" };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StudioProvider user={mockUser}>{children}</StudioProvider>
);

describe("StudioContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    resetStudioStore();
  });

  afterEach(() => {
    resetStudioStore();
  });

  it("initializes with empty scenes", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.scenes).toEqual([]);
  });

  it("starts with no selected scene", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.selectedScene).toBeNull();
    expect(result.current.manuscriptText).toBe("");
    expect(result.current.wordCount).toBe(0);
  });

  it("selects a scene and updates selectedScene", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.setScenes([testScene]); });
    act(() => { result.current.handleSceneSelect(testScene); });

    expect(result.current.selectedScene?.id).toBe(testScene.id);
    expect(result.current.selectedScene?.title).toBe(testScene.title);
  });

  it("updates manuscript text and computes wordCount", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.setScenes([testScene]); });
    act(() => { result.current.handleSceneSelect(testScene); });
    act(() => { result.current.handleManuscriptChange("Hello World"); });

    expect(result.current.manuscriptText).toBe("Hello World");
    // wordCount excludes whitespace: "HelloWorld" = 10
    expect(result.current.wordCount).toBe(10);
  });

  it("adds a new scene", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const initialCount = result.current.scenes.length;

    act(() => {
      result.current.setNewScene({ chapter: "第一章", title: "新シーン", synopsis: "あらすじ" });
    });
    act(() => {
      result.current.handleAddScene();
    });

    expect(result.current.scenes.length).toBe(initialCount + 1);
    const added = result.current.scenes[result.current.scenes.length - 1];
    expect(added?.title).toBe("新シーン");
    expect(added?.chapter).toBe("第一章");
    expect(added?.status).toBe("empty");
  });

  it("deletes a scene via confirmDeleteExecute", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.setScenes([testScene]); });
    const initialCount = result.current.scenes.length;

    act(() => { result.current.handleDeleteScene(testScene.id); });
    expect(result.current.confirmDelete).toBe(testScene.id);

    act(() => { result.current.confirmDeleteExecute(); });

    expect(result.current.scenes.length).toBe(initialCount - 1);
    expect(result.current.scenes.find(s => s.id === testScene.id)).toBeUndefined();
    expect(result.current.confirmDelete).toBeNull();
  });

  it("deselects scene when selected scene is deleted", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.setScenes([testScene]); });
    act(() => { result.current.handleSceneSelect(testScene); });
    expect(result.current.selectedScene?.id).toBe(testScene.id);

    act(() => { result.current.handleDeleteScene(testScene.id); });
    act(() => { result.current.confirmDeleteExecute(); });

    expect(result.current.selectedScene).toBeNull();
  });

  it("changes scene status", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.setScenes([testScene]); });
    act(() => { result.current.handleStatusChange(testScene.id, "done"); });

    const scene = result.current.scenes.find(s => s.id === testScene.id);
    expect(scene?.status).toBe("done");
  });

  it("starts with default tab 'write'", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.tab).toBe("write");
  });

  it("updates project title", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.setProjectTitle("新プロジェクト"); });

    expect(result.current.projectTitle).toBe("新プロジェクト");
  });



  it("resets AI generation workspace state when switching projects", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.setAiResults(prev => ({ ...prev, polish: "提案テキスト" }));
      result.current.setAiErrors(prev => ({ ...prev, polish: "error" }));
      result.current.setAiLoading(prev => ({ ...prev, polish: true }));
      result.current.setAiApplied({ 1: true });
      result.current.setHintApplied({ 1: "insert" });
    });

    act(() => { result.current.createProject(); });

    expect(result.current.aiResults.polish).toBe("");
    expect(result.current.aiErrors.polish).toBe("");
    expect(result.current.aiLoading.polish).toBe(false);
    expect(result.current.aiApplied).toEqual({});
    expect(result.current.hintApplied).toEqual({});
  });
  it("wordCount ignores whitespace", async () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => { result.current.setScenes([testScene]); });
    act(() => { result.current.handleSceneSelect(testScene); });
    act(() => { result.current.handleManuscriptChange("あいう えお\nかきく"); });

    // "あいうえおかきく" = 8 chars without whitespace
    expect(result.current.wordCount).toBe(8);
  });
});
