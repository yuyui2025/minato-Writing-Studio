import React from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import App from "./App";

supabase.auth.getSession().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
