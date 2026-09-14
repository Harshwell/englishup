import { z } from "zod";
import {
  getFallbackGrammar,
  getFallbackVocab,
  getFallbackReadingPool,
} from "./fallback-content.js";

export const TOPICS = [
  {
    id: "articles",
    title: "Articles",
    detail: "Pilihan kecil. Makna yang tepat.",
    form: "a, an, the & zero article",
  },
  {
    id: "present_perfect",
    title: "Present perfect",
    detail: "Hubungkan pengalaman dengan sekarang.",
    form: "have / has + past participle",
  },
  {
    id: "passive_voice",
    title: "Passive voice",
    detail: "Geser fokus dari pelaku ke tindakan.",
    form: "be + past participle",
  },
  {
    id: "conditionals",
    title: "Conditionals",
    detail: "Bicarakan kemungkinan dan konsekuensi.",
    form: "zero, first, second & third",
  },
  {
    id: "relative_clauses",
    title: "Relative clauses",
    detail: "Tambahkan detail tanpa kehilangan arah.",
    form: "who, which, that & where",
  },
  {
    id: "modal_verbs",
    title: "Modal verbs",
    detail: "Sampaikan kepastian, saran, dan kewajiban.",
    form: "can, could, must & should",
  },
  {
    id: "reported_speech",
    title: "Reported speech",
    detail: "Ceritakan kembali dengan akurat.",
    form: "statements & tense changes",
  },
  {
    id: "gerunds_inf",
    title: "Gerunds & infinitives",
    detail: "Pilih bentuk kata kerja yang natural.",
    form: "doing vs. to do",
  },
];
export const CATEGORIES = [
  {
    id: "ielts_academic",
    title: "Academic English",
    detail: "Argumen, riset, dan diskusi akademik",
    mark: "Aa",
  },
  {
    id: "daily_convo",
    title: "Everyday English",
    detail: "Percakapan yang terasa natural",
    mark: "Hi",
  },
  {
    id: "business",
    title: "At work",
    detail: "Rapat, keputusan, dan komunikasi kerja",
    mark: "09",
  },
  {
    id: "environment",
    title: "Our environment",
    detail: "Iklim, energi, dan keberlanjutan",
    mark: "O₂",
  },
  {
    id: "tech_ai",
    title: "Technology",
    detail: "Ide dan perubahan di dunia digital",
    mark: "</>",
  },
  {
    id: "social_issues",
    title: "Society",
    detail: "Kebijakan dan persoalan sosial",
    mark: "We",
  },
];
const questionSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string()),
    answer: z.union([z.number().int().nonnegative(), z.string().min(1)]),
    explanation: z.string(),
  })
  .refine((q) =>
    q.options.length
      ? typeof q.answer === "number" && q.answer < q.options.length
      : typeof q.answer === "string",
  );
