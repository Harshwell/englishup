import { NextResponse } from "next/server";

const SCORE_KEYS = ["cohesion", "syntax", "vocabulary", "grammar", "conventions"];
const MAX_TEXT_CHARS = 15000;

async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackEvaluation(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return {
    provider: "fallback",
    scores: {
      cohesion: words > 80 ? 3 : 2,
      syntax: words > 60 ? 3 : 2,
      vocabulary: words > 80 ? 3 : 2,
      grammar: 2,
      conventions: 2
    },
    recommendations: [
      "Tambahkan linking devices yang lebih jelas antar kalimat.",
      "Variasikan struktur kalimat; jangan semuanya pendek dan datar.",
      "Periksa article, tense, dan punctuation secara manual.",
      "Ambil satu lesson grammar dan satu flashcard deck yang sesuai levelmu."
    ]
  };
}

function extractJsonObject(raw) {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return cleaned;
  return cleaned.slice(start, end + 1);
}

function normalizeEvaluation(result) {
  const scores = Object.fromEntries(
    SCORE_KEYS.map((key) => {
      const rawValue = Number(result?.scores?.[key]);
      const value = Number.isFinite(rawValue) ? Math.min(5, Math.max(1, Math.round(rawValue))) : 2;
      return [key, value];
    })
  );

  const recommendations = Array.isArray(result?.recommendations)
    ? result.recommendations.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
    : [];

  while (recommendations.length < 4) {
    recommendations.push("Lakukan satu revisi terfokus lalu cek lagi dengan rubric yang sama.");
  }

  return { scores, recommendations };
}

async function evaluateWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const prompt = `Evaluate this English learner text using an ELLIPSE-style rubric. Return only JSON with keys scores and recommendations. scores must include cohesion, syntax, vocabulary, grammar, conventions with values 1-5. recommendations must be an array of 4 concise Indonesian action items.\n\nText:\n${text}`;

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.2 }
      })
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Gemini API error");

  const raw = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";
  const parsed = JSON.parse(extractJsonObject(raw));
  return normalizeEvaluation(parsed);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();

    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });
    if (text.length > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: `Text exceeds ${MAX_TEXT_CHARS} characters` }, { status: 400 });
    }

    try {
      const result = await evaluateWithGemini(text);
      return NextResponse.json({ provider: "gemini", ...result });
    } catch {
      return NextResponse.json(fallbackEvaluation(text));
    }
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
