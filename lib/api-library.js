const cache = new Map();
const feedbackMetrics = new Map();

async function fetchWithTimeout(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function fromCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function saveCache(key, value, ttlMs = 1000 * 60 * 30) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function toSlug(input = "") {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenize(input = "") {
  return toSlug(input).split(/\s+/).filter(Boolean);
}

const TOPIC_DOMAIN_WHITELIST = {
  education: ["unesco.org", "oecd.org", "worldbank.org", "openalex.org", "doi.org"],
  technology: ["nist.gov", "hai.stanford.edu", "openalex.org", "doi.org"],
  climate: ["ipcc.ch", "ourworldindata.org", "worldbank.org", "openalex.org", "doi.org"],
  work: ["ilo.org", "worldbank.org", "openalex.org", "doi.org"],
  default: ["openalex.org", "doi.org", "theguardian.com"]
};

const CEFR_KEYWORDS = {
  beginner: ["basic", "introduction", "fundamentals", "overview"],
  intermediate: ["analysis", "policy", "evidence", "research"],
  advanced: ["methodology", "framework", "meta", "longitudinal", "systematic"]
};

function inferTopicKey(text = "") {
  const q = toSlug(text);
  if (q.includes("education") || q.includes("classroom")) return "education";
  if (q.includes("technology") || q.includes("ai") || q.includes("digital")) return "technology";
  if (q.includes("climate") || q.includes("environment")) return "climate";
  if (q.includes("work") || q.includes("employment") || q.includes("jobs")) return "work";
  return "default";
}

function normalizeCefr(value = "") {
  const v = toSlug(value);
  if (["a1", "a2", "beginner", "easy"].includes(v)) return "beginner";
  if (["c1", "c2", "advanced", "hard"].includes(v)) return "advanced";
  return "intermediate";
}

function normalizeTopicKey(value = "") {
  const v = toSlug(value);
  if (["education", "technology", "climate", "work", "default"].includes(v)) return v;
  return inferTopicKey(v);
}

function getFeedbackScore(topicKey = "default") {
  const key = normalizeTopicKey(topicKey);
  const metric = feedbackMetrics.get(key);
  if (!metric) return 0;
  const clickScore = Math.min(1, (metric.clicks || 0) / 30);
  const saveScore = Math.min(1, (metric.saves || 0) / 20);
  const completeScore = Math.min(1, (metric.completions || 0) / 20);
  return clickScore * 0.2 + saveScore * 0.3 + completeScore * 0.5;
}

function scoreArticle(item, queryTokens = [], profile = {}) {
  const titleTokens = tokenize(item?.title || "");
  const overlap = queryTokens.filter((token) => titleTokens.includes(token)).length;
  const relevance = queryTokens.length ? overlap / queryTokens.length : 0;
  const sourceBoost =
    item?.source === "OpenAlex" ? 0.35 :
    item?.source === "Crossref" ? 0.3 :
    item?.source === "The Guardian" ? 0.25 :
    0.1;
  const recencyBoost = item?.year && Number(item.year) >= 2021 ? 0.2 : 0;
  const topicKey = profile?.topicKey || "default";
  const whitelist = TOPIC_DOMAIN_WHITELIST[topicKey] || TOPIC_DOMAIN_WHITELIST.default;
  const url = String(item?.url || "");
  const domainBoost = whitelist.some((domain) => url.includes(domain)) ? 0.25 : 0;
  const cefr = normalizeCefr(profile?.cefr || "intermediate");
  const cefrTerms = CEFR_KEYWORDS[cefr] || CEFR_KEYWORDS.intermediate;
  const cefrBoost = cefrTerms.some((term) => titleTokens.includes(term)) ? 0.15 : 0;
  const feedbackBoost = getFeedbackScore(topicKey) * 0.25;
  return relevance + sourceBoost + recencyBoost + domainBoost + cefrBoost + feedbackBoost;
}

async function searchGuardian(query, limit = 3) {
  const apiKey = process.env.GUARDIAN_API_KEY || "test";
  const url = `https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&api-key=${apiKey}&page-size=${limit}&show-fields=trailText`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error("guardian_fetch_failed");
  const data = await res.json();
  const items = data?.response?.results || [];
  return items.map((item) => ({
    title: item.webTitle,
    url: item.webUrl,
    source: "The Guardian",
    snippet: item.fields?.trailText || ""
  }));
}

async function searchCrossref(query, limit = 3) {
  const url = `https://api.crossref.org/works?rows=${limit}&query.title=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error("crossref_fetch_failed");
  const data = await res.json();
  const items = data?.message?.items || [];
  return items
    .map((item) => {
      const title = Array.isArray(item.title) ? item.title[0] : "";
      const doi = item.DOI;
      if (!title || !doi) return null;
      return {
        title,
        url: `https://doi.org/${doi}`,
        source: "Crossref",
        snippet: Array.isArray(item.subject) ? item.subject.slice(0, 2).join(", ") : ""
      };
    })
    .filter(Boolean);
}

