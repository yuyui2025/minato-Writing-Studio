import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import "@testing-library/jest-dom";
import App from "../App";

test("renders app title", async () => {
  render(<App />);
  const titleElement = await screen.findByText(/港に届いた例外/i);
  expect(titleElement).toBeInTheDocument();
});
