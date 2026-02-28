import { describe, expect, test } from "vitest";
import { parsePolishHistoryEntries } from "../components/ai/AiAssistant";

describe("parsePolishHistoryEntries", () => {
  test("returns one history entry per suggestion", () => {
    const input = JSON.stringify([
      { reason: "語尾が重複", original: "彼は歩いた。", suggestion: "彼は静かに歩いた。" },
      { reason: "描写不足", original: "空は青い。", suggestion: "空は群青に染まっていた。" },
      { reason: "テンポ調整", original: "そして。", suggestion: "そして、彼は振り返った。" },
    ]);

    const entries = parsePolishHistoryEntries(input);

    expect(entries).toEqual([
      "・[語尾が重複] 彼は歩いた。 → 彼は静かに歩いた。",
      "・[描写不足] 空は青い。 → 空は群青に染まっていた。",
      "・[テンポ調整] そして。 → そして、彼は振り返った。",
    ]);
  });

  test("ignores invalid suggestion entries", () => {
    const input = JSON.stringify([
      { reason: "ok", original: "a", suggestion: "b" },
      { reason: "invalid", original: "", suggestion: "x" },
      { reason: "invalid", original: "y" },
    ]);

    expect(parsePolishHistoryEntries(input)).toEqual(["・[ok] a → b"]);
  });
});
