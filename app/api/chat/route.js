import { NextResponse } from "next/server";

const MAX_PROMPT_CHARS = 8000;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function toUserSafeError(error, fallback = "Provider request failed") {
  if (error?.name === "AbortError") return `${fallback}: request timed out`;
  return error?.message || fallback;
}

async function callGemini(prompt, max) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: max, temperature: 0.7 }
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Gemini API error");
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";
  if (!text.trim()) throw new Error("Gemini returned empty text");
  return text.trim();
}

async function callOpenRouter(prompt, max) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: max,
      temperature: 0.7
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "OpenRouter API error");
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new Error("OpenRouter returned empty text");
  return text.trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const max = clamp(Number(body?.max || 800), 100, 1200);

    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    if (prompt.length > MAX_PROMPT_CHARS) {
      return NextResponse.json({ error: `Prompt exceeds ${MAX_PROMPT_CHARS} characters` }, { status: 400 });
    }

    const failures = [];
    for (const provider of [
      { name: "gemini", call: () => callGemini(prompt, max) },
      { name: "openrouter", call: () => callOpenRouter(prompt, max) }
    ]) {
      try {
        const text = await provider.call();
        return NextResponse.json({ text, provider: provider.name });
      } catch (error) {
        failures.push(`${provider.name}: ${toUserSafeError(error)}`);
      }
    }

    return NextResponse.json({ error: "All AI providers failed", details: failures }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
