import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HintPanel } from "../components/ai/HintPanel";

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

vi.mock("../utils/ai", () => ({
  callAnthropic: vi.fn(),
  AiError: class AiError extends Error {
    name = "AiError";
  },
}));

import { callAnthropic, AiError } from "../utils/ai";

const defaultProps = {
  prompt: "ヒントを提案してください。",
  result: "",
  onResult: vi.fn(),
  loading: false,
  onLoading: vi.fn(),
  onError: vi.fn(),
  applied: {},
  onApplied: vi.fn(),
  manuscriptText: "海辺の夜、波が打ち寄せる。",
  onInsert: vi.fn(),
};

describe("HintPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the run button", () => {
    renderWithQuery(<HintPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /執筆ヒント/ })).toBeInTheDocument();
  });

  it("button shows '生成中…' when loading", () => {
    renderWithQuery(<HintPanel {...defaultProps} loading={true} />);
    expect(screen.getByText("生成中…")).toBeInTheDocument();
  });

  it("button shows '再試行' when error is present", () => {
    renderWithQuery(<HintPanel {...defaultProps} error="エラー発生" />);
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });

  it("displays error message when error prop is set", () => {
    renderWithQuery(<HintPanel {...defaultProps} error="タイムアウトしました" />);
    expect(screen.getByText(/タイムアウトしました/)).toBeInTheDocument();
  });

  it("renders hints when result is valid JSON", () => {
    const hints = [
      { hint: "感情表現を増やす", reason: "読者の共感を得るため", keyword: "波" },
    ];
    renderWithQuery(<HintPanel {...defaultProps} result={JSON.stringify(hints)} />);
    expect(screen.getByText("感情表現を増やす")).toBeInTheDocument();
    expect(screen.getByText("読者の共感を得るため")).toBeInTheDocument();
    expect(screen.getByText(/波/)).toBeInTheDocument();
  });

  it("renders hints without keyword", () => {
    const hints = [{ hint: "視点を変える", reason: "新鮮さのため" }];
    renderWithQuery(<HintPanel {...defaultProps} result={JSON.stringify(hints)} />);
    expect(screen.getByText("視点を変える")).toBeInTheDocument();
  });

  it("calls onLoading, onResult on successful run", async () => {
    const mockResult = JSON.stringify([{ hint: "ヒント", reason: "理由" }]);
    vi.mocked(callAnthropic).mockResolvedValueOnce(mockResult);

    renderWithQuery(<HintPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /執筆ヒント/ }));

    await waitFor(() => {
      expect(defaultProps.onLoading).toHaveBeenCalledWith(true);
      expect(defaultProps.onResult).toHaveBeenCalledWith(mockResult);
      expect(defaultProps.onLoading).toHaveBeenCalledWith(false);
    });
  });

  it("calls onError when callAnthropic throws AiError", async () => {
    vi.mocked(callAnthropic).mockRejectedValueOnce(new AiError("AI通信エラー"));

    renderWithQuery(<HintPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /執筆ヒント/ }));

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith("AI通信エラー");
    });
  });

  it("inserts hint comment near keyword in manuscript", () => {
    const hints = [{ hint: "もっと詳細に", reason: "臨場感のため", keyword: "波" }];
    renderWithQuery(<HintPanel {...defaultProps} result={JSON.stringify(hints)} />);

    fireEvent.click(screen.getByRole("button", { name: "参考にした" }));

    const expectedInsert = "海辺の夜、波\n※[ヒント: もっと詳細に]が打ち寄せる。";
    expect(defaultProps.onInsert).toHaveBeenCalledWith(expectedInsert);
    expect(defaultProps.onApplied).toHaveBeenCalled();
  });

  it("appends hint comment at end when keyword not found", () => {
    const hints = [{ hint: "もっと詳細に", reason: "臨場感のため", keyword: "存在しないキーワード" }];
    renderWithQuery(<HintPanel {...defaultProps} result={JSON.stringify(hints)} />);

    fireEvent.click(screen.getByRole("button", { name: "参考にした" }));

    expect(defaultProps.onInsert).toHaveBeenCalledWith(
      "海辺の夜、波が打ち寄せる。\n※[ヒント: もっと詳細に]"
    );
  });

  it("shows applied state after hint is applied", () => {
    const hints = [{ hint: "ヒント内容", reason: "理由" }];
    renderWithQuery(<HintPanel {...defaultProps} result={JSON.stringify(hints)} applied={{ 0: true }} />);
    expect(screen.getByText("✓ 済")).toBeInTheDocument();
  });
});
