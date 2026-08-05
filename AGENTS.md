# EnglishUp Agent Guide

## Product guardrails
- EnglishUp is a static-first learning platform for Indonesian learners targeting IELTS Band 7+ readiness (CEFR B2-C1), not a generic chatbot.
- Core Grammar, Vocabulary/Flashcards, Reading, quiz, and local progress flows must work without AI.
- AI is an accelerator only: feedback, variations, enrichment, and explanations. Do not make AI the source of truth.
- Public learning content must be original. Copyrighted samples may only be used as private references and must never be copied, lightly paraphrased, or published.
- Do not claim official IELTS scores. Automated output may estimate CEFR/readiness only with clear caveats.

## Architecture rules
- Prefer Next.js App Router Server Components for static/SEO pages; use Client Components only for interaction.
- Keep boundaries clear: `app/`, `components/`, `features/`, `lib/`, `lib/schemas/`, `public/data/`, `content/`, `scripts/`, and `docs/`.
- Validate static payloads and AI responses with Zod before rendering or persisting.
- Progress data must be versioned and activity-based; never hardcode streaks or progress.
- Graceful degradation order: valid API/generated content -> static JSON -> local rule-based fallback.

## AI/API rules
- Gemini is the only primary AI provider for the MVP. Use an 8 second timeout, at most one retry, and then static fallback.
- Do not add OpenRouter or another secondary AI dependency until observability proves the need; document it as roadmap only.
- Circuit breaker policy: 3 AI failures within 60 seconds opens fallback for 3 minutes.
- Fallback reasons must be specific: `api_down`, `quota_exceeded`, `timeout`, `invalid_response`, or `circuit_open`.
- AI cache keys must include prompt version: `sha256(`${promptVersion}:${normalizedInputText}`)`.

## Documentation definition of done
- Changes to features, schemas, architecture, APIs, content flow, fallback behavior, or storage must update `README.md`, `CHANGELOG.md`, and the relevant `docs/` file in the same commit.
- Do not delete old decisions in `docs/DECISIONS.md`; mark them superseded with a replacement decision.
- Every commit/PR should state scope, validations run, fallback impact, and docs updated.

## Testing expectations
- Run the most relevant available checks before committing: at minimum `npm run validate:content` (when present) and `npm run build` for app-level changes.
- If a check cannot run because of an environment limitation, report it clearly.
