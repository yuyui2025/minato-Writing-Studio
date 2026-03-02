import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import { Header } from "../components/layout/Header";
import { useStudio } from "../contexts/StudioContext";

vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

vi.mock("../contexts/StudioContext", () => ({
  useStudio: vi.fn(),
}));

describe("Header", () => {
  test("shows placeholder and allows entering edit mode when project title is blank", () => {
    const setEditingTitle = vi.fn();
    (useStudio as any).mockReturnValue({
      projectTitle: "   ",
      setProjectTitle: vi.fn(),
      editingTitle: false,
      setEditingTitle: setEditingTitle,
      saveStatus: "saved",
      lastSavedTime: null,
      scenes: [],
      settings: { world: "", characters: "", theme: "" },
      manuscripts: {},
      saveWithBackup: vi.fn(),
      setShowBackups: vi.fn(),
      setShowImport: vi.fn(),
      setShowExport: vi.fn(),
      setShowProjectShelf: vi.fn(),
    });

    render(<Header />);

    const title = screen.getByText("タイトル未設定");
    expect(title).toBeInTheDocument();

    fireEvent.click(title);
    expect(setEditingTitle).toHaveBeenCalledWith(true);
  });

  test("shows explicit project switcher label on shelf button", () => {
    (useStudio as any).mockReturnValue({
      projectTitle: "Project A",
      setProjectTitle: vi.fn(),
      editingTitle: false,
      setEditingTitle: vi.fn(),
      saveStatus: "saved",
      lastSavedTime: null,
      scenes: [],
      settings: { world: "", characters: "", theme: "" },
      manuscripts: {},
      saveWithBackup: vi.fn(),
      setShowBackups: vi.fn(),
      setShowImport: vi.fn(),
      setShowExport: vi.fn(),
      setShowProjectShelf: vi.fn(),
    });

    render(<Header />);

    expect(screen.getByRole("button", { name: "プロジェクト切替を開く" })).toBeInTheDocument();
    expect(screen.getByText("プロジェクト")).toBeInTheDocument();
    expect(screen.getByText("切替")).toBeInTheDocument();
  });
});
