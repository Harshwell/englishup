# Content Pipeline

## Intended workflow
1. Store copyrighted PDFs or exam samples only in a private reference bank outside public runtime data.
2. Extract text/OCR for private analysis.
3. Create Obsidian Markdown notes with frontmatter for skill, subskill, CEFR, topic, pattern, source reference, copyright status, and review status.
4. Analyze competence, distractor patterns, difficulty signals, and explanation style.
5. Generate original questions and explanations.
6. Validate records with Zod.
7. Review changes in GitHub.
8. Publish approved JSON to `public/data/`.

## Source of truth
- Obsidian is for annotation and knowledge management.
- GitHub is the source of truth for reviewed content and schema history.
- JSON in `public/data/` is the runtime format.
- CSV/spreadsheets are temporary QA aids only.

## Copyright policy
Public practice items must be original. AI may learn abstract patterns from private references, but it must not copy, lightly paraphrase, or publish source-like passages, prompts, options, or explanations.
