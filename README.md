# CraftCV

[![CI](https://github.com/fishdev20/craftcv/actions/workflows/ci.yml/badge.svg)](https://github.com/fishdev20/craftcv/actions/workflows/ci.yml)
[![Security](https://github.com/fishdev20/craftcv/actions/workflows/security.yml/badge.svg)](https://github.com/fishdev20/craftcv/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0ea5e9.svg)](LICENSE)

Local-first, evidence-backed CV tailoring for developers. MIT licensed.

Add a job by pasting it or importing its link, choose your CV and the projects whose code backs it, and CraftCV drafts CV lines that each cite the source they rest on. Every application is tracked on a board from Preparing to Offer. No API key is needed for the local workflow. Optional ChatGPT-plan, OpenAI API, and Anthropic API adapters can analyse the job, map projects, and refine drafts after explicit consent.

## Run

Requires Node.js **22.22.2+**, npm, and Git on PATH. Use a current supported Node release.

```sh
npm ci
npm run dev
```

```sh
npm run check             # strict TypeScript, ESLint, Vitest, production build
npm run test:integration  # actual Electron workflow with isolated temporary data
npm run measure          # compressed renderer bundle report
node scripts/benchmark.mjs # startup, idle memory and bounded scan measurements
npm run package:dir      # unpacked desktop application
npm run package          # installers for the host platform
npm run package:mac:arm64 # Apple Silicon DMG
npm run package:mac:x64   # Intel Mac DMG
npm run package:linux:x64 # Linux x64 AppImage
```

`postinstall` rebuilds better-sqlite3 for the installed Electron ABI. Do not rebuild it for the system Node ABI before running the app. SQLite is exercised in the Electron integration test, including in the packaged application.

## What works

- **A guided new application:** Job → Check the job → Your CV → Projects → Review, one step per page, saved as you go and resumable from the tracker.
- **Job links:** Greenhouse, Lever, Ashby, Workday, SmartRecruiters and Workable through their public APIs; other career pages through their schema.org `JobPosting`; LinkedIn and Indeed pages. Sites that block apps (Indeed, Glassdoor, LinkedIn behind sign-in) can be opened in a separate sandboxed CraftCV window and used from there.
- **Optional AI job analysis** with consent: requirements, keywords and responsibilities stream in live, and only terms the posting itself names are kept.
- **Applications tracker:** a list with a status select per row, or a board with drag and drop between Preparing, Applied, Interviewing, Offer and Closed.
- Native project-folder selection; nested repositories are grouped as services and inspected read-only.
- Deterministic technical requirement matching against source, with incremental progress, cancellation, caps, and metadata-based cache reuse.
- Local, cited bullet drafts; optional one-call structured cloud generation with Zod validation, timeouts, transient HTTP retries, cancellation, and token usage.
- Editable suggestions, evidence-gated approval/rejection, persistent sessions, approved-bullet clipboard copy.
- **Documents:** a local editor on A4 pages with rich text, headings, fonts, alignment, lists, links, tables, undo/redo, zoom, and autosave. Start blank or choose Standard ATS, Compact developer, Academic, or Modern accent from the visual template gallery. PDF imports keep their layout and page breaks; PDF and DOCX export keep the page layout.
- Estimated ATS relevance: fraction of extracted technical requirements represented in approved, source-backed bullets. **Not a vendor ATS score or hiring prediction.**
- PDF, DOCX, Markdown, and text CV import.
- API-key storage using Electron safeStorage backed by macOS Keychain, Windows DPAPI, or Linux Secret Service/KWallet. Linux's insecure `basic_text` fallback is refused.
- Browser-based ChatGPT-plan authorization using OpenAI's supported open-source OAuth flow. CraftCV never reads Codex credential files.

## Using CraftCV

A first launch opens a short welcome and a setup checklist; **Settings → Getting started** shows them again.

1. **Add the job.** Paste its text, or import its link. If a site blocks the import, use **Open the posting**, load the job in CraftCV's window, then **Use this page**.
2. **Check the job.** Confirm the role, company and location. Optionally press **Analyse the job** to have an AI provider read its requirements.
3. **Choose your CV.** Pick a CV, import one (PDF must contain selectable text; OCR is not included), or start a blank one.
4. **Choose your projects.** Add a project folder with a `.git` repository, or a parent folder such as `kaira/` containing service repositories. Up to 10 projects and 25 repositories can be in the library. Folders containing no Git repositories are not supported.
5. **Review.** CraftCV matches the job against your projects locally. Open each suggestion's evidence, edit the wording, and approve or reject it. Optionally refine the drafts with a connected provider after inspecting the bounded source preview and consenting.
6. Copy approved bullets, export from review, or choose **Open in editor** to create a separate, editable CV with your CV and approved bullets. **Mark as applied** moves the application along the tracker.
7. Use **Applications** to follow each application and **Documents** to reopen CVs or create a new one from a starter template. Autosave runs after 600 ms of inactivity; Ctrl/⌘ S saves immediately.

The document editor works entirely locally; it is not connected to Google Docs. It does not include collaboration, comments, tracked changes, version history, or images. Undo/redo history lasts while the editor is open. Manual edits are user-authored and are not automatically evidence-validated.

If saving fails, the draft stays in memory, a visible error offers retry or saving a copy, and closing the window is blocked while changes are unsaved. Force-quitting or an OS crash can still lose edits that have not reached SQLite. Revision checks prevent silent overwrites. Saving a copy preserves a conflicting draft without replacing the saved document.

## Privacy and data

No telemetry, background polling, startup scans, remote fonts, or full-repository uploads. The renderer has no filesystem, database, shell, or API-key access. Native file dialogs authorize paths; IPC accepts project IDs, not arbitrary paths.

Data lives in Electron's `userData` directory:

- macOS: `~/Library/Application Support/craftcv`
- Windows: `%APPDATA%/craftcv`
- Linux: `$XDG_CONFIG_HOME/craftcv` or `~/.config/craftcv`

Packaged product-name conventions may capitalize the folder as `CraftCV`. SQLite stores CV text, job descriptions, project analyses, evidence snapshots, and suggestions in plaintext. OS-encrypted keys are separate from SQLite. Scan cache files contain bounded source excerpts. Use full-disk encryption and protect backups. Removing a project deletes its repositories and scan caches; session snapshots remain until that session is deleted. Removing a CV detaches it from saved sessions. Deletion is logical, not forensic secure erasure of SQLite/WAL files or backups. To remove all data, quit the app and remove its application-data folder.

Cloud requests send up to 12,000 job characters, 10,000 CV characters, and 24 relevant snippets of at most 1,200 characters each, with relative file paths. Secrets and common generated files are filtered as a precaution, **not a guarantee**. Inspect the preview before consenting. Provider retention and billing policies apply. OpenAI requests set `store: false`. API keys and ChatGPT OAuth tokens never go to the renderer after saving.

For trust boundaries, packaged-runtime controls, and known limitations, read the
[security model](docs/security-model.md). Report vulnerabilities through
[GitHub's private vulnerability form](https://github.com/fishdev20/craftcv/security/advisories/new),
never through a public issue.

## Engineering boundaries

Source presence proves that a construct exists, not that the user authored it or achieved an outcome. Local drafts deliberately stay modest. Claim checks catch unknown references, unsupported vocabulary, quantified outcomes, and several ownership claims; they are heuristic, not semantic proof. Human review is required. Numeric achievements are conservatively blocked from approval in this MVP; add independently verified achievements to your original CV instead.

Requirement extraction uses an explicit technical vocabulary, not a general language model. Soft skills, seniority, years of experience, and unfamiliar technologies are not scored. Evidence may be a dependency declaration rather than an implementation; inspect citations. Large repository coverage is partial and labeled. Cached snapshots reflect the last explicit analysis, not live files. One cloud generation is allowed per saved session; begin a new analysis for another request.

A session token budget is a conservative UTF-8-byte input estimate plus output allowance, not an exact tokenizer count or a billing guarantee. Automatic retries only occur for transient HTTP errors, not ambiguous network timeouts. Live calls require an eligible connected ChatGPT plan or a configured API account; test fixtures do not demonstrate live account/model availability.

## Architecture and performance

See [architecture](docs/architecture.md), [dependency verification](docs/dependencies.md), and [measured performance](docs/performance.md). Initial performance targets are engineering goals, not promises.

macOS ARM64 is verified locally. Windows x64 and Linux x64 builds and integration tests are configured in CI; they have not been run on this development machine. Distribution requires platform code signing/notarization by maintainers; locally built installers are unsigned.

## Releases

Production releases are immutable version tags, not a production branch. Development lands on
`main`; a tag such as `v0.1.0` must exactly match the version in `package.json`.

```sh
npm version 0.1.0 --no-git-tag-version
npm run check
git add package.json package-lock.json
git commit -m "Release v0.1.0"
git tag v0.1.0
git push origin main v0.1.0
```

The tag starts `.github/workflows/release.yml`. It validates the source, builds separate macOS
Apple Silicon and Intel DMGs plus a Linux x64 AppImage, creates SHA-256 checksums, and attaches them
to a draft GitHub Release. GitHub also records build-provenance attestations for each installer.
Download and test every installer before publishing the draft. Verify a downloaded artifact with
`gh attestation verify <installer> --repo fishdev20/craftcv` and compare it with `SHA256SUMS.txt`.

Without Apple secrets, the workflow intentionally produces unsigned DMGs and adds a warning to the
job. After `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_API_KEY`, `APPLE_API_KEY_ID`, and
`APPLE_API_ISSUER` are added as repository Actions secrets, the same workflow signs and notarizes
the macOS builds automatically. Certificate and key files are ignored by Git and must never be
committed.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md),
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [third-party notices](THIRD_PARTY_NOTICES.md).
The `private: true` package metadata prevents accidental npm publication; it does not restrict the
MIT-licensed source repository.

## Importing microservices folders

Use **Import project folder** in the new application's Projects step or in Your sources, then choose the parent folder once. Both entry points handle standalone repositories and parent folders automatically. For example, `kaira/services/auth/.git` and `kaira/services/billing/.git` become services inside one Kaira project. Git worktrees and submodules with `.git` files are supported. Reimporting the same folder reuses existing repositories and repairs older flat imports by moving them into the project group.

In the Projects step, select one or more projects and open **Understand selected projects with AI** to create saved project summaries, architecture descriptions, technology lists, and service maps in one batch. The same action is available for an individual project in **Your sources**. CraftCV sends one bounded request per project only after consent. Each payload contains service names plus up to 48 high-signal README and manifest excerpts, capped at 80,000 characters total. Absolute local paths, full repositories, ignored files, secrets, and arbitrary source files are not sent. Saved analyses cite relative `service/file` paths and record uncertainty separately.

## Connect a ChatGPT plan

Open **Settings**, select **Continue with ChatGPT**, and finish authorization in the system browser. CraftCV uses Authorization Code with PKCE and a loopback callback on `127.0.0.1`. Granted access, rotating refresh, and retained identity tokens are encrypted with the operating system credential store. CraftCV validates the signed identity token, requested account, nonce, audience, expiry, and plan-usage scopes before enabling the provider. Choose **ChatGPT plan** in either AI provider menu to use a model available to the connected account.

ChatGPT-plan inference uses `POST /v1/responses` with `store: false`, `stream: true`, and waits for `response.completed`. Disconnecting attempts to revoke the renewable session and always clears tokens locally. API-key authentication remains available as a separate billing path.

Discovery is cancellable and bounded to six directory levels below the selected root, 3,000 folders, 20,000 entries, and 100 discovered roots. It skips hidden/dependency/build folders and directory symlinks. The library and each analysis support 25 repositories. If capacity, depth, or access limits prevent a complete import, a notification explains what was skipped; choose a more specific subfolder or remove unused repositories. Source evidence includes the service name. Sessions retain at most 600 relevant snippets, shared across selected repositories; cloud previews remain capped at 24 snippets and are interleaved across services.

## Development runtime updates

`npm run dev` watches main-process and preload files as well as the renderer. Main-process edits restart Electron; preload edits reload its window. Save edits before changing desktop-process code. If a previous dev server was launched without `--watch`, stop that existing process with Ctrl+C and start `npm run dev` once to enable the new behavior. Refreshing the React page alone cannot update an old main process.

A startup capability check and main-process version handshake prevent a newer renderer from using an outdated desktop bridge. If the app asks to restart, quit/reopen it (or restart the dev command). This leaves saved data untouched. CV previews now show a retryable error when loading fails, including actionable instructions for stale bridges.
