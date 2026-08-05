# Changelog

## Unreleased

- Added schema validation for static JSON, generated `/api/content` payloads, and AI gateway/evaluation responses.
- Updated fallback flow so invalid generated content is discarded before render and falls back to static JSON or local fallback data.
- Documented the validated content pipeline and fallback order in `docs/ARCHITECTURE.md`.
