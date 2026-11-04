# Architecture

## Process boundaries

- `src/main`: the backend, where the business logic lives. One BrowserWindow, trusted-frame IPC routing, native dialogs, operation exclusivity, lifecycle cleanup. Context isolation and sandbox enabled; Node integration disabled. Popups, webviews, navigation, and permission requests denied.
- `src/preload/index.ts`: a finite typed API, with no arbitrary IPC channel or filesystem bridge. Progress subscriptions remove their exact listener.
- `src/renderer`: React, route-level splitting for the library, applications, documents and settings, Zustand selectors, HeroUI v3 components, Tailwind v4, and CSS tokens. No direct network requests or privileged imports. CSP disallows remote scripts, objects, frames by default, and remote connections.

### Main process layout

The main process is layered: IPC routes only validate and delegate, services hold the workflows, the domain holds pure rules, and storage, scanning, AI and documents do the I/O.

```
src/main/
  index.ts         bootstrap: single instance, paths, stores, services, IPC, window, quit cleanup
  core/            paths (from the entry's directory, so workers resolve from any chunk); Operations, the one cancellable long operation
  window/          the sandboxed main window; permission, navigation and IPC-sender checks
  ipc/             handle(): sender check, Zod validation, Result replies; routes/ maps each channel to a service
  services/        workflows: dashboard, projects, resumes, tailoring (analyze, AI drafts, review, export), settings
  domain/          pure rules: skills and evidence, claim checks, session assembly, the tailored document
  storage/         SQLite connection and migrations; project, resume and session stores; OS-encrypted credentials
  scanning/        repository discovery, the scanner and its worker, project context, the scan cache
  ai/              one structured-request client for OpenAI, ChatGPT plans and Anthropic; CV-bullet and project prompts; ChatGPT sign-in
  documents/       import and export dialogs, printing, and the document worker
  jobs/            reads a job posting from a link: public-address checks, redirects, size and time limits
```

Services receive their dependencies (stores, credentials, paths, operations, a progress reporter, the window for dialogs) from `index.ts` and know nothing of IPC. Modules that are only needed for an operation (discovery, AI, document I/O) are imported lazily to keep startup fast.

### Renderer layout

The renderer is organised by feature. Each feature owns its pages, components, Zustand store or actions, and an `api.ts` that is the only place it calls the preload bridge.

```
src/renderer/
  main.tsx              bootstrap: theme before first paint, window events, root render
  app/                  shell: App, routes, layout (Sidebar, Topbar, Toasts), theme, navigation, Splash, RuntimeGate
  common/
    api/                bridge() and unwrap(); app-wide calls (dashboard, cancel, progress)
    store/app-store.ts  dashboard, busy, progress, error, notice; action() and busyAction()
    ui/                 Page, Loading, Logo, SelectField, ConfirmRemove, icons, and CraftCV's
                        Stepper, Kanban, analysis trace, shimmer, and loading primitives
    hairline/           vendored Hairline engine and the Press figure
  features/
    ai/                 provider choice hook, provider/model fields, consent
    projects/           repository import, project understanding
    workspace/          New application wizard: job, check the job, CV, projects, review; session store
    applications/       the Applications tracker: list and board views, and their actions
    onboarding/         first run: the welcome, the setup checklist and the sample job
    documents/          document list, drafts store, Tiptap editor
    library/            Your sources page
    settings/           AI providers, getting started, and privacy
```

Components read state through store selectors and change it through a feature's actions; actions call the feature's `api.ts`, which unwraps the bridge's `Result`. Features may import another feature's actions or store when a change spans both (removing a CV also deselects it in the workspace). `@/` resolves to `src/renderer`, and `@shared/` to the cross-process contracts in `src/shared`.

- `src/main/storage/`: short prepared SQLite statements, WAL, foreign keys, schema version migration, transactional session writes. At most 600 evidence snapshots and 20 AI suggestions per session. History and saved-session count capped at 100; CV count capped at 25. Startup loads CV metadata only, with text fetched on demand.
- `src/main/scanning/scanner-worker.ts`: launched only on analysis; stopped on completion/cancellation. Async, sequential reads bound concurrency to one. Cache is maintained outside selected repositories.
- `src/main/documents/document-worker.ts`: lazy PDF/DOCX imports and DOCX export in a worker with a 30-second deadline and a 128 MB JS heap limit. Workers release parser modules when finished. PDF export uses Chromium's printToPDF in the existing window with a text-only print surface.
- `src/main/jobs/job-link.ts`: the only request to a site the person chooses. https only, every address and redirect checked against private ranges, no cookies, 20-second timeout, 3 MiB cap. Parsing (job-board APIs, JSON-LD and microdata `JobPosting`, Indeed and LinkedIn pages, page text) is pure, in `src/main/domain/job-posting.ts`.
- `src/main/jobs/job-page.ts`: the posting window for sites that refuse those requests. A separate sandboxed window in an in-memory session with no preload; the person loads the page, and the main process reads its DOM from an isolated world when they press Use this page.
- `src/main/ai/structured-request.ts`: native-fetch adapters for OpenAI, ChatGPT plans and Anthropic, streaming when a caller follows the reply live, deterministic structured response, Zod validation, no SDK/agent framework.