const text = (value) => (typeof value === "string" ? value : "");
export function normalizeQuestions(items) {
  const expanded = (items || []).flatMap((q) =>
    q.type === "matching_features"
      ? (q.features || []).map((f, i) => ({
          question: `${q.question} ${f.description}`,
          options: q.features.map((x) => x.feature),
          answer: i,
          explanation: q.passage_references?.[i] || f.description,
        }))
      : [q],
  );
  return z
    .array(questionSchema)
    .min(1)
    .parse(
      expanded.map((q, qi) => {
        let options =
          q.options ||
          (q.type?.includes("true_false")
            ? ["True", "False", "Not Given"]
            : []);
        let expected = q.correct_answer ?? q.answer;
        if (!options.length)
          return {
            question: q.question,
            options: [],
            answer: text(expected),
            explanation:
              text(q.explanation) ||
              text(q.evidence) ||
              `Jawaban acuan: ${expected}. Jawaban singkat dicocokkan dengan frasa acuan; variasi lain mungkin perlu review mandiri.`,
          };
        if (Array.isArray(expected)) {
          const parts = expected;
          options = options.map((_, shift) =>
            parts
              .map(
                (part) =>
                  q.options[
                    (q.options.indexOf(part) + shift) % q.options.length
                  ],
              )
              .join(" / "),
          );
          expected = parts.join(" / ");
          options = [
            ...options.slice(qi % options.length),
            ...options.slice(0, qi % options.length),
          ];
        }
        const matched = options.findIndex(
          (o) => o.toLowerCase() === String(expected).toLowerCase(),
        );
        const answer =
          typeof expected === "number"
            ? expected
            : matched >= 0
              ? matched
              : /^[A-D]$/.test(expected)
                ? expected.charCodeAt(0) - 65
                : -1;
        return {
          question: q.question,
          options,
          answer,
          explanation:
            text(q.explanation) ||
            text(q.evidence) ||
            `Jawaban: ${options[answer] || expected}`,
        };
      }),
    );
}
export function isCorrectAnswer(question, answer) {
  if (typeof question.answer === "number") return answer === question.answer;
  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[.!?]+$/, "")
      .replace(/\s+/g, " ")
      .replace(/^(a|an|the) /, "");
  return question.answer
    .split(" / ")
    .some((expected) => normalize(answer) === normalize(expected));
}
const grammarSchema = z.object({
  explanation: z.string().min(1),
  keyRules: z.array(z.string()),
  examples: z.array(z.object({ sentence: z.string(), note: z.string() })),
  quiz: z.array(questionSchema).min(1),
  notes: z.array(z.string()),
  mistakes: z.array(
    z.object({ wrong: z.string(), right: z.string(), why: z.string() }),
  ),
  tip: z.string(),
  chart: z.array(
    z.object({
      title: z.string(),
      form: z.string(),
      meaning: z.string(),
      use: z.string(),
    }),
  ),
});
function grammar(raw) {
  const chart = Array.isArray(raw.grammarChart)
    ? raw.grammarChart
    : raw.grammarChart?.sections || [];
  return grammarSchema.parse({
    explanation: raw.explanation,
    keyRules: raw.keyRules || [],
    examples: (raw.examples || []).map((e) => ({
      sentence: text(e.sentence) || text(e.passive),
      note:
        text(e.explanation) ||
        text(e.note) ||
        text(e.indonesian) ||
        (e.active ? `Active: ${e.active}` : ""),
    })),
    quiz: normalizeQuestions(raw.quiz),
    notes: (Array.isArray(raw.azarNotes)
      ? raw.azarNotes
      : [raw.azarNotes]
    ).filter((n) => typeof n === "string"),
    mistakes: (raw.commonMistakes || []).map((m) =>
      typeof m === "string"
        ? { wrong: "", right: "", why: m }
        : {
            wrong: text(m.wrong),
            right: text(m.right) || text(m.correct),
            why: text(m.why) || text(m.explanation),
          },
    ),
    tip: text(raw.ieltsTip),
    chart: chart.map((c) => ({
      title: text(c.article) || text(c.tense),
      form: text(c.form),
      meaning: text(c.meaning),
      use: Array.isArray(c.use) ? c.use.join(" ") : text(c.use),
    })),
  });
}
const wordSchema = z.object({
  word: z.string().min(1),
  definition: z.string().min(1),
  example: z.string(),
  pronunciation: z.string().default(""),
  indonesian: z.string().default(""),
  level: z.string().default(""),
  synonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
});
const readingSchema = z
  .array(
    z.object({
      title: z.string(),
      topic: z.string().default(""),
      passage: z.string().min(80),
      difficulty: z.string(),
      questions: z.array(questionSchema).min(1),
      vocabulary: z
        .array(z.object({ word: z.string(), meaning: z.string() }))
        .default([]),
    }),
  )
  .min(1);
export async function getStudyContent(kind, id, signal) {
  const path =
    kind === "grammar"
      ? `/data/grammar/${id}.json`
      : kind === "vocabulary"
        ? `/data/vocab/${id}.json`
        : "/data/reading/passages.json";
  const parse = (raw) =>
    kind === "grammar"
      ? grammar(raw)
      : kind === "vocabulary"
        ? z.array(wordSchema).min(1).parse(raw.words)
        : readingSchema.parse(
            raw.map((p) => ({
              ...p,
              vocabulary: (p.vocabulary || []).map((v) => ({
                word: v.word,
                meaning: v.meaning || v.definition,
              })),
              questions: normalizeQuestions(p.questions),
            })),
          );
  if (
    kind === "grammar" &&
    !["articles", "present_perfect", "passive_voice"].includes(id)
  ) {
    return { data: parse(getFallbackGrammar(id)), source: "fallback" };
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, 5000);
  try {
    const response = await fetch(path, { signal: controller.signal });
    if (!response.ok) throw new Error("content_unavailable");
    return { data: parse(await response.json()), source: "static" };
  } catch (error) {
    if (signal?.aborted) throw error;
    const raw =
      kind === "grammar"
        ? getFallbackGrammar(id)
        : kind === "vocabulary"
          ? getFallbackVocab(id)
          : getFallbackReadingPool();
    return { data: parse(raw), source: "fallback" };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
export const chatResponseSchema = z.object({
  text: z.string().min(1),
  provider: z.string(),
  fallbackReason: z.string().optional(),
});
export const writingResponseSchema = z.object({
  provider: z.string(),
  recommendations: z.array(z.string()).min(1),
  scores: z.record(z.string(), z.number().min(1).max(5)),
  fallbackReason: z.string().optional(),
});
export async function postPractice(url, body, schema) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("request_failed");
    return schema.parse(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
export async function privateActivityKey(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value.trim().toLowerCase()),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
