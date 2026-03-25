import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const SYS = "You are an expert English tutor for Indonesian learners preparing for IELTS Band 7+. Follow a clear Form-Meaning-Use teaching style. Return ONLY valid JSON with no markdown.";

const GRAMMAR_TOPICS = [
  { id: "articles", label: "Articles", sub: "a, an, the and zero article" },
  { id: "present_perfect", label: "Present Perfect", sub: "have/has + past participle" },
  { id: "passive_voice", label: "Passive Voice", sub: "be + past participle" },
];

const VOCAB_CATS = [
  { id: "ielts_academic", label: "IELTS Academic", desc: "formal academic vocabulary" },
  { id: "daily_convo", label: "Daily Conversation", desc: "natural everyday English" },
  { id: "tech_ai", label: "Tech and AI", desc: "technology vocabulary" },
];

const READING_SEEDS = [
  { topic: "Artificial Intelligence and Education", diff: "intermediate" },
  { topic: "Remote Work and Productivity", diff: "beginner" },
  { topic: "Climate Change and Urban Planning", diff: "advanced" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function askGemini(prompt, max = 1800) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYS}\n\n${prompt}` }] }],
        generationConfig: { maxOutputTokens: max, temperature: 0.7 },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini API error");
  return data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";
}

async function askOpenRouter(prompt, max = 1800) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: `${SYS}\n\n${prompt}` }],
      max_tokens: max,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenRouter API error");
  return data?.choices?.[0]?.message?.content || "";
}

async function ask(prompt, max = 1800) {
  const failures = [];

  try {
    const text = await askGemini(prompt, max);
    if (text?.trim()) return text;
    failures.push("gemini: empty response");
  } catch (error) {
    failures.push(`gemini: ${error.message}`);
  }

  try {
    const text = await askOpenRouter(prompt, max);
    if (text?.trim()) return text;
    failures.push("openrouter: empty response");
  } catch (error) {
    failures.push(`openrouter: ${error.message}`);
  }

  throw new Error(failures.join(" | "));
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
  } catch {
    return null;
  }
}

function save(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`Saved: ${path}`);
}

async function generateGrammar(topic) {
  const raw = await ask(`Create a grammar lesson on ${topic.label} (${topic.sub}). Return JSON with keys grammarChart, explanation, keyRules, azarNotes, examples, commonMistakes, ieltsTip, quiz. Provide exactly 5 quiz questions.`);
  return parseJSON(raw);
}

async function generateVocab(cat) {
  const raw = await ask(`Generate 8 useful B2/C1 words for ${cat.label} (${cat.desc}). Return JSON with one key called words. Each word object must include word, pronunciation, partOfSpeech, definition, indonesian, level, ieltsBand, example, collocations, synonyms.`);
  return parseJSON(raw);
}

async function generateReading(seed) {
  const raw = await ask(`Create one IELTS reading passage on ${seed.topic} at ${seed.diff} difficulty. Return JSON with title, topic, difficulty, passage, vocabulary, questions, ieltsTips. Provide exactly 5 questions.`);
  return parseJSON(raw, 2200);
}

async function main() {
  const errors = [];
  let savedCount = 0;

  for (const topic of GRAMMAR_TOPICS) {
    try {
      const data = await generateGrammar(topic);
      if (data) {
        save(join(ROOT, "public", "data", "grammar", `${topic.id}.json`), data);
        savedCount += 1;
      } else {
        errors.push(`grammar:${topic.id}: invalid JSON`);
      }
      await sleep(1000);
    } catch (error) {
      errors.push(`grammar:${topic.id}: ${error.message}`);
    }
  }

  for (const cat of VOCAB_CATS) {
    try {
      const data = await generateVocab(cat);
      if (data) {
        save(join(ROOT, "public", "data", "vocab", `${cat.id}.json`), data);
        savedCount += 1;
      } else {
        errors.push(`vocab:${cat.id}: invalid JSON`);
      }
      await sleep(1000);
    } catch (error) {
      errors.push(`vocab:${cat.id}: ${error.message}`);
    }
  }

  const passages = [];
  for (const seed of READING_SEEDS) {
    try {
      const data = await generateReading(seed);
      if (data) passages.push(data);
      else errors.push(`reading:${seed.topic}: invalid JSON`);
      await sleep(1000);
    } catch (error) {
      errors.push(`reading:${seed.topic}: ${error.message}`);
    }
  }

  if (passages.length > 0) {
    save(join(ROOT, "public", "data", "reading", "passages.json"), passages);
    savedCount += 1;
  }

  save(join(ROOT, "public", "data", "manifest.json"), {
    generatedAt: new Date().toISOString(),
    savedCount,
    errors,
    providers: {
      gemini: Boolean(GEMINI_API_KEY),
      openrouter: Boolean(OPENROUTER_API_KEY),
    },
  });

  if (savedCount === 0) {
    console.error("No content was generated successfully.");
    process.exit(1);
  }

  if (errors.length > 0) {
    console.warn("Partial generation completed with errors:");
    console.warn(errors.join("\n"));
  } else {
    console.log("Content generation completed successfully.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
