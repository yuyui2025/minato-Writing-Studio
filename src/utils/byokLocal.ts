import { supabase } from "../supabase";

const BYOK_LOCAL_KEY = "minato:byok_local_key";

export function getByokLocalKey(): string {
  return localStorage.getItem(BYOK_LOCAL_KEY) ?? "";
}

export function saveByokLocalKey(key: string): void {
  if (key) localStorage.setItem(BYOK_LOCAL_KEY, key);
  else localStorage.removeItem(BYOK_LOCAL_KEY);
}

export function removeByokLocalKey(): void {
  localStorage.removeItem(BYOK_LOCAL_KEY);
}

export async function testByokKey(key: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Byok-Key": key,
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say OK" }],
      ai_mode: "byok_local",
    }),
  });

  if (!res.ok) {
    const data = await res.json() as { error?: string };
    throw new Error(data.error ?? "接続テストに失敗しました");
  }
}
