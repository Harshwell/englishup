import { getFallbackGrammar, getFallbackReadingPool, getFallbackVocab } from "./fallback-content";

const TRUSTED_REFERENCES = {
  education: [
    { label: "UNESCO - Education", url: "https://www.unesco.org/en/education" },
    { label: "OECD Education", url: "https://www.oecd.org/en/topics/education.html" }
  ],
  technology: [
    { label: "NIST AI Resource Center", url: "https://www.nist.gov/artificial-intelligence" },
    { label: "Stanford HAI", url: "https://hai.stanford.edu/" }
  ],
  climate: [
    { label: "IPCC", url: "https://www.ipcc.ch/" },
    { label: "Our World in Data - CO2", url: "https://ourworldindata.org/co2-and-greenhouse-gas-emissions" }
  ],
  work: [
    { label: "ILO", url: "https://www.ilo.org/" },
    { label: "World Bank - Jobs", url: "https://www.worldbank.org/en/topic/jobsanddevelopment" }
  ],
  default: [
    { label: "Britannica", url: "https://www.britannica.com/" },
    { label: "Cambridge Dictionary", url: "https://dictionary.cambridge.org/" }
  ]
};

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

function shuffle(list, seedInput) {
  const out = [...list];
  const rand = mulberry32(hashSeed(seedInput));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normalizeDifficulty(value = "") {
  const v = String(value).toLowerCase();
  if (["beginner", "easy", "a1", "a2"].includes(v)) return "beginner";
  if (["advanced", "hard", "c1", "c2"].includes(v)) return "advanced";
  return "intermediate";
}

function inferTopicKey(text = "") {
  const v = String(text).toLowerCase();
  if (v.includes("education") || v.includes("classroom")) return "education";
  if (v.includes("ai") || v.includes("technology") || v.includes("digital")) return "technology";
  if (v.includes("climate") || v.includes("environment")) return "climate";
  if (v.includes("work") || v.includes("employment") || v.includes("productivity")) return "work";
  return "default";
}

function normalizeQuestion(question, index) {
  const options = Array.isArray(question?.options) ? question.options : [];
  let answer = question?.answer;

  if (typeof answer === "string" && options.length) {
    const answerIndex = options.findIndex((opt) => String(opt).trim() === answer.trim());
    answer = answerIndex >= 0 ? answerIndex : 0;
  }

  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
    answer = 0;
  }

  return {
    id: question?.id || index + 1,
    type: question?.type || "multiple_choice",
    question: question?.question || `Question ${index + 1}`,
    options,
    answer,
    explanation: question?.explanation || "Review the passage and compare key evidence."
  };
}


function buildGrammarFromBase(base, topicId, seed) {
  const safeBase = base || getFallbackGrammar(topicId) || getFallbackGrammar("articles");
  const scenarioTemplates = [
    "You are drafting an IELTS Task 2 essay intro about technology and society.",
    "You are answering Part 3 speaking questions about education policy.",
    "You are editing an email to apply for a scholarship.",
    "You are summarizing a short academic article for class discussion."
  ];

  const selectedScenario = shuffle(scenarioTemplates, `grammar-${topicId}-${seed}`)[0];
  const quiz = shuffle(safeBase.quiz || [], `grammar-quiz-${topicId}-${seed}`).slice(0, 5);

  return {
    ...safeBase,
    studyCase: {
      context: selectedScenario,
      task: `Apply ${topicId.replace(/_/g, " ")} accurately in 4-6 sentences.`,
      checklist: [
        "Check form before meaning.",
        "Use one high-accuracy sentence instead of forcing complexity.",
        "Self-edit article/tense/punctuation markers."
      ]
    },
    quiz,
    generatedMeta: {
      seed,
      generatedAt: new Date().toISOString(),
      references: TRUSTED_REFERENCES.default
    }
  };
}

function buildReadingReferences(topic = "") {
  const key = inferTopicKey(topic);
  return TRUSTED_REFERENCES[key] || TRUSTED_REFERENCES.default;
}

export function generateReadingSet({
  passages = [],
  difficulty = "intermediate",
  size = 1,
  seed = `${Date.now()}`
} = {}) {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const sourcePool = passages.length ? passages : getFallbackReadingPool();
  const normalizedPool = sourcePool.map((item) => ({
    ...item,
    difficulty: normalizeDifficulty(item?.difficulty)
  }));

  const byLevel = normalizedPool.filter((item) => item.difficulty === normalizedDifficulty);
  const selectedPool = byLevel.length ? byLevel : normalizedPool;
  const picked = shuffle(selectedPool, `reading-${seed}`).slice(0, Math.max(1, size));

  return picked.map((item, idx) => {
    const questions = shuffle(
      (item?.questions || []).map((q, qidx) => normalizeQuestion(q, qidx)),
      `reading-questions-${seed}-${idx}`
    ).slice(0, 5);

    return {
      ...item,
      difficulty: normalizedDifficulty,
      questions,
      generatedMeta: {
        seed,
        generatedAt: new Date().toISOString(),
        references: buildReadingReferences(item?.topic || item?.title)
      }
    };
  });
}

export function generateVocabularySet({
  vocab = null,
  category = "ielts_academic",
  count = 10,
  seed = `${Date.now()}`
} = {}) {
  const base = vocab || getFallbackVocab(category) || getFallbackVocab("ielts_academic");
  const words = Array.isArray(base?.words) ? base.words : [];
  const picked = shuffle(words, `vocab-${category}-${seed}`).slice(0, Math.max(1, count));

  return picked.map((word, idx) => ({
    id: `${category}-${idx}-${word.word}`,
    front: word.word,
    back: {
      definition: word.definition,
      phonetic: word.pronunciation || "",
      example: word.example || "",
      synonyms: word.synonyms || [],
      antonyms: word.antonyms || [],
      level: word.level || "B2",
      frequency: "medium",
      source: "local-curated"
    }
  }));
}

export function generateGrammarFromBase({ base = null, topicId = "articles", seed = `${Date.now()}` } = {}) {
  return buildGrammarFromBase(base, topicId, seed);
}

export function generateGrammarLesson({ topicId = "articles", seed = `${Date.now()}` } = {}) {
  const base = getFallbackGrammar(topicId) || getFallbackGrammar("articles");
  return buildGrammarFromBase(base, topicId, seed);
}
