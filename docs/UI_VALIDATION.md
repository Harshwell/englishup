# UI and content validation — 2026-09-15

- PASS: production build, including the resource API route.
- PASS: 13 Node tests covering progress migration/deduplication, schema normalization, offline content, attribution validation, provider failures, and the five new lessons.
- PASS: 10 Chromium browser tests against production, including all eight grammar topics, eight vocabulary decks, reading question types, placement review, writing/conversation fallback, resource lookup states, corrupt storage, and mobile navigation.
- PASS: automated axe WCAG A/AA checks on tested dashboard, practice, reading, placement, and resource states. This is not a full accessibility certification.
- PASS: desktop/mobile screenshots inspected; responsive checks at 320–1440px, no horizontal overflow in tested views.
- PASS: static content validator.

Anti-slop delivery review: identity and dials are recorded in DESIGN.md; the grammar tiles and path reflect the learning product; rewards derive from local activities; CTAs perform tested actions; references retain attribution; motion is restrained with reduced-motion support. Resource controls reuse the study action styling.

Live dictionary metadata for `study` was checked through PowerShell: source Wiktionary, license CC BY-SA 3.0. The application's live provider request timed out in this environment and returned the intended 503; success, missing-entry, and outage UI states were tested with deterministic fixtures. Live availability is not guaranteed. External reference links are not course content or a CEFR assessment. New grammar content needs educator review before claiming a reviewed syllabus.
