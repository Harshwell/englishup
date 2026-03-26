const cache = new Map();

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

function fallbackArticles(query) {
  return [
    { title: `${query} - OECD`, url: "https://www.oecd.org/", source: "OECD", snippet: "Policy reports and datasets." },
    { title: `${query} - UNESCO`, url: "https://www.unesco.org/", source: "UNESCO", snippet: "Education and culture resources." },
    { title: `${query} - World Bank`, url: "https://www.worldbank.org/", source: "World Bank", snippet: "Global indicators and analysis." }
  ];
}

export async function getTrustedArticles(query, limit = 4) {
  const normalized = toSlug(query) || "education";
  const key = `articles:${normalized}:${limit}`;
  const cached = fromCache(key);
  if (cached) return cached;

  const result = [];
  for (const fn of [
    () => searchGuardian(normalized, limit),
    () => searchCrossref(normalized, limit)
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

  return saveCache(key, result.length ? result.slice(0, limit) : fallbackArticles(normalized).slice(0, limit));
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

export async function getTopicWordPool(topic, max = 30) {
  const normalized = toSlug(topic) || "education";
  const key = `topicwords:${normalized}:${max}`;
  const cached = fromCache(key);
  if (cached) return cached;

  try {
    const [similarRes, triggerRes] = await Promise.all([
      fetchWithTimeout(`https://api.datamuse.com/words?ml=${encodeURIComponent(normalized)}&max=${max}`),
      fetchWithTimeout(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(normalized)}&max=${max}`)
    ]);

    const similarJson = await similarRes.json();
    const triggerJson = await triggerRes.json();
    const merged = [...(Array.isArray(similarJson) ? similarJson : []), ...(Array.isArray(triggerJson) ? triggerJson : [])];
    const unique = [];

    for (const item of merged) {
      const word = toSlug(item?.word || "").replace(/\s+/g, " ");
      if (!word || word.includes(" ")) continue;
      if (word.length < 4) continue;
      if (!unique.includes(word)) unique.push(word);
      if (unique.length >= max) break;
    }

    return saveCache(key, unique);
  } catch {
    return saveCache(key, []);
  }
}
