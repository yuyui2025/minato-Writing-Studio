import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PolishPanel } from "../components/ai/PolishPanel";

vi.mock("../utils/ai", () => ({
  callAnthropic: vi.fn(),
  AiError: class AiError extends Error {
    name = "AiError";
  },
}));

import { callAnthropic, AiError } from "../utils/ai";

const defaultProps = {
  manuscriptText: "テスト用の原稿テキストです。",
  onApply: vi.fn(),
  result: "",
  onResult: vi.fn(),
  loading: false,
  onLoading: vi.fn(),
  onError: vi.fn(),
  applied: {},
  onApplied: vi.fn(),
};

describe("PolishPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the run button", () => {
    render(<PolishPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /文章を推敲/ })).toBeInTheDocument();
  });

  it("button shows '生成中…' when loading", () => {
    render(<PolishPanel {...defaultProps} loading={true} />);
    expect(screen.getByText("生成中…")).toBeInTheDocument();
  });

  it("button shows '再試行' when there is an error", () => {
    render(<PolishPanel {...defaultProps} error="エラー発生" />);
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });

  it("displays error message when error prop is set", () => {
    render(<PolishPanel {...defaultProps} error="接続エラーが発生しました" />);
    expect(screen.getByText(/接続エラーが発生しました/)).toBeInTheDocument();
  });

  it("renders suggestions when result is valid JSON", () => {
    const suggestions = [
      { original: "元の表現", suggestion: "改善案", reason: "理由" },
    ];
    render(<PolishPanel {...defaultProps} result={JSON.stringify(suggestions)} />);
    expect(screen.getByText("元の表現")).toBeInTheDocument();
    expect(screen.getByText("→ 改善案")).toBeInTheDocument();
    expect(screen.getByText("理由")).toBeInTheDocument();
  });

  it("shows parse failure message when result is invalid JSON", () => {
    render(<PolishPanel {...defaultProps} result="invalid json {" />);
    expect(screen.getByText(/パース失敗/)).toBeInTheDocument();
  });

  it("calls onLoading, onResult, onError on successful run", async () => {
    const mockResult = JSON.stringify([{ original: "a", suggestion: "b", reason: "c" }]);
    vi.mocked(callAnthropic).mockResolvedValueOnce(mockResult);

    render(<PolishPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /文章を推敲/ }));

    await waitFor(() => {
      expect(defaultProps.onLoading).toHaveBeenCalledWith(true);
      expect(defaultProps.onResult).toHaveBeenCalledWith(mockResult);
      expect(defaultProps.onLoading).toHaveBeenCalledWith(false);
    });
  });

  it("calls onError when callAnthropic throws AiError", async () => {
    vi.mocked(callAnthropic).mockRejectedValueOnce(new AiError("API制限エラー"));

    render(<PolishPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /文章を推敲/ }));

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith("API制限エラー");
    });
  });

  it("calls onApply and onApplied when '適用' button is clicked", () => {
    const suggestions = [
      { original: "元テキスト", suggestion: "改善テキスト", reason: "理由" },
    ];
    render(
      <PolishPanel
        {...defaultProps}
        result={JSON.stringify(suggestions)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "適用" }));
    expect(defaultProps.onApply).toHaveBeenCalledWith("元テキスト", "改善テキスト");
    expect(defaultProps.onApplied).toHaveBeenCalled();
  });

  it("calls onApply with inserted note when '直後に挿入' button is clicked", () => {
    const suggestions = [
      { original: "元テキスト", suggestion: "改善テキスト", reason: "理由" },
    ];
    render(
      <PolishPanel
        {...defaultProps}
        result={JSON.stringify(suggestions)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "直後に挿入" }));
    expect(defaultProps.onApply).toHaveBeenCalledWith(
      "元テキスト",
      "元テキスト\n＊改善テキスト"
    );
  });

  it("shows applied state when suggestion is applied", () => {
    const suggestions = [
      { original: "元テキスト", suggestion: "改善テキスト", reason: "理由" },
    ];
    render(
      <PolishPanel
        {...defaultProps}
        result={JSON.stringify(suggestions)}
        applied={{ 0: "replace" }}
      />
    );

    expect(screen.getByText(/✓ 済/)).toBeInTheDocument();
  });
});
