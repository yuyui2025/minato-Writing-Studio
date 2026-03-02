import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi, describe } from "vitest";
import "@testing-library/jest-dom";
import App from "../App";

vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe("App", () => {
  test("renders project title when not authenticated", async () => {
    render(<App />);
    const titleElement = await screen.findByText(/minato Writing Studio/i);
    expect(titleElement).toBeInTheDocument();
  });

  test("renders startup options and sync guidance when not authenticated", async () => {
    render(<App />);
    const loginButton = await screen.findByRole("button", { name: /Googleでログイン/ });
    const offlineButton = await screen.findByRole("button", { name: /オフラインで開始/ });
    expect(loginButton).toBeInTheDocument();
    expect(offlineButton).toBeInTheDocument();
    expect(await screen.findByText(/DBログインすると端末間でデータを同期できます/)).toBeInTheDocument();
  });

  test("transitions from startup selection to studio on offline launch", async () => {
    render(<App />);
    const offlineButton = await screen.findByRole("button", { name: /オフラインで開始/ });
    fireEvent.click(offlineButton);
    await waitFor(() => {
      expect(screen.queryByText(/DBログインすると端末間でデータを同期できます/)).not.toBeInTheDocument();
    });
  });
});
