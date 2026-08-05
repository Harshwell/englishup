import { NextResponse } from "next/server";
import { callGeminiGateway } from "../../../lib/ai/gemini-gateway";

const MAX_PROMPT_CHARS = 8000;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function conversationFallback(prompt = "") {
  const text = String(prompt || "").split("Conversation:").pop()?.trim() || "your message";
  const lastStudentLine = text.split("\n").reverse().find((line) => line.toLowerCase().startsWith("student:")) || "";
  const learnerText = lastStudentLine.replace(/^student:\s*/i, "").trim();
  const priority = /\b(is|are|was|were)\b/i.test(learnerText)
    ? "Cek subject-verb agreement dan tense marker di kalimatmu."
    : "Fokus ke satu ide utama, lalu pakai kalimat pendek yang akurat sebelum membuat struktur kompleks.";

  return `Fallback practice mode: aku belum bisa memakai AI saat ini, tapi latihan tetap jalan.\n\nPriority correction: ${priority}\n\nTry again with one improved sentence, then add one detail or example.`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const max = clamp(Number(body?.max || 800), 100, 1200);
    const promptVersion = String(body?.promptVersion || "conversation-v2");

    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    if (prompt.length > MAX_PROMPT_CHARS) {
      return NextResponse.json({ error: `Prompt exceeds ${MAX_PROMPT_CHARS} characters` }, { status: 400 });
    }

    const fallbackText = conversationFallback(prompt);
    const result = await callGeminiGateway({
      prompt,
      maxOutputTokens: max,
      temperature: 0.7,
      promptVersion,
      endpoint: "chat.conversation",
      fallbackData: fallbackText,
    });

    return NextResponse.json({
      text: result.data,
      provider: result.ok ? "gemini" : "fallback",
      source: result.source,
      fallbackReason: result.failureReason,
      latencyMs: result.latencyMs,
      cacheKey: result.cacheKey,
      promptVersion: result.promptVersion,
      tokenUsage: result.tokenUsage,
    }, { status: result.ok ? 200 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
