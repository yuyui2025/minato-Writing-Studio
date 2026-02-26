import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callAnthropic, AiError } from "../utils/ai";

describe("AiError", () => {
  it("is an instance of Error", () => {
    const err = new AiError("テストエラー");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AiError);
  });

  it("has name AiError", () => {
    const err = new AiError("テストエラー");
    expect(err.name).toBe("AiError");
  });

  it("stores status and details", () => {
    const err = new AiError("エラー", 400, { detail: "bad request" });
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ detail: "bad request" });
  });
});

describe("callAnthropic", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns text content on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ content: [{ type: "text", text: "AIの返答" }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await callAnthropic("テストプロンプト");
    expect(result).toBe("AIの返答");
  });

  it("concatenates multiple content blocks", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ content: [{ type: "text", text: "部分1" }, { type: "text", text: "部分2" }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await callAnthropic("プロンプト");
    expect(result).toBe("部分1部分2");
  });

  it("throws AiError on HTTP 400 error (no retry)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Invalid model" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(callAnthropic("プロンプト")).rejects.toThrow(AiError);
    // Should not retry on 4xx — fetch called only once
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws AiError on HTTP 500 error with default message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: 500 }), // non-string error to test fallback message
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    );

    let err500!: AiError;
    try { await callAnthropic("プロンプト"); } catch (e) { err500 = e as AiError; }
    expect(err500).toBeInstanceOf(AiError);
    expect(err500.message).toBe("AI通信エラーが発生しました");
  });

  it("retries on network failure and eventually throws AiError", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    // Make retry delays instant so the test doesn't take 3 seconds
    vi.spyOn(global, "setTimeout").mockImplementation((fn: TimerHandler) => {
      if (typeof fn === "function") fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    let errRetry!: AiError;
    try { await callAnthropic("プロンプト"); } catch (e) { errRetry = e as AiError; }

    expect(errRetry).toBeInstanceOf(AiError);
    expect(errRetry.message).toContain("ネットワークエラー");
    // Should have tried 3 times (initial + 2 retries)
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("sends request with correct structure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ content: [{ type: "text", text: "" }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    await callAnthropic("テスト", 500);

    expect(fetch).toHaveBeenCalledWith(
      "/api/anthropic/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: expect.stringContaining('"max_tokens":500'),
      })
    );
  });
});