## Analysis pipeline

Job text → deterministic requirements → Git file inventory → bounded evidence extraction → requirement matching → cited drafts → claim checks → human approval → approved bullets.

Repository inventory uses `git ls-files --cached --others --exclude-standard -z` and `git check-ignore --no-index --stdin -z`. Ignored tracked files are excluded too. Disable `core.fsmonitor` for every Git invocation; never run repository scripts, hooks, dependencies, or build commands. Paths are resolved under the selected root; file symlinks and escaping paths are rejected. Repository Git configuration is used for ignore resolution. File content is untrusted data, never instructions.

Per-repository limits: 10,000 inventory entries, 2 MB Git stdout, 1,500 scanned files, 12 MiB scanned bytes, 128 KiB per file. Skip dependency/build directories, lockfiles, binary/NUL-containing files, generated markers, secret filenames, and common private-key/token patterns. Metadata cache uses size, mtime and ctime; unchanged files reuse bounded extracted snippets. Cache reads capped at 24 MiB. Cached analysis is explicitly re-run by the user and is not a live watcher.

Only 120 relevant evidence items per repository reach the session. Source strings are not kept after indexing. Worker results are released after bounded filtering. A global operation lock prevents concurrent scans, provider requests, or document work; cancellation aborts the request or terminates the worker. No worker runs while idle.

## AI controls

Consent is enforced by the main-process Zod schema, not just a checkbox. Endpoints are fixed to official provider origins. Model names are configurable but cannot alter the endpoint. Prompt instructions isolate source text as untrusted data. A single call generates bullets; jobs/evidence are reused from SQLite. Maximum 2,000 output tokens, 60-second timeout per request, at most three attempts for retryable status codes with exponential delay. Network exceptions and timeouts are not automatically retried to avoid ambiguous duplicate billing.

Valid JSON is not necessarily a truthful claim. Checks and human confirmation remain mandatory. Keep provider tests mocked unless explicitly running a paid live smoke test. Current tests cover both response shapes and invalid outputs.

## Exports

Imported text and approved project bullets are exported as a plain resume. This MVP does not reconstruct complex original CV formatting. PDF content is inserted using `textContent` into a print-only surface, never `innerHTML`. DOCX text runs escape markup through the document library. Export paths come only from a native save dialog.

## Local document editor

The Documents routes load Tiptap/ProseMirror on demand. This rich editor is now justified by the explicit user requirement; it is not part of the initial renderer bundle. It has no cloud services or collaboration connection.

Schema migration 2 adds structured document JSON, a revision counter, and modification time to `resumes`; existing imported text becomes paragraphs on first open. Saves validate a bounded allowlisted tree (100,000 text characters, 5,000 nodes, depth 16) and derive plain text on the main side for the tailoring pipeline. The revision-based UPDATE rejects stale writers. Creating a tailored document inserts a validated copy with only approved bullets.

The autosave queue lives outside route components, serializes requests, and preserves new edits while earlier saves complete. Pending drafts survive navigation. Save failures stay visible and drafts remain available; the window cannot close normally with unsaved changes. This is not crash recovery or version history. Deletion drains any in-flight save before removing the document.

PDF HTML is constructed by the main process from validated nodes and escaped text, never arbitrary HTML supplied over IPC. Links allow only HTTP, HTTPS, and mailto. DOCX generation uses native Word headings, lists, hyperlinks, formatted runs, and tables inside the existing disposable document worker. Imports still extract text; they do not roundtrip original source formatting. PDF/Word pagination and installed fonts can yield different line breaks.

## Services-folder discovery

The native folder dialog authorizes one project root that may contain multiple Git repositories. `repository-discovery.ts` performs bounded asynchronous traversal without following directory symlinks or ascending outside that root. `.git` directories/files are validated through Git before registration. The project and its service repositories are inserted transactionally and deduplicated by canonical path. Reimporting a parent root reassigns older flat repository records into that project. Overflow beyond 10 projects or 25 repositories is reported. Discovery is cancellable and reads no source content. Each selected project's services are then indexed sequentially through disposable workers, preserving per-repository ignore rules and scan caps. Evidence is bounded to 600 snippets per session, evenly budgeted and interleaved across services, with project and service names saved in the evidence snapshot.

Project understanding is a separate, consent-gated cloud operation. `project-analysis.ts` samples at most 48 high-signal READMEs, dependency/build manifests, container descriptors, Helm configuration files, and API specifications across a project, with an 80,000-character total cap. It sends service names and relative paths, never absolute local paths. The provider must return a strict structured project map; returned evidence paths are filtered against the files that were actually shared before the analysis is saved in SQLite.

`chatgpt-auth.ts` implements OpenAI's open-source Sign in with ChatGPT flow without reading Codex state. It uses a stable host ID, dynamic client registration, system-browser Authorization Code with PKCE, random state and nonce values, an ephemeral `127.0.0.1` callback, signed ID-token verification against OpenAI JWKS, scope validation, encrypted token storage, serialized rotating refresh tokens, account-specific model discovery, and remote revocation on disconnect. ChatGPT-plan requests use a dedicated SSE parser and are accepted only after `response.completed`; API-key OpenAI requests keep their existing non-streaming contract.
