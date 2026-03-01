import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase module before importing store
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

import { useStudioStore } from "../stores/useStudioStore";
import { initialScenes } from "../constants";

describe("useStudioStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset store state
    act(() => {
        useStudioStore.setState({
            loaded: true,
            scenes: initialScenes,
            selectedSceneId: null,
            manuscripts: {},
            tab: "write"
        });
    })
  });

  it("initializes with default scenes", async () => {
    const { result } = renderHook(() => useStudioStore());
    // In actual app, loaded becomes true after async init. Here we manually set it or check default
    // We already set loaded: true in beforeEach for convenience, but default is false.
    // Let's verify the reset worked.
    expect(result.current.scenes).toEqual(initialScenes);
  });

  it("starts with no selected scene", async () => {
    const { result } = renderHook(() => useStudioStore());
    expect(result.current.selectedSceneId).toBeNull();
  });

  it("selects a scene and updates selectedSceneId", async () => {
    const { result } = renderHook(() => useStudioStore());

    act(() => {
      result.current.handleSceneSelect(initialScenes[0]);
    });

    expect(result.current.selectedSceneId).toBe(initialScenes[0].id);
    expect(result.current.tab).toBe("write");
  });

  it("updates manuscript text", async () => {
    const { result } = renderHook(() => useStudioStore());

    act(() => {
      result.current.handleSceneSelect(initialScenes[0]);
    });
    act(() => {
      result.current.handleManuscriptChange("Hello World");
    });

    expect(result.current.manuscripts[initialScenes[0].id]).toBe("Hello World");
  });

  it("adds a new scene", async () => {
    const { result } = renderHook(() => useStudioStore());
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
    const { result } = renderHook(() => useStudioStore());
    const targetId = initialScenes[0].id;

    act(() => {
      result.current.handleDeleteScene(targetId);
    });
    expect(result.current.confirmDelete).toBe(targetId);

    act(() => {
      result.current.confirmDeleteExecute();
    });

    expect(result.current.scenes.find(s => s.id === targetId)).toBeUndefined();
    expect(result.current.confirmDelete).toBeNull();
  });

  it("deselects scene when selected scene is deleted", async () => {
    const { result } = renderHook(() => useStudioStore());

    act(() => {
      result.current.handleSceneSelect(initialScenes[0]);
    });
    expect(result.current.selectedSceneId).toBe(initialScenes[0].id);

    act(() => {
      result.current.handleDeleteScene(initialScenes[0].id);
    });
    act(() => {
      result.current.confirmDeleteExecute();
    });

    expect(result.current.selectedSceneId).toBeNull();
  });

  it("changes scene status", async () => {
    const { result } = renderHook(() => useStudioStore());

    act(() => {
      result.current.handleStatusChange(initialScenes[0].id, "done");
    });

    const scene = result.current.scenes.find(s => s.id === initialScenes[0].id);
    expect(scene?.status).toBe("done");
  });

  it("starts with default tab 'write'", async () => {
    const { result } = renderHook(() => useStudioStore());
    expect(result.current.tab).toBe("write");
  });

  it("updates project title", async () => {
    const { result } = renderHook(() => useStudioStore());

    act(() => {
      result.current.setProjectTitle("新プロジェクト");
    });

    expect(result.current.projectTitle).toBe("新プロジェクト");
  });
});
