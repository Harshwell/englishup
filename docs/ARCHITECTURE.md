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
AI requests use Gemini as the only primary provider during MVP. The required behavior is: 8 second timeout, one retry maximum, Zod validation, then fallback. Fallback must distinguish `api_down`, `quota_exceeded`, `timeout`, `invalid_response`, and `circuit_open`.

Circuit breaker policy: three AI failures in sixty seconds open static/rule-based fallback for three minutes. API enrichment such as DictionaryAPI.dev, Datamuse, Wikipedia REST summaries, Web Speech API/browser audio, OpenAlex, and Crossref is independent from the AI fallback chain. The `/api/library` enrichment route returns `aiUsed: false` so UI can add definitions, pronunciation, collocations, related words, reference context, and trusted articles without spending AI calls.

## Storage
Progress is local-first and versioned. The current dashboard reads and writes active dates in localStorage so streaks are derived from real learning activity rather than login or hardcoded values. The `ProgressState` schema includes XP, level, active dates, streak, completed lessons, quiz attempts, FSRS state, reading results, writing and conversation history, achievements, and settings. Future IndexedDB migrations must bump the version and keep a migration note in the changelog.
