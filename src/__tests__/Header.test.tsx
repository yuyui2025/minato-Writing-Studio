import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import { Header } from "../components/layout/Header";

vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

describe("Header", () => {
  test("shows placeholder and allows entering edit mode when project title is blank", () => {
    const setEditingTitle = vi.fn();

    render(
      <Header
        projectTitle="   "
        setProjectTitle={vi.fn()}
        editingTitle={false}
        setEditingTitle={setEditingTitle}
        saveStatus="saved"
        lastSavedTime={null}
        scenes={[]}
        settings={{ world: "", characters: "", theme: "" }}
        manuscripts={{}}
        saveWithBackup={vi.fn()}
        setShowBackups={vi.fn()}
        setShowExport={vi.fn()}
      />,
    );

    const title = screen.getByText("タイトル未設定");
    expect(title).toBeInTheDocument();

    fireEvent.click(title);
    expect(setEditingTitle).toHaveBeenCalledWith(true);
  });
});
