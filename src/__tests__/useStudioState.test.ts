import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";

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

import { useStudioState } from "../hooks/useStudioState";
import { initialScenes } from "../constants";

const mockUser = { id: "user-1" } as User;

describe("useStudioState", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes with default scenes", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.scenes).toEqual(initialScenes);
  });

  it("starts with no selected scene", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.selectedScene).toBeNull();
    expect(result.current.manuscriptText).toBe("");
    expect(result.current.wordCount).toBe(0);
  });

  it("selects a scene and updates selectedScene", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.handleSceneSelect(initialScenes[0]);
    });

    expect(result.current.selectedScene?.id).toBe(initialScenes[0].id);
    expect(result.current.selectedScene?.title).toBe(initialScenes[0].title);
  });

  it("updates manuscript text and computes wordCount", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.handleSceneSelect(initialScenes[0]);
    });
    act(() => {
      result.current.handleManuscriptChange("Hello World");
    });

    expect(result.current.manuscriptText).toBe("Hello World");
    // wordCount excludes whitespace: "HelloWorld" = 10
    expect(result.current.wordCount).toBe(10);
  });

  it("adds a new scene", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const initialCount = result.current.scenes.length;

    act(() => {
      result.current.setNewScene({ chapter: "第三章", title: "新シーン", synopsis: "あらすじ" });
    });
    act(() => {
      result.current.handleAddScene();
    });

    expect(result.current.scenes.length).toBe(initialCount + 1);
    const added = result.current.scenes[result.current.scenes.length - 1];
    expect(added?.title).toBe("新シーン");
    expect(added?.chapter).toBe("第三章");
    expect(added?.status).toBe("empty");
  });

  it("deletes a scene via confirmDeleteExecute", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const initialCount = result.current.scenes.length;
    const targetId = initialScenes[0].id;

    act(() => {
      result.current.handleDeleteScene(targetId);
    });
    expect(result.current.confirmDelete).toBe(targetId);

    act(() => {
      result.current.confirmDeleteExecute();
    });

    expect(result.current.scenes.length).toBe(initialCount - 1);
    expect(result.current.scenes.find(s => s.id === targetId)).toBeUndefined();
    expect(result.current.confirmDelete).toBeNull();
  });

  it("deselects scene when selected scene is deleted", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.handleSceneSelect(initialScenes[0]);
    });
    expect(result.current.selectedScene?.id).toBe(initialScenes[0].id);

    act(() => {
      result.current.handleDeleteScene(initialScenes[0].id);
    });
    act(() => {
      result.current.confirmDeleteExecute();
    });

    expect(result.current.selectedScene).toBeNull();
  });

  it("changes scene status", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.handleStatusChange(initialScenes[0].id, "done");
    });

    const scene = result.current.scenes.find(s => s.id === initialScenes[0].id);
    expect(scene?.status).toBe("done");
  });

  it("starts with default tab 'write'", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.tab).toBe("write");
  });

  it("updates project title", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.setProjectTitle("新プロジェクト");
    });

    expect(result.current.projectTitle).toBe("新プロジェクト");
  });

  it("wordCount ignores whitespace", async () => {
    const { result } = renderHook(() => useStudioState(mockUser));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.handleSceneSelect(initialScenes[0]);
    });
    act(() => {
      result.current.handleManuscriptChange("あいう えお\nかきく");
    });

    // "あいうえおかきく" = 8 chars without whitespace
    expect(result.current.wordCount).toBe(8);
  });
});
