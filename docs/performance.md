# Measured performance

Measured 2026-11-02 on the development machine, macOS ARM64, Electron 45.2.1, production bundles in an unsigned ASAR-packaged CraftCV application. Playwright launches/attaches to the application, so these are instrumented development-machine measurements, not a cross-platform release guarantee.

| Measurement                                                 | Result                                     | Initial target                   |
| ----------------------------------------------------------- | ------------------------------------------ | -------------------------------- |
| Initial renderer JS, gzip                                   | 98,850 bytes (96.5 KiB)                    | Under 500 KB: met                |
| Packaged startup to visible interactive workspace           | 1,703 ms first run; 274 ms and 292 ms warm | Warm under 2 seconds: met here   |
| Idle memory, sum of process working sets                    | 472 MB first run; 460 MB warm              | Under 200 MB: **not met**        |
| Memory after full import/export/review integration workflow | 606 MB                                     | Reported, not an idle baseline   |
| 500-file initial repository scan                            | 110 ms; 2,743,500 bytes                    | Responsive UI                    |
| Same repository, metadata cache reuse                       | 36 ms; 500/500 files cached                | Changed files only               |
| Renderer timer callbacks during scans                       | 12 initial; 4 cached (10 ms interval)      | Renderer remains responsive      |
| macOS ARM64 DMG                                             | About 152 MiB                              | No fixed installer target        |
| Unpacked macOS application                                  | About 375 MiB on disk                      | No fixed application-size target |

Memory uses Electron `app.getAppMetrics().memory.workingSetSize`, summed across Browser, GPU, Utility, and Tab processes, divided by 1024 to MiB. Shared pages can be counted more than once, and debugger attachment may add overhead. This conservative figure is not private physical footprint. It still does **not** substantiate the requested sub-200 MB target.

Warm idle process breakdown was approximately 187 MiB main/browser, 144 MiB renderer, 81 MiB GPU, and 48 MiB utility. Chromium/Electron process overhead dominates the current baseline. The application has no resident analysis/document workers and no idle scans or AI calls. Parsing libraries are lazy-loaded into disposable workers. Further work should profile private footprint and heap snapshots without instrumentation on representative release hardware; do not weaken sandboxing or disable security features to reduce the number.

The scan benchmark is a synthetic 500-file React fixture, not a large production monorepo. File/byte caps protect large repositories and clearly mark partial analysis. Renderer timers continuing to run are a responsiveness smoke test, not a frame-latency guarantee.

## Reproduce

```sh
npm run check
npm run package:dir
npm run measure
CRAFTCV_EXECUTABLE="$PWD/release/mac-arm64/CraftCV.app/Contents/MacOS/CraftCV" node scripts/integration.mjs
CRAFTCV_EXECUTABLE="$PWD/release/mac-arm64/CraftCV.app/Contents/MacOS/CraftCV" node scripts/benchmark.mjs
npx electron-builder --mac dmg
```

Reports and screenshots are written to `artifacts/`, which is excluded from version control and production packaging. For other platforms, set `CRAFTCV_EXECUTABLE` to the appropriate packaged executable. Omitting it launches the production build from the project directory instead.

## Validation performed

- Strict TypeScript check, ESLint, production build: passed.
- Vitest: 12 tests across extraction/claim validation, IPC schemas, source exclusion/cache/cancellation/byte caps, provider adapters/budgets/invalid output, and renderer interaction.
- Packaged Electron integration: repository selection, actual worker analysis, evidence inspection, unsupported-claim rejection, approval, clipboard, PDF/DOCX export and import roundtrip, saved sessions, native SQLite, one sandboxed BrowserWindow, absent renderer Node, invalid IPC rejection, cancellation, and missing cloud consent rejection.
- Minimum-width horizontal overflow check and visual screenshots reviewed.
- Production dependency audit: zero known vulnerabilities at measurement time. Development tooling audit: 25 moderate findings; see dependency notes.

Live paid provider requests, Windows/Linux execution, signed/notarized distribution, and performance on other machines are not verified. Default provider model names must be available to the user's account; errors surface in the UI. The local milestone does not depend on cloud access.

## Document editor update

The initial renderer bundle is now approximately 99,732 bytes gzip (97.4 KiB). The editor route adds approximately 166,987 bytes gzip (163.1 KiB) only when opened. Vite reports the editor's uncompressed 543 KB chunk as larger than its default 500 KB warning threshold; this is an on-demand route and does not exceed the initial compressed-payload budget.

Validation now includes 17 unit/UI tests and a separate real Electron editor integration: schema-1 CV migration, formatted text, headings, lists, undo/redo, table columns, stale revision rejection, autosave across navigation and app restart, formatted DOCX structure, PDF text roundtrip, and the minimum-width layout. Earlier memory and installer measurements above describe the initial milestone; editor use is not claimed to meet the memory target.
