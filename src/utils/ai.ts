const API_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

type AnthropicContentBlock = { type: string; text?: string };

export class AiError extends Error {
  constructor(message: string, public status?: number, public details?: unknown) {
    super(message);
    this.name = "AiError";
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new AiError("リクエストがタイムアウトしました。もう一度お試しください。");
    }
    throw e;
  } finally {
    clearTimeout(timerId);
  }
}

export async function callAnthropic(prompt: string, maxTokens = 1000): Promise<string> {
  const body = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  };

  let lastError: AiError = new AiError("ネットワークエラーが発生しました。接続を確認してください。");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout("/api/anthropic/v1/messages", init, API_TIMEOUT_MS);
      const data = await res.json() as { error?: string; details?: unknown; content?: AnthropicContentBlock[] };

      if (!res.ok) {
        throw new AiError(
          typeof data.error === "string" ? data.error : "AI通信エラーが発生しました",
          res.status,
          data.details,
        );
      }

      const text = data.content?.map(b => b.text ?? "").join("") ?? "";
      return text;
    } catch (e) {
      if (e instanceof AiError) {
        // Don't retry on API-level errors (4xx) — only on network failures / timeout
        if (e.status !== undefined) throw e;
        lastError = e;
      } else {
        lastError = new AiError("ネットワークエラーが発生しました。接続を確認してください。");
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
