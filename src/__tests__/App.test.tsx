import { render, screen } from "@testing-library/react";
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

  test("renders Google login button when not authenticated", async () => {
    render(<App />);
    const loginButton = await screen.findByRole("button", { name: /Googleでログイン/ });
    expect(loginButton).toBeInTheDocument();
  });

  test("transitions from loading to login screen", async () => {
    render(<App />);
    // Wait for async auth to resolve and login screen to appear
    const loginButton = await screen.findByRole("button", { name: /Googleでログイン/ });
    expect(loginButton).toBeInTheDocument();
  });
});
