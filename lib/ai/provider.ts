/** LLM provider abstraction supporting Gemini and OpenAI. Returns null when no key / failure so callers use the deterministic fallback. */
export const hasLLM = () =>
  Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.OPENAI_API_KEY
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function llmJson(system: string, user: string): Promise<any | null> {
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${system}\n\n${user}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
          return JSON.parse(clean);
        }
      }
    } catch {
      // fallback to openai
    }
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      const j = await r.json();
      return JSON.parse(j.choices[0].message.content);
    } catch {
      return null;
    }
  }

  return null;
}

