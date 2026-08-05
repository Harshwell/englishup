const DEFAULT_TIMEOUT_MS = 12000;

function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("request_timeout")), timeoutMs))
  ]);
}

export function buildSeed(prefix = "session") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function safePostJSON(url, body, options = {}) {
  const {
    retries = 1,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = options;

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await withTimeout(
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }),
        timeoutMs
      );

      if (!result.ok) throw new Error(`http_${result.status}`);
      return await result.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("request_failed");
}

export function getActivityStreak(activeDates = [], referenceDate = new Date()) {
  const dates = new Set(Array.isArray(activeDates) ? activeDates : []);
  let streak = 0;
  const cursor = new Date(referenceDate);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function stableDayIndex(date = new Date()) {
  return Number(date.toISOString().slice(0, 10).replace(/-/g, ""));
}

const CHALLENGE_BANK = {
  grammar: [
    { task: "Selesaikan satu lesson grammar lalu capai minimal 4/5 di quiz.", xp: 60, tab: "grammar", reason: "Grammar coverage masih jadi bottleneck akurasi." },
    { task: "Review satu Indonesian pitfall: article, tense marker, atau passive voice.", xp: 45, tab: "grammar", reason: "Small form markers sering menurunkan clarity." }
  ],
  reading: [
    { task: "Kerjakan satu reading passage dan tulis evidence untuk jawaban yang salah.", xp: 70, tab: "reading", reason: "Reading butuh latihan scanning + evidence, bukan feeling." },
    { task: "Ambil satu passage intermediate dan fokus ke inference question.", xp: 65, tab: "reading", reason: "Inference adalah area penting untuk target B2-C1." }
  ],
  conversation: [
    { task: "Kirim 5 message dalam satu scenario conversation dengan 1 koreksi prioritas per giliran.", xp: 45, tab: "chat", reason: "Grammar perlu dipindahkan ke produksi aktif." },
    { task: "Reformulasi satu jawaban conversation menjadi lebih natural dan ringkas.", xp: 40, tab: "chat", reason: "Fluency naik dari reformulation, bukan jawaban panjang." }
  ],
  vocabulary: [
    { task: "Review 8 vocabulary cards dan catat 3 collocation yang bisa dipakai di writing.", xp: 50, tab: "vocab", reason: "Vocabulary depth butuh collocation, bukan hafalan kata saja." },
    { task: "Pilih satu deck B2/C1 dan ucapkan contoh kalimatnya dengan pronunciation audio jika tersedia.", xp: 50, tab: "vocab", reason: "Recall lebih kuat kalau word + sound + example dipakai bersamaan." }
  ]
};

export function buildDailyChallenge(learningInsights = {}, referenceDate = new Date()) {
  const weakestKey = String(learningInsights.weakest || "grammar").includes("vocab")
    ? "vocabulary"
    : String(learningInsights.weakest || "grammar").includes("conversation") || String(learningInsights.weakest || "grammar").includes("chat")
    ? "conversation"
    : String(learningInsights.weakest || "grammar").includes("reading")
    ? "reading"
    : "grammar";
  const bank = CHALLENGE_BANK[weakestKey] || CHALLENGE_BANK.grammar;
  return { ...bank[stableDayIndex(referenceDate) % bank.length], skill: weakestKey };
}

export function deriveLearningInsights({
  grammarCompleted = 0,
  grammarTotal = 1,
  vocabLearned = 0,
  readingCompleted = 0,
  chatMessages = 0,
  streak = 0,
  xp = 0
} = {}) {
  const grammarCoverage = Math.round((grammarCompleted / Math.max(1, grammarTotal)) * 100);
  const consistencyScore = Math.min(100, streak * 12 + Math.floor(xp / 80));
  const activeSkills = [
    grammarCompleted > 0 ? "grammar" : null,
    vocabLearned > 0 ? "vocabulary" : null,
    readingCompleted > 0 ? "reading" : null,
    chatMessages > 0 ? "conversation" : null
  ].filter(Boolean);

  const weakest =
    grammarCoverage < 40 ? "grammar" :
    readingCompleted < 2 ? "reading" :
    chatMessages < 8 ? "conversation" :
    vocabLearned < 24 ? "vocabulary" :
    "vocabulary depth";

  const momentum =
    consistencyScore >= 75 ? "strong" :
    consistencyScore >= 45 ? "stable" :
    "fragile";

  const recommendations = [
    weakest === "grammar"
      ? "Prioritaskan 1 topik grammar inti sampai akurat sebelum pindah ke topik baru."
      : "Pertahankan rotasi grammar singkat agar akurasi kalimat tetap naik.",
    readingCompleted < 3
      ? "Tambah 1 reading passage per sesi untuk melatih scanning + inference."
      : "Pertahankan reading dengan fokus evaluasi alasan jawaban.",
    chatMessages < 10
      ? "Dorong 5-10 chat message aktif agar transfer grammar ke speaking lebih cepat."
      : "Gunakan conversation sebagai latihan reformulasi kalimat yang sudah dikoreksi."
  ];

  const insight = {
    grammarCoverage,
    consistencyScore,
    activeSkills,
    weakest,
    momentum,
    recommendations
  };

  return {
    ...insight,
    dailyChallenge: buildDailyChallenge(insight)
  };
}
