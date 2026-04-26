import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateGrammarFromBase, generateGrammarLesson, generateReadingSet, generateVocabularySet } from "../../../lib/content-generation";
import { getFallbackVocab } from "../../../lib/fallback-content";
import { getTrustedArticles, lookupDictionary } from "../../../lib/api-library";

const CONTENT_ROOT = path.join(process.cwd(), "public", "data");
const CONTENT_CACHE = new Map();

async function fetchWithTimeout(url, options = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonObject(raw = "") {
  const cleaned = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return cleaned.slice(start, end + 1);
}

async function generateAiJson(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  try {
    if (geminiKey) {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
      const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 900 }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "gemini_failed");
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";
      const jsonText = extractJsonObject(text);
      if (!jsonText) return null;
      return JSON.parse(jsonText);
    }
  } catch {}

  try {
    if (openrouterKey) {
      const model = process.env.OPENROUTER_MODEL || "openrouter/free";
      const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          max_tokens: 900,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "openrouter_failed");
      const text = data?.choices?.[0]?.message?.content || "";
      const jsonText = extractJsonObject(text);
      if (!jsonText) return null;
      return JSON.parse(jsonText);
    }
  } catch {}

  return null;
}

function normalizeQuizItem(item, index = 0) {
  const options = Array.isArray(item?.options)
    ? item.options.map((opt) => {
      if (typeof opt === "string") return opt;
      if (opt && typeof opt === "object") return String(opt.text || opt.label || opt.value || "Option");
      return String(opt || "Option");
    })
    : [];
  const answer = Number(item?.answer);
  return {
    question: String(item?.question || `Extra question ${index + 1}`),
    options: options.length >= 2 ? options.slice(0, 4) : ["Option A", "Option B", "Option C", "Option D"],
    answer: Number.isInteger(answer) && answer >= 0 && answer <= 3 ? answer : 0,
    explanation: String(item?.explanation || "Review the structure and choose the most accurate form.")
  };
}

function hashSeed(input = "") {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, seedKey = "") {
  const out = [...list];
  const rand = mulberry32(hashSeed(seedKey));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function fillTemplate(text = "", params = {}) {
  return String(text).replace(/\{(\w+)\}/g, (_, key) => String(params[key] || ""));
}

function buildGrammarTemplateBank(topicId, seed, references = [], lexicalItems = [], templateConfig = null) {
  const topicName = topicId.replace(/_/g, " ");
  const refHint = references[0]?.title || "an academic source";
  const lexical = lexicalItems[0]?.word || "evidence";
  const stems = Array.isArray(templateConfig?.stems) && templateConfig.stems.length
    ? templateConfig.stems
    : [
      "Choose the best sentence for IELTS writing about {topic}.",
      "Which sentence is most natural when citing {reference}?",
      "Pick the sentence with better {topic} accuracy."
    ];
  const subjects = Array.isArray(templateConfig?.subjects) && templateConfig.subjects.length
    ? templateConfig.subjects
    : ["The essay", "This paragraph", "The argument", "The analysis", "The report", "The conclusion"];

  const bank = subjects.map((subject, idx) => ({
    question: fillTemplate(stems[idx % stems.length], { topic: topicName, reference: refHint, lexical }),
    options: [
      `${subject} discuss ${topicName} with clear ${lexical}.`,
      `${subject} discusses ${topicName} with clear ${lexical}.`,
      `${subject} discussing ${topicName} with clear ${lexical}.`,
      `${subject} discussed ${topicName} with clear ${lexical} every time.`
    ],
    answer: 1,
    explanation: "Singular subject takes singular finite verb in formal sentence framing."
  }));

  const patternBank = (Array.isArray(templateConfig?.patterns) ? templateConfig.patterns : []).map((item) => ({
    ...item,
    question: fillTemplate(item.question, { topic: topicName, reference: refHint, lexical }),
    options: Array.isArray(item.options) ? item.options.map((opt) => fillTemplate(opt, { topic: topicName, reference: refHint, lexical })) : []
  }));

  return shuffle([...bank, ...patternBank, ...bank, ...patternBank], `grammar-template-${topicId}-${seed}`);
}

function getCachedContent(key) {
  const item = CONTENT_CACHE.get(key);
  if (!item) return null;
  if (Date.now() > item.expireAt) {
    CONTENT_CACHE.delete(key);
    return null;
  }
  return item.value;
}

function setCachedContent(key, value, ttlMs = 1000 * 60 * 60 * 6) {
  CONTENT_CACHE.set(key, { value, expireAt: Date.now() + ttlMs });
  return value;
}

function buildReadingTemplateTips(topic = "", difficulty = "intermediate", refs = []) {
  const source = refs[0]?.title || "trusted source";
  return [
    `Mulai dari keyword scanning, lalu validasi makna kalimat penuh untuk topik ${topic || "reading"}.`,
    `Untuk level ${difficulty}, prioritaskan eliminasi opsi yang grammar/logikanya tidak konsisten.`,
    `Cross-check claim penting dengan referensi seperti ${source} untuk melatih evaluasi argumen.`
  ];
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonObject(raw = "") {
  const cleaned = String(raw).replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return cleaned.slice(start, end + 1);
}

async function generateAiJson(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  try {
    if (geminiKey) {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
      const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 900 }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "gemini_failed");
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";
      const jsonText = extractJsonObject(text);
      if (!jsonText) return null;
      return JSON.parse(jsonText);
    }
  } catch {}

  try {
    if (openrouterKey) {
      const model = process.env.OPENROUTER_MODEL || "openrouter/free";
      const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          max_tokens: 900,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "openrouter_failed");
      const text = data?.choices?.[0]?.message?.content || "";
      const jsonText = extractJsonObject(text);
      if (!jsonText) return null;
      return JSON.parse(jsonText);
    }
  } catch {}

  return null;
}

