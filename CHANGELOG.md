# Changelog

## 0.4.0 - Unreleased

### Added
- Added non-AI material enrichment through DictionaryAPI.dev audio/definition, Datamuse synonyms/related words/collocations, Wikipedia summaries, and trusted article discovery.
- Added activity-based dashboard gamification with real active-date streaks and streak-freeze display instead of hardcoded streak progress.
- Added repository guardrails in `AGENTS.md` so future work preserves the static-first, AI-as-accelerator product model.
- Added baseline architecture, content pipeline, question schema, decision, and roadmap documentation.
- Added Zod runtime schemas for core learning payloads, progress state, and AI gateway results.
- Added `npm run validate:content` to check current static reading, flashcard, and grammar seed viability.

### Changed
- Refined the home/vocabulary UI copy toward a calmer study operating system tone and reduced AI/chatbot-forward framing.
- Documented Gemini-only MVP direction and moved secondary AI providers to roadmap consideration instead of a default product dependency.

### Migration and fallback notes
- No user data migration is required in this version.
- Existing static content remains the fallback source; schema normalization of all seed records is planned as the next phase.
