# Changelog

## 0.4.0 - Unreleased

### EnglishUp learning workspace redesign

- Replaced the dense dashboard shell with a responsive learning workspace centered on a progressive grammar path, daily goal, streak activity, vocabulary decks, reading library, conversation scenarios, writing review, and milestone progress.
- Added a versioned `englishup.v2.progress` local record with migration from the existing v1 record, real activity-based streaks, daily XP goals, duplicate reward protection, and private hashed activity keys for writing and conversation.
- Added validated content normalization for inconsistent grammar answers, short-answer reading questions, matching features, missing passage IDs, and static-to-local fallback behavior.
- Added browser coverage for core navigation, keyboard and mobile behavior, content paths, fallback feedback, reload persistence, and WCAG AA checks.

### Added

- Added a Gemini-only gateway with 8 second timeout, one retry, prompt-version cache keys, circuit breaker behavior, latency metadata, and explicit fallback reasons.
- Added adaptive daily challenge generation from weakest-skill insights instead of date rotation.
- Added CI-specific content validation command that fails when Zod is unavailable.
- Added non-AI material enrichment through DictionaryAPI.dev audio/definition, Datamuse synonyms/related words/collocations, Wikipedia summaries, and trusted article discovery.
- Added activity-based dashboard gamification with real active-date streaks and streak-freeze display instead of hardcoded streak progress.
- Added repository guardrails in `AGENTS.md` so future work preserves the static-first, AI-as-accelerator product model.
- Added baseline architecture, content pipeline, question schema, decision, and roadmap documentation.
- Added Zod runtime schemas for core learning payloads, progress state, and AI gateway results.
- Added `npm run validate:content` to check current static reading, flashcard, and grammar seed viability.

### Changed

- Removed OpenRouter/secondary AI from runtime and generator defaults to match the Gemini-only MVP guardrail.
- Enrichment responses now include non-AI source metadata, latency, cache state, and fallback reason when available.
- Refined the home/vocabulary UI copy toward a calmer study operating system tone and reduced AI/chatbot-forward framing.
- Documented Gemini-only MVP direction and moved secondary AI providers to roadmap consideration instead of a default product dependency.

### Migration and fallback notes

- The current learning workspace migrates the legacy v1 progress record to v2 on first use; the original record is retained.
- Existing static content remains the fallback source; schema normalization of all seed records is planned as the next phase.

## Resource expansion
- Added a no-key dictionary resource room with validated source/license metadata and bounded requests.
- Added open textbook, sentence-corpus, and accessible reading references.
- Replaced generic fallback teaching for five grammar topics with original topic-specific lessons and 20 explained questions.
- Added provider/schema and resource interaction tests. See docs/RESOURCES.md for provenance and review status.
