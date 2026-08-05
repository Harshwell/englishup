# Roadmap

## Phase 1: Baseline governance and contracts
Acceptance criteria: AGENTS guide, README, changelog, architecture docs, content pipeline docs, schema docs, roadmap, and validation script exist.

## Phase 2: Static seed normalization
Acceptance criteria: at least 20 validated items per skill, public practice bank fields normalized, and private references excluded from runtime JSON.

## Phase 3: Static-only learning flows
Acceptance criteria: Grammar, Vocabulary/Flashcards, Reading, and quiz flows complete end-to-end without AI.

## Phase 4: Local progress and gamification
Acceptance criteria: Zustand plus IndexedDB state uses versioned migrations, FSRS scheduling comes from `ts-fsrs`, XP comes only from meaningful learning activity, streaks derive from active dates, and daily challenges come from weakest-skill insights. Initial localStorage active-date streak and adaptive challenge behavior are already in place and should be migrated without data loss.

## Phase 5: Onboarding and adaptive dashboard
Acceptance criteria: placement estimates CEFR/readiness without official IELTS claims, dashboard shows weakest skill, next best action, goals, achievements, and real activity trends.

## Phase 6: AI gateway and observability
Acceptance criteria: Gemini gateway has timeout, retry, circuit breaker, prompt-version cache keys, Zod validation, latency/failure logging, and specific fallback reasons. Initial shared gateway is in place; next work should add deeper schema validation around each AI response payload. Keep expanding free API enrichment before adding secondary AI providers.

## Phase 7: Writing and conversation
Acceptance criteria: both modules work on proven fallback paths first, then AI adds actionable feedback with honest limitations.
