export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured in Vercel environment variables." });

  try {
    const { system, userMessage } = req.body;
    if (!system || !userMessage) return res.status(400).json({ error: "Missing required fields" });

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          system,
          messages: [{ role: "user", content: userMessage }],
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        }),
      });

      if (response.status === 429) {
        if (attempt < maxRetries) {
          const wait = Math.min((response.headers.get("retry-after") || 2) * 1000 * Math.pow(2, attempt), 20000);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        return res.status(429).json({ error: "Rate limited. Please wait 60 seconds and try again." });
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
        return res.status(response.status).json({ error: errText.substring(0, 300) });
      }

      const data = await response.json();
      let text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      // Strip citation/XML tags
      text = text.replace(/<\/?antml:[^>]*>/g, "").replace(/<\/?cite[^>]*>/g, "").replace(/<[^>]*index="[^"]*"[^>]*>/g, "");
      return res.status(200).json({ text });
    }
    return res.status(500).json({ error: "Failed after retries" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
