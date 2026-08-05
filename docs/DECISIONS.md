# Technical Decisions

## Package lockfile

This repository currently does not use `package-lock.json` or another committed JavaScript package-manager lockfile. For this change, we keep that existing policy instead of introducing a new lockfile in isolation.

Dependencies still need to be installed through `npm install` in an environment with npm registry access before running CI validation, so `zod` is available for the full content validation path.
