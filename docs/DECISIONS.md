# Decisions

## ADR-001: Static-first learning core
Status: accepted

EnglishUp keeps grammar, vocabulary/flashcards, reading, quiz, and progress usable without AI. This lowers cost, improves reliability, and prevents provider failures from blocking learning.

## ADR-002: Gemini-only primary AI for MVP
Status: accepted

Gemini is the only primary AI provider for the personal MVP. Secondary AI routing is deferred until observability shows a real reliability or quality gap.

## ADR-003: Versioned Zod contracts before generator expansion
Status: accepted

Schemas are introduced before expanding importers and generators so generated content, static JSON, AI output, and progress storage share a reviewable contract.


## ADR-004: Non-AI enrichment before more AI providers
Status: accepted

Vocabulary and reading enrichment should first use free/reference APIs such as DictionaryAPI.dev, Datamuse, Wikipedia REST summaries, OpenAlex, and Crossref. This minimizes AI spend and keeps learning material explainable, attributable, and available when AI is degraded.

## ADR-005: Activity-based gamification over cosmetic metrics
Status: accepted

Streaks and dashboard momentum must come from meaningful learning activity. The UI should feel like a calm study operating system with progress, next best action, and mastery signals rather than childish rewards or global leaderboard pressure.


## ADR-006: Central Gemini gateway over route-local provider logic
Status: accepted

AI route logic now goes through a shared Gemini gateway so timeout, retry, prompt-version cache keys, circuit breaker, and fallback reasons are consistent. Route-local OpenRouter fallback is removed from the MVP runtime to keep AI as an accelerator rather than a dependency chain.

## ADR-007: Weakest-skill daily challenge
Status: accepted

Daily challenges should be generated from learning insights rather than date rotation. This keeps gamification meaningful and makes the dashboard answer what the learner should do today.
