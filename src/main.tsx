import React from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import App from "./App";
import "./index.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

supabase.auth.getSession().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
