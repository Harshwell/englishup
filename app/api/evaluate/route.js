import { NextResponse } from "next/server";
import { callGeminiGateway } from "../../../lib/ai/gemini-gateway";

const SCORE_KEYS = ["cohesion", "syntax", "vocabulary", "grammar", "conventions"];
const MAX_TEXT_CHARS = 15000;

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

  return { provider: "gemini", scores, recommendations };
}

function buildEvaluationPrompt(text) {
  return `Evaluate this English learner text using an IELTS-readiness learning rubric, not an official IELTS score. Return only JSON with keys scores and recommendations. scores must include cohesion, syntax, vocabulary, grammar, conventions with values 1-5. recommendations must be an array of 4 concise Indonesian action items.

Text:
${text}`;
}

async function evaluateWithGemini(text) {
  const result = await callGeminiGateway({
    prompt: buildEvaluationPrompt(text),
    maxOutputTokens: 800,
    temperature: 0.2,
    promptVersion: "writing-evaluation-v2",
    endpoint: "evaluate.writing",
    fallbackData: fallbackEvaluation(text),
    responseParser: (raw) => normalizeEvaluation(JSON.parse(extractJsonObject(raw))),
  });

  if (!result.ok) {
    return {
      provider: "fallback",
      source: result.source,
      fallbackReason: result.failureReason,
      latencyMs: result.latencyMs,
      cacheKey: result.cacheKey,
      promptVersion: result.promptVersion,
      ...result.data,
    };
  }

  return {
    provider: "gemini",
    source: result.source,
    latencyMs: result.latencyMs,
    cacheKey: result.cacheKey,
    promptVersion: result.promptVersion,
    tokenUsage: result.tokenUsage,
    ...result.data,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();

    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });
    if (text.length > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: `Text exceeds ${MAX_TEXT_CHARS} characters` }, { status: 400 });
    }

    const result = await evaluateWithGemini(text);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
