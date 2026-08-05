# Question and Payload Schemas

Runtime contracts live in `lib/schemas/englishup-schemas.mjs` and currently define:
- `GrammarQuestion`
- `VocabularyCard`
- `ReadingPassage`
- `WritingPrompt`
- `ConversationScenario`
- `ProgressState`
- `AIGatewayResult`

## Required question-bank fields
Each public practice record should include ID, exam type, skill/subskill, topic, CEFR, question type, prompt/options, answer, explanation, Indonesian learner mistake, pedagogical pattern, source reference, copyright status, and review status.

## Review statuses
- `AI_GENERATED_PENDING`: generated and not yet trusted as gold content.
- `AI_GENERATED_APPROVED`: sampled/reviewed enough for limited release.
- `VERIFIED_GOLD`: human-verified and safe as source-of-truth practice.
- `FLAGGED_ISSUE`: must be traceable and removable from runtime use.

## AI gateway result
Every AI result or fallback should record source, endpoint, latency, prompt version when relevant, cache key when cached, token usage when available, and a specific failure reason when fallback is used.
