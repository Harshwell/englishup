# Architecture

EnglishUp follows a static-first App Router architecture. Public learning pages should render from validated JSON where possible, while interactive practice can hydrate client components only for stateful actions.

## Layers

- `app/`: routes, layouts, API handlers, and page composition.
- `components/`: reusable UI and current application shells.
- `features/`: target home for domain modules such as grammar, flashcards, reading, writing, conversation, onboarding, and dashboard.
- `lib/`: shared runtime logic, AI gateway, storage, scheduling, and fallback helpers.
- `lib/schemas/`: Zod contracts for static payloads, AI responses, and versioned progress.
- `public/data/`: runtime JSON that must work without AI.
- `content/`: authoring/intermediate material before export to runtime JSON.
- `scripts/`: import, validation, extraction, and generation tooling.

## Data flow

1. Static JSON is generated or curated.
2. Scripts validate payloads with Zod.
3. Pages and API routes load validated payloads.
4. Client interactions persist versioned progress locally.
5. AI/API enrichment may add feedback or explanations, but static content remains the source of truth.

## AI and fallback flow

AI requests go through `lib/ai/gemini-gateway.js`. Gemini is the only runtime provider during MVP. The gateway enforces an 8 second timeout, one retry maximum, prompt-version cache keys, circuit breaker state, latency metadata, and fallback. Fallback must distinguish `api_down`, `quota_exceeded`, `timeout`, `invalid_response`, and `circuit_open`.

Circuit breaker policy: three AI failures in sixty seconds open static/rule-based fallback for three minutes. API enrichment such as DictionaryAPI.dev, Datamuse, Wikipedia REST summaries, Web Speech API/browser audio, OpenAlex, and Crossref is independent from the AI fallback chain. The `/api/library` enrichment route returns `aiUsed: false` plus source-level metadata so UI can add definitions, pronunciation, collocations, related words, reference context, and trusted articles without spending AI calls.

## Storage

Progress is local-first and versioned. The learning workspace writes `englishup.v2.progress` after migrating the former `englishup.v1.progress` counters. Each activity stores its kind, label, XP, timestamp, and a private key; writing and conversation keys are SHA-256 digests so learner text is not written to progress storage. A rewarded key is scoped to the local day, preventing accidental double rewards after reload while allowing deliberate review on another day. Active dates are derived from completed work, and the streak view can show today or the most recent contiguous run. XP is an activity signal, not an IELTS or CEFR score. Future IndexedDB migrations must bump the version and keep a migration note in the changelog.

## UI composition

`components/learning/LearningApp.jsx` owns the workspace shell and navigation. `Practice.jsx` owns grammar, vocabulary, reading, conversation, and writing practice boundaries. `study-content.js` validates and normalizes the static-first payloads. The home path is intentionally content-led: the next lesson is the focal point, daily XP and streak are supporting context, and milestones replace fabricated leaderboards or claims. `DESIGN.md` records the palette, type choices, rhythm, and reasons behind the composition.
