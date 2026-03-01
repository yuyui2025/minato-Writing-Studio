import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase so tests don't need real credentials
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

import { storageGet, storageSet } from "../utils/storage";

describe("storageGet", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("returns null when key does not exist", async () => {
    const result = await storageGet("missing-key");
    expect(result).toBeNull();
  });

  it("returns the stored value for a normal string", async () => {
    await storageSet("test-key", "hello");
    const result = await storageGet<string>("test-key");
    expect(result).toBe("hello");
  });

  it("returns empty string when title was saved as empty string (YUY-18)", async () => {
    // Simulate user clearing the project title
    await storageSet("minato:title", "");
    const result = await storageGet<string>("minato:title");
    // Must return "" not null, so the app restores the blank title
    expect(result).toBe("");
  });

  it("returns false when a boolean false was stored", async () => {
    await storageSet("minato:sidebarFloat", false);
    const result = await storageGet<boolean>("minato:sidebarFloat");
    expect(result).toBe(false);
  });

  it("returns 0 when numeric zero was stored", async () => {
    await storageSet("test-zero", 0);
    const result = await storageGet<number>("test-zero");
    expect(result).toBe(0);
  });
});

describe("storageSet", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("returns true even when Supabase has no authenticated user (YUY-19)", async () => {
    // Supabase mock returns user: null (not authenticated)
    const result = await storageSet("minato:title", "テスト");
    // Should return true because localStorage save succeeded
    expect(result).toBe(true);
  });

  it("persists data to localStorage regardless of Supabase status", async () => {
    await storageSet("minato:title", "テスト作品");
    const raw = localStorage.getItem("minato:title");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.value).toBe("テスト作品");
  });

  it("persists empty string to localStorage (YUY-18)", async () => {
    await storageSet("minato:title", "");
    const raw = localStorage.getItem("minato:title");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.value).toBe("");
  });
});
