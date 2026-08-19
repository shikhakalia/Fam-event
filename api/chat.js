// This runs on the SERVER (Vercel), never in the browser — that's the whole point.
// The API key lives here, in an environment variable, and is never sent to visitors.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project's Settings → Environment Variables." });
    return;
  }

  const { message, context } = req.body || {};
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Missing 'message' in request body." });
    return;
  }

  const systemPrompt = `You are a friendly assistant inside "FamEvent", a family event-planning app.
Answer briefly and warmly (2-4 sentences unless asked for more detail).
You can see a snapshot of the user's current data below — use it to give specific, personalized answers
about their family, events, guests, budget, and travel plans. If something isn't in the data, say so
rather than guessing.

Current data snapshot (JSON):
${JSON.stringify(context || {}, null, 2)}`;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data });
      return;
    }

    const reply = data?.content?.[0]?.text || "Sorry, I couldn't come up with a response.";
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
