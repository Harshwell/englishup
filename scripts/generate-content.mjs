/**
 * EnglishUp — Content Generator
 * Generates static JSON for Grammar, Vocab, Reading.
 * Run via GitHub Actions weekly, or manually.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

if (!API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

const SYS = "You are an expert English tutor for an Indonesian English Lit graduate refreshing skills for IELTS Band 7+. Follow Betty S. Azar's framework (Form-Meaning-Use, Grammar Charts). Use 2024-2025 examples. Note Indonesian learner errors. Respond ONLY with valid JSON, no markdown, no extra text.";

async function ask(prompt, max = 2000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: max, system: SYS, messages: [{ role: "user", content: prompt }] }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error?.message || "API error");
  return d.content?.[0]?.text || "";
}

function parseJSON(s) {
  try { return JSON.parse(s.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); }
  catch { console.error("JSON parse failed:", s.slice(0, 200)); return null; }
}

function save(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("Saved:", filePath);
}

// ── GRAMMAR ──────────────────────────────────────────────────────────
const GRAMMAR_TOPICS = [
  { id: "articles",         label: "Articles",              sub: "a, an, the & zero article"    },
  { id: "present_perfect",  label: "Present Perfect",       sub: "have/has + past participle"   },
  { id: "passive_voice",    label: "Passive Voice",         sub: "is/was/has been + V3"         },
  { id: "conditionals",     label: "Conditionals",          sub: "0, 1st, 2nd, 3rd types"      },
  { id: "relative_clauses", label: "Relative Clauses",      sub: "who, which, that, where"      },
  { id: "modal_verbs",      label: "Modal Verbs",           sub: "can, could, must, should"     },
  { id: "reported_speech",  label: "Reported Speech",       sub: "He said that..."              },
  { id: "gerunds_inf",      label: "Gerunds & Infinitives", sub: "enjoy doing vs want to do"    },
];

async function generateGrammar(topic) {
  console.log("Generating grammar:", topic.label);
  const raw = await ask(`Create a grammar lesson on "${topic.label}" (${topic.sub}) following Azar's framework.
Return ONLY valid JSON:
{
  "grammarChart": "Azar-style chart. CAPS headers. | separator. AFFIRMATIVE | NEGATIVE | QUESTION rows with S+V pattern and one example each.",
  "explanation": "Form-Meaning-Use in 2-3 paragraphs. Contrast with Bahasa Indonesia.",
  "keyRules": ["rule 1","rule 2","rule 3","rule 4"],
  "azarNotes": ["margin note 1","note 2"],
  "examples": [{"sentence":"2024-25 context","note":"form/meaning/use annotation","indonesian":"terjemahan"}],
  "commonMistakes": [{"wrong":"Indonesian learner error","right":"correct","why":"root cause"}],
  "ieltsTip": "IELTS Writing/Speaking application with band tip and example.",
  "quiz": [{"question":"Azar exercise","type":"fill-blank","options":["A) ...","B) ...","C) ...","D) ..."],"answer":0,"explanation":"correction note"}]
}
Exactly 5 quiz questions. Vary types (fill-blank, error-correct, choose-form). Use 2024-25 contexts.`);
  return parseJSON(raw);
}

// ── VOCAB ─────────────────────────────────────────────────────────────
const VOCAB_CATS = [
  { id: "ielts_academic", label: "IELTS Academic",     desc: "Academic Word List (AWL)"   },
  { id: "daily_convo",    label: "Daily Conversation", desc: "Natural everyday English"    },
  { id: "tech_ai",        label: "Tech & AI",          desc: "Current digital vocabulary"  },
  { id: "environment",    label: "Environment",        desc: "Climate & sustainability"    },
  { id: "social_issues",  label: "Social Issues",      desc: "IELTS Writing Task 2 topics" },
  { id: "business",       label: "Business & Work",    desc: "Professional English"        },
];

async function generateVocab(cat) {
  console.log("Generating vocab:", cat.label);
  const raw = await ask(`Generate 8 B2/C1 vocabulary words for "${cat.label}" (${cat.desc}) for an Indonesian IELTS learner.
Return ONLY valid JSON:
{"words":[{"word":"","pronunciation":"IPA","partOfSpeech":"","definition":"clear English","indonesian":"natural Indonesian","level":"B2 or C1","ieltsBand":"e.g. 6.5-7.5","example":"2024-25 context","collocations":["col1","col2","col3"],"synonyms":["syn1","syn2"]}]}
8 distinct high-value IELTS words, varied B2-C1 difficulty.`, 1600);
  return parseJSON(raw);
}

// ── READING ───────────────────────────────────────────────────────────
const READING_SEEDS = [
  { topic: "Artificial Intelligence and Education",  diff: "intermediate" },
  { topic: "Climate Change and Urban Planning",      diff: "advanced"     },
  { topic: "Remote Work and Productivity",           diff: "beginner"     },
  { topic: "Social Media and Mental Health",         diff: "intermediate" },
  { topic: "Renewable Energy Transition",            diff: "advanced"     },
  { topic: "Digital Literacy in the 21st Century",  diff: "beginner"     },
  { topic: "Globalisation and Cultural Identity",   diff: "advanced"     },
  { topic: "Urban Food Security",                   diff: "intermediate" },
];

async function generateReading(seed) {
  console.log("Generating reading:", seed.topic);
  const wordCount = seed.diff === "beginner" ? "~250 words, Band 5-6" : seed.diff === "intermediate" ? "~300 words, Band 6-7" : "~350 words, Band 7-8";
  const raw = await ask(`Create an IELTS Academic Reading passage on "${seed.topic}" (${wordCount}).
Return ONLY valid JSON:
{
  "title": "",
  "topic": "${seed.topic}",
  "difficulty": "${seed.diff}",
  "passage": "Full IELTS Academic passage. Dense, well-argued, academic register, hedging language. 2024-25 factual context.",
  "vocabulary": [{"word":"","definition":"meaning in context","indonesian":""}],
  "questions": [{"question":"IELTS-style — mix multiple choice AND True/False/Not Given","options":["A) ...","B) ...","C) ...","D) ..."],"answer":0,"explanation":"cite passage"}],
  "ieltsTips": ["reading strategy","common trap to avoid"]
}
Exactly 5 questions. At least one True/False/Not Given.`, 2500);
  return parseJSON(raw);
}

// ── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  const errors = [];

  // Grammar
  for (const topic of GRAMMAR_TOPICS) {
    try {
      const data = await generateGrammar(topic);
      if (data) save(join(ROOT, "public", "data", "grammar", `${topic.id}.json`), data);
      await sleep(1500);
    } catch (e) { console.error(`Grammar ${topic.id} failed:`, e.message); errors.push(topic.id); }
  }

  // Vocab
  for (const cat of VOCAB_CATS) {
    try {
      const data = await generateVocab(cat);
      if (data) save(join(ROOT, "public", "data", "vocab", `${cat.id}.json`), data);
      await sleep(1500);
    } catch (e) { console.error(`Vocab ${cat.id} failed:`, e.message); errors.push(cat.id); }
  }

  // Reading
  const passages = [];
  for (const seed of READING_SEEDS) {
    try {
      const data = await generateReading(seed);
      if (data) passages.push(data);
      await sleep(1500);
    } catch (e) { console.error(`Reading "${seed.topic}" failed:`, e.message); errors.push(seed.topic); }
  }
  if (passages.length > 0) save(join(ROOT, "public", "data", "reading", "passages.json"), passages);

  if (errors.length > 0) { console.warn("Failed items:", errors); process.exit(1); }
  else console.log("All content generated successfully!");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
main().catch((e) => { console.error(e); process.exit(1); });