async function searchOpenAlex(query, limit = 3) {
  const normalized = toSlug(query) || "education";
  const mailto = process.env.OPENALEX_EMAIL ? `&mailto=${encodeURIComponent(process.env.OPENALEX_EMAIL)}` : "";
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(normalized)}&per-page=${limit}${mailto}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error("openalex_fetch_failed");
  const data = await res.json();
  const items = data?.results || [];

  return items
    .map((item) => {
      const title = item?.display_name;
      const year = item?.publication_year;
      const url = item?.primary_location?.landing_page_url || item?.id;
      if (!title || !url) return null;
      return {
        title,
        url,
        year,
        source: "OpenAlex",
        snippet: Array.isArray(item?.concepts) ? item.concepts.slice(0, 2).map((x) => x?.display_name).filter(Boolean).join(", ") : ""
      };
    })
    .filter(Boolean);
}

function fallbackArticles(query) {
  return [
    { title: `${query} - OECD`, url: "https://www.oecd.org/", source: "OECD", snippet: "Policy reports and datasets." },
    { title: `${query} - UNESCO`, url: "https://www.unesco.org/", source: "UNESCO", snippet: "Education and culture resources." },
    { title: `${query} - World Bank`, url: "https://www.worldbank.org/", source: "World Bank", snippet: "Global indicators and analysis." }
  ];
}

export async function getTrustedArticles(query, limit = 4, options = {}) {
  const normalized = toSlug(query) || "education";
  const topicKey = options?.topicKey || inferTopicKey(normalized);
  const cefr = normalizeCefr(options?.cefr || "intermediate");
  const key = `articles:${normalized}:${limit}:${topicKey}:${cefr}`;
  const cached = fromCache(key);
  if (cached) return cached;

  const result = [];
  const queryTokens = tokenize(normalized);
  for (const fn of [
    () => searchGuardian(normalized, limit),
    () => searchCrossref(normalized, limit),
    () => searchOpenAlex(normalized, limit)
  ]) {
    try {
      const data = await fn();
      for (const item of data) {
        if (!result.find((x) => x.url === item.url)) result.push(item);
        if (result.length >= limit) break;
      }
    } catch {}
    if (result.length >= limit) break;
  }
  const ranked = result
    .map((item) => ({ ...item, _score: scoreArticle(item, queryTokens, { topicKey, cefr }) }))
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...item }) => item);
  return saveCache(key, ranked.length ? ranked.slice(0, limit) : fallbackArticles(normalized).slice(0, limit));
}

export function recordArticleFeedback({ topicKey = "default", signal = "click" } = {}) {
  const key = normalizeTopicKey(topicKey);
  const current = feedbackMetrics.get(key) || { clicks: 0, saves: 0, completions: 0 };
  if (signal === "save") current.saves += 1;
  else if (signal === "complete") current.completions += 1;
  else current.clicks += 1;
  feedbackMetrics.set(key, current);
  return { topicKey: key, ...current };
}

export async function lookupDictionary(word) {
  const normalized = toSlug(word).split(" ")[0] || "study";
  const key = `dict:${normalized}`;
  const cached = fromCache(key);
  if (cached) return cached;

  try {
    const dictRes = await fetchWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`);
    const dictJson = await dictRes.json();
    const first = Array.isArray(dictJson) ? dictJson[0] : null;
    const meaning = first?.meanings?.[0]?.definitions?.[0];

    const synRes = await fetchWithTimeout(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(normalized)}&max=6`);
    const synJson = await synRes.json();

    return saveCache(key, {
      word: normalized,
      phonetic: first?.phonetic || "",
      definition: meaning?.definition || "Definition unavailable from external API.",
      example: meaning?.example || "",
      synonyms: Array.isArray(synJson) ? synJson.map((x) => x.word).slice(0, 6) : []
    });
  } catch {
    return saveCache(key, {
      word: normalized,
      phonetic: "",
      definition: "Definition unavailable from external API.",
      example: "",
      synonyms: []
    });
  }
}

export async function getConversationContext(text) {
  const tokens = String(text)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length >= 5)
    .slice(0, 2);

  const words = tokens.length ? tokens : ["communication"];
  const entries = await Promise.all(words.map((word) => lookupDictionary(word)));
  return entries;
}
