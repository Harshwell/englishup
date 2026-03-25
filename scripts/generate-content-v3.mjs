import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const WORDS = [
  { word: "significant", level: "B2", topic: "ielts_academic" },
  { word: "allocate", level: "C1", topic: "ielts_academic" },
  { word: "enhance", level: "C1", topic: "ielts_academic" },
  { word: "reliable", level: "B2", topic: "daily_convo" },
  { word: "straightforward", level: "B2", topic: "daily_convo" },
  { word: "algorithm", level: "B2", topic: "tech_ai" },
  { word: "bias", level: "C1", topic: "tech_ai" },
  { word: "resilience", level: "C1", topic: "environment" },
  { word: "sustainable", level: "B2", topic: "environment" },
  { word: "inequality", level: "B2", topic: "social_issues" },
  { word: "workload", level: "B2", topic: "business" },
  { word: "delegate", level: "C1", topic: "business" }
];

const GRAMMAR = [
  { id: "articles", label: "Articles", sub: "a, an, the & zero article" },
  { id: "present_perfect", label: "Present Perfect", sub: "have/has + past participle" },
  { id: "passive_voice", label: "Passive Voice", sub: "be + past participle" }
];

const READING_TOPICS = [
  { topic: "Artificial Intelligence and Education", difficulty: "intermediate" },
  { topic: "Remote Work and Productivity", difficulty: "beginner" },
  { topic: "Cities and Climate Planning", difficulty: "advanced" }
];

function save(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Saved ${filePath}`);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

async function getDictionary(word) {
  try {
    const data = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const first = data?.[0];
    const meaning = first?.meanings?.[0];
    const definition = meaning?.definitions?.[0];
    const phonetic = first?.phonetic || first?.phonetics?.find((p) => p.text)?.text || "";
    const audio = first?.phonetics?.find((p) => p.audio)?.audio || "";
    return {
      definition: definition?.definition || `Useful English word: ${word}.`,
      example: definition?.example || `${word} is often used in formal and academic English.`,
      synonyms: Array.from(new Set([...(definition?.synonyms || []), ...(meaning?.synonyms || [])])).slice(0, 4),
      antonyms: Array.from(new Set([...(definition?.antonyms || []), ...(meaning?.antonyms || [])])).slice(0, 4),
      phonetic,
      audio,
      partOfSpeech: meaning?.partOfSpeech || "word"
    };
  } catch {
    return {
      definition: `Useful English word: ${word}.`,
      example: `${word} is often used in formal and academic English.`,
      synonyms: [],
      antonyms: [],
      phonetic: "",
      audio: "",
      partOfSpeech: "word"
    };
  }
}

async function getDatamuse(word) {
  try {
    const syn = await fetchJson(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=4`);
    const ant = await fetchJson(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=4`);
    const coll = await fetchJson(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=4`);
    return {
      synonyms: syn.map((x) => x.word),
      antonyms: ant.map((x) => x.word),
      collocations: coll.map((x) => x.word)
    };
  } catch {
    return { synonyms: [], antonyms: [], collocations: [] };
  }
}

async function askLLM(prompt, maxTokens = 1200) {
  if (GEMINI_API_KEY) {
    const data = await fetchJson(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 }
      })
    });
    return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  }
  if (OPENROUTER_API_KEY) {
    const data = await fetchJson("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      })
    });
    return data?.choices?.[0]?.message?.content || "";
  }
  return "";
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(String(text).replace(/```json/g, "").replace(/```/g, "").trim());
  } catch {
    return null;
  }
}

async function buildFlashcards() {
  const deck = [];
  for (const item of WORDS) {
    const dict = await getDictionary(item.word);
    const dm = await getDatamuse(item.word);
    deck.push({
      front: item.word,
      back: {
        definition: dict.definition,
        phonetic: dict.phonetic,
        example: dict.example,
        synonyms: Array.from(new Set([...dict.synonyms, ...dm.synonyms])).slice(0, 4),
        antonyms: Array.from(new Set([...dict.antonyms, ...dm.antonyms])).slice(0, 4),
        level: item.level,
        frequency: item.level === "B2" ? "high" : "medium",
        audio: dict.audio
      },
      topic: item.topic
    });
  }
  const b2 = deck.filter((x) => x.back.level === "B2");
  const c1 = deck.filter((x) => x.back.level === "C1");
  save(join(ROOT, "public", "data", "flashcards", "b2.json"), b2);
  save(join(ROOT, "public", "data", "flashcards", "c1.json"), c1);
}

