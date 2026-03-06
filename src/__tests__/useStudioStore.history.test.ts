import { beforeEach, describe, expect, it } from "vitest";
import type { Scene } from "../types";
import { resetStudioStore, useStudioStore } from "../stores/useStudioStore";

const scene: Scene = {
  id: 1,
  chapter: "第一章",
  title: "導入",
  synopsis: "",
  status: "empty",
};

describe("useStudioStore history", () => {
  beforeEach(() => {
    resetStudioStore();
  });

  it("undo/redo manuscript changes", () => {
    const store = useStudioStore.getState();
    store.setScenes([scene]);
    store.handleSceneSelect(scene);
    store.handleManuscriptChange("A");
    store.handleManuscriptChange("AB");

    expect(useStudioStore.getState().manuscriptText).toBe("AB");

    useStudioStore.getState().undo();
    expect(useStudioStore.getState().manuscriptText).toBe("A");

    useStudioStore.getState().redo();
    expect(useStudioStore.getState().manuscriptText).toBe("AB");
  });

  it("undo/redo scene status changes", () => {
    const store = useStudioStore.getState();
    store.setScenes([scene]);
    store.handleStatusChange(scene.id, "draft");
    expect(useStudioStore.getState().scenes[0]?.status).toBe("draft");

    useStudioStore.getState().undo();
    expect(useStudioStore.getState().scenes[0]?.status).toBe("empty");

    useStudioStore.getState().redo();
    expect(useStudioStore.getState().scenes[0]?.status).toBe("draft");
  });
});
