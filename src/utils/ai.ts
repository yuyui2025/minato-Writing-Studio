export class AiError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = "AiError";
  }
}

export async function callAnthropic(prompt: string, maxTokens = 1000): Promise<string> {
  try {
    const res = await fetch("/api/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new AiError(data.error || "AI通信エラーが発生しました", res.status, data.details);
    }

    const text = data.content?.map((b: any) => b.text || "").join("") || "";
    return text;
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError("ネットワークエラーが発生しました。接続を確認してください。");
  }
}
