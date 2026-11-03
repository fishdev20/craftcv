# Contributing to CraftCV

Use Node 22.22.2+ and Git. Run `npm ci`, then `npm run dev`. Run `npm run format` to format source files and documentation with Prettier, or `npm run format:check` to check without modifying files. The main check command and CI enforce formatting. Before proposing a change, run `npm run check` and `npm run test:integration`. Packaging rebuilds native SQLite for Electron; use `npm run package:dir` and run the integration script against the packaged executable with `CRAFTCV_EXECUTABLE=/absolute/path/to/executable node scripts/integration.mjs`.

Keep renderer, preload, and main boundaries explicit. Add narrow typed IPC methods with Zod validation and sender checks. Never expose arbitrary paths, shell commands, or Node APIs to the renderer. Repository access must remain read-only. Do not add telemetry, automatic cloud calls, broad source uploads, or plaintext API-key storage.

Tests should assert meaningful behavior: scan limits, ignore rules, cancellation, validation, data persistence, and user-visible workflows. Use generated fixtures and fake provider responses; do not commit personal CVs, repositories, keys, or paid API traffic. Integration tests use a temporary app-data directory and clean it up.

Prefer small dependencies and route/feature-level lazy imports. Record measured performance regressions. Discuss schema changes and dependency additions in the pull request. Include the problem, changed behavior, and validation results. See the code of conduct for collaboration expectations.
