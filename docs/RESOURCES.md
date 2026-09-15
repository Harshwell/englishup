# English learning resources

- Free Dictionary API: https://dictionaryapi.dev/ — live, on-demand definitions. The query word is sent to its public API. No learner profile or draft is sent. Display source URLs and response-provided license; reject missing attribution, invalid payloads, and non-HTTPS links. Audio is not redistributed because recording licenses can differ.
- Wikibooks English: https://en.wikibooks.org/wiki/English — external open textbook link.
- Tatoeba: https://tatoeba.org/en/sentences/search?from=eng&to=ind&query= — external sentence search. Text generally CC BY 2.0 FR with contributor attribution; audio varies. See https://en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus.
- Simple English Wikipedia: https://simple.wikipedia.org/wiki/Main_Page — external reading reference; check page license and history. No CEFR certification is inferred.

External references are separate from the original course/question bank. We do not import corpus sentences, textbook passages, or audio into static lessons. External content can change and is not educator-verified by EnglishUp.

`lib/extra-grammar.mjs` supplies five original lessons (conditionals, relative clauses, modals, reported speech, gerunds/infinitives), each with four contextual questions and explanations. Editorial review is pending. Existing three grammar files remain the primary material for their topics.

`GET /api/resources?word=study` validates a single English word, limits it to 50 characters, calls a fixed provider endpoint, and validates the response with Zod. Provider deadline: seven seconds; client deadline: ten seconds. No automatic retries, unbounded cache, fabricated definitions, or XP rewards for searches. A missing entry returns 404; invalid queries 400; provider/schema failures 503. No raw provider errors reach the UI.

Next content phase: teacher review of question ambiguity and difficulty, then reviewed expansion of reading/listening. Community content is not bulk-imported without item-level attribution and review.
