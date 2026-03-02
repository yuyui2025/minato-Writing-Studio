import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../utils/ai", () => ({
  callAnthropic: vi.fn(),
}));

import { callAnthropic } from "../utils/ai";
import { buildImportAnalysisExcerpt, extractImportMetadataBySections } from "../utils/importExtractor";

describe("importExtractor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds excerpt from chapter/title blocks with per-section cap", () => {
    const sectionA = "あ".repeat(1300);
    const sectionB = "い".repeat(1300);
    const sectionC = "う".repeat(1300);
    const excerpt = buildImportAnalysisExcerpt([
      { chapter: "第一章", title: "夜明け", content: sectionA },
      { chapter: "第二章", title: "出発", content: sectionB },
      { chapter: "第三章", title: "対決", content: sectionC },
    ]);

    expect(excerpt).toContain("## 第一章 / 夜明け");
    expect(excerpt).toContain("## 第二章 / 出発");
    expect(excerpt).toContain("## 第三章 / 対決");
    expect(excerpt).toContain("あ".repeat(1200));
    expect(excerpt).not.toContain("あ".repeat(1201));
    expect(excerpt).toContain("う".repeat(1200));
    expect(excerpt.length).toBeGreaterThanOrEqual(3600);
  });

  it("falls back to raw text when sections are empty", async () => {
    vi.mocked(callAnthropic).mockResolvedValueOnce('{"characters":"A","world":"B"}');

    await extractImportMetadataBySections([], "fallback body");

    const prompt = vi.mocked(callAnthropic).mock.calls[0][0];
    expect(prompt).toContain("fallback body");
  });
});
