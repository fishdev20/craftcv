# Security model

CraftCV is a local-first Electron desktop application. Its main security goal is to let someone use
CVs, job descriptions, and selected source repositories without silently exposing those assets or
granting web content desktop privileges.

## Protected assets

- CVs, generated documents, job descriptions, application history, and evidence snapshots.
- Source files inside folders explicitly selected through a native dialog.
- OpenAI and Anthropic API keys and ChatGPT authorization tokens.
- The user's filesystem, local network, clipboard, and operating-system permissions.

## Trust boundaries

- The renderer is untrusted. It is sandboxed and context-isolated, has no Node.js integration, and
  can reach the main process only through the finite preload API.
- Every IPC request is schema-validated and accepted only from the main window's top frame at the
  expected application URL.
- Filesystem paths originate in native open/save dialogs. Renderer requests use stored IDs rather
  than arbitrary paths.
- Repository contents, imported documents, job pages, and AI replies are untrusted input. Scans and
  parsers are bounded; provider replies must pass strict schemas; generated claims still require
  evidence and human approval.
- Cloud use is optional and consent-gated. The preview and documented limits describe what leaves
  the device. Provider retention and billing policies remain outside CraftCV's control.

## Desktop and web-content controls

The application denies permission requests, new windows, webviews, and navigation in its main
window. The fallback job-posting window has no preload, uses a sandboxed in-memory session, denies
permissions and downloads, and accepts HTTPS pages only. It exists solely because some job boards
cannot be imported through bounded HTTP requests; closing CraftCV destroys that session.

Official packages enable Electron fuses that disable `ELECTRON_RUN_AS_NODE`, Node CLI inspection,
and `NODE_OPTIONS`, require the packaged ASAR, and validate ASAR integrity where Electron supports
it. The renderer still loads from `file://` inside that ASAR, so its file-protocol compatibility fuse
remains enabled; navigation is locked to the application document. The renderer also uses a
restrictive Content Security Policy with no remote scripts, frames, forms, objects, or network
connections.

## Storage

Application content is stored in plaintext SQLite and bounded cache files under Electron's local
application-data directory. API keys and renewable authorization tokens are stored separately using
Electron `safeStorage`; CraftCV refuses Linux's insecure `basic_text` backend. Users should enable
full-disk encryption and protect backups. Deletion is logical, not forensic secure erasure.

## Known limitations

- Document parser workers limit time and memory but are not operating-system sandboxes.
- Secret filtering before AI requests is defense in depth, not a guarantee. Users must inspect the
  preview before consenting.
- The job importer checks public DNS addresses before requests and redirects, but DNS rebinding
  cannot be completely prevented without pinning the resolved address.
- The fallback job window renders remote web content inside Electron. It is sandboxed and has no
  desktop bridge, but inherits Chromium's ordinary remote-content risk.
- The packaged renderer still uses Electron's `file://` loader. Moving it to a standard secure
  custom protocol would allow the remaining file-protocol compatibility fuse to be disabled.
- Unsigned macOS development builds trigger operating-system warnings. Official public releases
  should be signed and notarized before maintainers publish them.

## Verification

CI runs formatting, context validation, workflow pin checks, TypeScript, ESLint, unit tests,
production builds, dependency audits, CodeQL, and dependency review. It builds packages and runs the
Electron integration flows on Linux, macOS, and Windows; maintainers also smoke-test packaged
artifacts before a release. Release tags rerun the application and integration checks before
building installers. Published installers include checksums and GitHub build-provenance
attestations.