async function buildGrammar() {
  for (const topic of GRAMMAR) {
    const prompt = `Return only JSON for an IELTS grammar lesson in Indonesian. Topic: ${topic.label} (${topic.sub}). Keys: explanation, keyRules, examples, commonMistakes, ieltsTip, quiz.`;
    const raw = await askLLM(prompt, 1200);
    const parsed = parseJsonSafely(raw);
    const fallback = {
      explanation: `${topic.label} penting untuk akurasi IELTS. Fokuskan ke bentuk, makna, dan konteks penggunaan.`,
      keyRules: ["Pahami pola dasar.", "Perhatikan konteks.", "Hindari terjemahan mentah.", "Gunakan dalam writing dan speaking."],
      examples: [{ sentence: `${topic.label} appears in IELTS tasks.`, note: "Use the structure accurately.", indonesian: `${topic.label} muncul dalam tugas IELTS.` }],
      commonMistakes: [{ wrong: "Learner guesses the form.", right: "Learner checks the structure first.", why: "Kesalahan biasanya muncul karena menebak bentuk tanpa cek pola." }],
      ieltsTip: `${topic.label} memengaruhi grammatical accuracy dan range.`,
      quiz: []
    };
    save(join(ROOT, "public", "data", "grammar", `${topic.id}.json`), { ...(parsed || fallback) });
  }
}

async function buildVocab() {
  const byTopic = {};
  for (const item of WORDS) {
    const dict = await getDictionary(item.word);
    const dm = await getDatamuse(item.word);
    byTopic[item.topic] ||= { words: [] };
    byTopic[item.topic].words.push({
      word: item.word,
      pronunciation: dict.phonetic,
      partOfSpeech: dict.partOfSpeech,
      definition: dict.definition,
      indonesian: `Arti ${item.word} dalam konteks pembelajaran IELTS.`,
      level: item.level,
      ieltsBand: item.level === "B2" ? "6.5-7.0" : "7.0-7.5",
      example: dict.example,
      collocations: dm.collocations,
      synonyms: Array.from(new Set([...dict.synonyms, ...dm.synonyms])).slice(0, 4)
    });
  }
  for (const [topic, data] of Object.entries(byTopic)) {
    save(join(ROOT, "public", "data", "vocab", `${topic}.json`), data);
  }
}

async function buildReading() {
  const passages = [];
  for (const seed of READING_TOPICS) {
    const prompt = `Return only JSON for an IELTS reading passage. Topic: ${seed.topic}. Difficulty: ${seed.difficulty}. Keys: title, topic, difficulty, passage, vocabulary, questions, ieltsTips.`;
    const raw = await askLLM(prompt, 1600);
    const parsed = parseJsonSafely(raw);
    passages.push(parsed || {
      title: seed.topic,
      topic: seed.topic,
      difficulty: seed.difficulty,
      passage: `${seed.topic} is an important topic for IELTS preparation. This fallback passage keeps the app usable when live generation is unavailable.`,
      vocabulary: [{ word: "relevant", definition: "connected to the topic", indonesian: "relevan" }],
      questions: [],
      ieltsTips: ["Identify the main idea first.", "Watch out for paraphrases, not only repeated words."]
    });
  }
  save(join(ROOT, "public", "data", "reading", "passages.json"), passages);
}

async function main() {
  await buildFlashcards();
  await buildGrammar();
  await buildVocab();
  await buildReading();
  save(join(ROOT, "public", "data", "manifest.json"), {
    generatedAt: new Date().toISOString(),
    version: "v3",
    sources: ["DictionaryAPI.dev", "Datamuse", "Gemini/OpenRouter", "local seeds"],
    features: ["flashcards", "grammar", "vocabulary", "reading"]
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