function normalizeQuizItem(item, index = 0) {
  const options = Array.isArray(item?.options)
    ? item.options.map((opt) => {
      if (typeof opt === "string") return opt;
      if (opt && typeof opt === "object") return String(opt.text || opt.label || opt.value || "Option");
      return String(opt || "Option");
    })
    : [];
  const answer = Number(item?.answer);
  return {
    question: String(item?.question || `Extra question ${index + 1}`),
    options: options.length >= 2 ? options.slice(0, 4) : ["Option A", "Option B", "Option C", "Option D"],
    answer: Number.isInteger(answer) && answer >= 0 && answer <= 3 ? answer : 0,
    explanation: String(item?.explanation || "Review the structure and choose the most accurate form.")
  };
}

async function readJson(relativePath) {
  try {
    const fullPath = path.join(CONTENT_ROOT, relativePath);
    const raw = await fs.readFile(fullPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const type = String(body?.type || "").toLowerCase();
    const seed = String(body?.seed || Date.now());

    if (type === "reading") {
      const difficulty = String(body?.difficulty || "intermediate");
      const size = Math.min(3, Math.max(1, Number(body?.size || 1)));
      const passages = (await readJson("reading/passages.json")) || [];
      const payload = generateReadingSet({ passages, difficulty, size, seed });

      const enriched = await Promise.all(
        payload.map(async (item) => {
          const refs = await getTrustedArticles(item?.topic || item?.title || "education", 3);
          return {
            ...item,
            generatedMeta: {
              ...(item.generatedMeta || {}),
              references: refs.map((ref) => ({
                label: `${ref.source} — ${ref.title}`,
                url: ref.url
              }))
            }
          };
        })
      );

      const aiVariants = await generateAiJson(
        `Return JSON only with key "tips" as array of 3 concise IELTS reading tips in Indonesian. Context: difficulty=${difficulty}, seed=${seed}.`
      );
      const templateTips = buildReadingTemplateTips(enriched?.[0]?.topic || "", difficulty, enriched?.[0]?.generatedMeta?.references || []);
      const aiTips = Array.isArray(aiVariants?.tips) ? aiVariants.tips.slice(0, 3).map((item) => String(item || "")) : [];
      const mergedTips = [...templateTips, ...aiTips].filter(Boolean).filter((item, idx, arr) => arr.indexOf(item) === idx).slice(0, 6);

      return NextResponse.json({ items: enriched, aiTips: mergedTips });
    }

    if (type === "vocab") {
      const category = String(body?.category || "ielts_academic");
      const count = Math.min(20, Math.max(5, Number(body?.count || 10)));
      const vocab = (await readJson(`vocab/${category}.json`)) || getFallbackVocab(category);
      const payload = generateVocabularySet({ vocab, category, count, seed });

      const enriched = await Promise.all(
        payload.map(async (item, idx) => {
          if (idx > 5) return item;
          const dict = await lookupDictionary(item.front);
          return {
            ...item,
            back: {
              ...item.back,
              definition: dict.definition || item.back.definition,
              phonetic: dict.phonetic || item.back.phonetic,
              example: dict.example || item.back.example,
              synonyms: dict.synonyms?.length ? dict.synonyms : item.back.synonyms
            }
          };
        })
      );

      const aiExamples = await generateAiJson(
        `Return JSON only with key "examples" as object map word->example sentence for these words: ${payload.slice(0, 6).map((x) => x.front).join(", ")}. Make each example unique and IELTS-friendly. seed=${seed}.`
      );
      const exampleMap = aiExamples?.examples && typeof aiExamples.examples === "object" ? aiExamples.examples : {};
      const withAiExamples = enriched.map((item) => ({
        ...item,
        back: {
          ...item.back,
          example: exampleMap[item.front] || item.back.example
        }
      }));

      return NextResponse.json({ items: withAiExamples });
    }

    if (type === "grammar") {
      const topicId = String(body?.topicId || "articles");
      const staticData = await readJson(`grammar/${topicId}.json`);
      const payload = staticData
        ? generateGrammarFromBase({ base: staticData, topicId, seed })
        : generateGrammarLesson({ topicId, seed });

      const refs = await getTrustedArticles(topicId.replace(/_/g, " "), 2);
      const grammarTemplateConfig = getCachedContent("grammar-template-config")
        || setCachedContent("grammar-template-config", (await readJson("generated/grammar_bank.json")) || {}, 1000 * 60 * 60 * 24);
      const lexicalItems = await Promise.all(
        topicId.replace(/_/g, " ").split(/\s+/).slice(0, 2).map((word) => lookupDictionary(word))
      );

      const aiGrammar = await generateAiJson(
        `Return JSON only with key "extraQuiz" as array (max 2) of multiple-choice grammar questions for topic "${topicId}". Each item: question, options (4), answer (0-3), explanation. seed=${seed}.`
      );
      const templateBank = getCachedContent(`grammar-bank:${topicId}`)
        || setCachedContent(`grammar-bank:${topicId}`, buildGrammarTemplateBank(topicId, "bank", refs, lexicalItems, grammarTemplateConfig));
      const baseQuiz = Array.isArray(payload.quiz) ? payload.quiz.map((item, idx) => normalizeQuizItem(item, idx)) : [];
      const aiQuiz = (Array.isArray(aiGrammar?.extraQuiz) ? aiGrammar.extraQuiz : []).slice(0, 3).map((item, idx) => normalizeQuizItem(item, idx));
      const mergedQuiz = shuffle(
        [...baseQuiz, ...templateBank.map((item, idx) => normalizeQuizItem(item, idx)), ...aiQuiz],
        `grammar-merged-${topicId}-${seed}`
      )
        .filter((item, idx, arr) => arr.findIndex((x) => x.question === item.question) === idx)
        .slice(0, 14);

      const aiGrammar = await generateAiJson(
        `Return JSON only with key "extraQuiz" as array (max 2) of multiple-choice grammar questions for topic "${topicId}". Each item: question, options (4), answer (0-3), explanation. seed=${seed}.`
      );

      return NextResponse.json({
        ...payload,
        quiz: mergedQuiz,
        generatedMeta: {
          ...(payload.generatedMeta || {}),
          references: refs.map((ref) => ({ label: `${ref.source} — ${ref.title}`, url: ref.url }))
        }
      });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
