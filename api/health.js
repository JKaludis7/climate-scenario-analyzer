export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ status: "FAIL", error: "No ANTHROPIC_API_KEY set", fix: "Add it in Vercel > Settings > Environment Variables" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 50, messages: [{ role: "user", content: "Say ok" }] }),
    });
    if (r.status === 200) return res.status(200).json({ status: "PASS", message: "API working!", keyPrefix: apiKey.substring(0, 7) + "..." });
    return res.status(200).json({ status: "FAIL", error: "API returned " + r.status, body: (await r.text()).substring(0, 300) });
  } catch (e) { return res.status(200).json({ status: "FAIL", error: e.message }); }
}
