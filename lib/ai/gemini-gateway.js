import crypto from "node:crypto";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_TIMEOUT_MS = 8000;
const CIRCUIT_FAILURE_LIMIT = 3;
const CIRCUIT_WINDOW_MS = 60 * 1000;
const CIRCUIT_OPEN_MS = 3 * 60 * 1000;
const cache = new Map();
const failures = [];
let circuitOpenUntil = 0;

export function normalizePromptInput(input = "") {
  return String(input).replace(/\s+/g, " ").trim().toLowerCase();
}

export function buildPromptCacheKey(promptVersion = "v1", input = "") {
  return crypto.createHash("sha256").update(`${promptVersion}:${normalizePromptInput(input)}`).digest("hex");
}

function now() {
  return Date.now();
}

function isCircuitOpen() {
  return now() < circuitOpenUntil;
}

function recordFailure() {
  const current = now();
  failures.push(current);
  while (failures.length && current - failures[0] > CIRCUIT_WINDOW_MS) failures.shift();
  if (failures.length >= CIRCUIT_FAILURE_LIMIT) {
    circuitOpenUntil = current + CIRCUIT_OPEN_MS;
    failures.length = 0;
  }
}

function classifyFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  if (error?.name === "AbortError" || message.includes("timeout") || message.includes("timed out")) return "timeout";
  if (message.includes("quota") || message.includes("429") || message.includes("rate")) return "quota_exceeded";
  if (message.includes("invalid") || message.includes("empty") || message.includes("json")) return "invalid_response";
  if (message.includes("circuit")) return "circuit_open";
  return "api_down";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function tokenUsageFrom(data = {}) {
  const usage = data?.usageMetadata;
  if (!usage) return undefined;
  return {
    prompt: Number(usage.promptTokenCount || 0),
    candidates: Number(usage.candidatesTokenCount || 0),
    total: Number(usage.totalTokenCount || 0),
  };
}

export async function callGeminiGateway({
  prompt,
  maxOutputTokens = 800,
  temperature = 0.5,
  promptVersion = "gemini-gateway-v1",
  endpoint = "gemini.generateContent",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = 1,
  responseParser = (text) => text,
  fallbackData = null,
} = {}) {
  const startedAt = now();
  const normalizedPrompt = String(prompt || "").trim();
  const cacheKey = buildPromptCacheKey(promptVersion, normalizedPrompt);

  if (!normalizedPrompt) {
    return {
      ok: false,
      source: "rule_based",
      endpoint,
      promptVersion,
      cacheKey,
      latencyMs: now() - startedAt,
      failureReason: "invalid_response",
      data: fallbackData,
    };
  }

  const cached = cache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      latencyMs: now() - startedAt,
      cached: true,
    };
  }

  if (isCircuitOpen()) {
    return {
      ok: false,
      source: fallbackData === null ? "rule_based" : "static",
      endpoint,
      promptVersion,
      cacheKey,
      latencyMs: now() - startedAt,
      failureReason: "circuit_open",
      data: fallbackData,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      source: fallbackData === null ? "rule_based" : "static",
      endpoint,
      promptVersion,
      cacheKey,
      latencyMs: now() - startedAt,
      failureReason: "api_down",
      data: fallbackData,
    };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  let lastFailure = "api_down";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: normalizedPrompt }] }],
          generationConfig: { maxOutputTokens, temperature },
        }),
      }, timeoutMs);

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `gemini_http_${response.status}`);
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("")?.trim() || "";
      if (!text) throw new Error("invalid_response_empty_text");
      const parsed = responseParser(text);
      const result = {
        ok: true,
        source: "ai",
        endpoint,
        promptVersion,
        cacheKey,
        latencyMs: now() - startedAt,
        tokenUsage: tokenUsageFrom(data),
        data: parsed,
      };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      lastFailure = classifyFailure(error);
      recordFailure();
    }
  }

  return {
    ok: false,
    source: fallbackData === null ? "rule_based" : "static",
    endpoint,
    promptVersion,
    cacheKey,
    latencyMs: now() - startedAt,
    failureReason: lastFailure,
    data: fallbackData,
  };
}

export function getGeminiCircuitState() {
  return {
    open: isCircuitOpen(),
    openUntil: circuitOpenUntil ? new Date(circuitOpenUntil).toISOString() : null,
    recentFailures: failures.length,
  };
}
