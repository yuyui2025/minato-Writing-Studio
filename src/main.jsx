import React from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import App from "./App.jsx";

// URLのハッシュにトークンがある場合に処理
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

supabase.auth.getSession().then(() => {
  createRoot(document.getElementById("root")).render(<App />);
});
