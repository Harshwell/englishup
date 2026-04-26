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
    vocabLearned > 0 ? "vocab" : null,
    readingCompleted > 0 ? "reading" : null,
    chatMessages > 0 ? "chat" : null
  ].filter(Boolean);

  const weakest =
    grammarCoverage < 40 ? "grammar" :
    readingCompleted < 2 ? "reading" :
    chatMessages < 8 ? "conversation" :
    "vocabulary depth";

  const momentum =
    consistencyScore >= 75 ? "strong" :
    consistencyScore >= 45 ? "stable" :
    "fragile";

  return {
    grammarCoverage,
    consistencyScore,
    activeSkills,
    weakest,
    momentum,
    recommendations: [
      weakest === "grammar"
        ? "Prioritaskan 1 topik grammar inti sampai akurat sebelum pindah ke topik baru."
        : "Pertahankan rotasi grammar singkat agar akurasi kalimat tetap naik.",
      readingCompleted < 3
        ? "Tambah 1 reading passage per sesi untuk melatih scanning + inference."
        : "Pertahankan reading dengan fokus evaluasi alasan jawaban.",
      chatMessages < 10
        ? "Dorong 5-10 chat message aktif agar transfer grammar ke speaking lebih cepat."
        : "Gunakan chat sebagai latihan reformulasi kalimat yang sudah dikoreksi."
    ]
  };
}
