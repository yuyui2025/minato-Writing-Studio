const ALLOWED_MODELS = ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"];
const MAX_TOKENS_LIMIT = 2000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { model, max_tokens, messages } = req.body ?? {};

  if (!model || !ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }
  if (typeof max_tokens !== "number" || max_tokens < 1 || max_tokens > MAX_TOKENS_LIMIT) {
    return res.status(400).json({ error: "Invalid max_tokens" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
