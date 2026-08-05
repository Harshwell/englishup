# Architecture

## Content validation and fallback paths

EnglishUp treats generated content and static JSON as untrusted until it passes the schemas in `lib/schemas/englishup-schemas.mjs`.

- `/api/content` reads static JSON from `public/data`, enriches it with dictionary/article/AI helpers, then validates the final response before returning `NextResponse.json`.
- `components/EnglishUp.jsx` validates generated `/api/content` grammar, vocabulary, and reading responses before rendering. Invalid generated content falls through to static JSON; invalid static JSON falls through to curated local fallback modules where available.
- `components/Flashcards.jsx` validates generated vocab decks first, then static flashcard JSON, then the in-component local fallback cards.
- `/api/chat`, `/api/chat-v2`, and `/api/evaluate` validate the minimum AI response shape before returning successful responses. Evaluation falls back to a deterministic local rubric when provider output is unavailable or invalid.

Current fallback order:

1. Runtime generated `/api/content` payload.
2. Static JSON under `public/data`.
3. Local fallback content from `lib/fallback-content.js` or in-component fallback data.
4. Error UI only when no valid fallback exists.
