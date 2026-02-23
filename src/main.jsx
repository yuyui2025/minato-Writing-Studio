import React from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase.js";
import App from "./App.jsx";

supabase.auth.getSession().then(() => {
  createRoot(document.getElementById("root")).render(<App />);
});
