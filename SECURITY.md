# Security policy

CraftCV 0.1 is an early desktop application. Security fixes are developed for the latest release.

Do not disclose personal CV data, API keys, or private repository contents in public issues. Report reproducible vulnerabilities through the repository's GitHub private vulnerability reporting feature when enabled. If it is unavailable, ask the maintainers for a private reporting channel without posting exploit details or secrets.

The renderer is sandboxed and context-isolated. Main validates IPC payloads and trusted sender frames. Only native-dialog-selected repositories can be scanned. API keys and ChatGPT OAuth tokens are protected through the OS credential service and never stored in SQLite or exposed to the renderer. CraftCV does not read Codex authentication files. Application documents and source caches are plaintext local data; disk encryption and backup protection are the user's responsibility.

Source filters and claim checks are defense in depth, not secret-detection or correctness guarantees. Review every snippet before cloud sharing. Untrusted PDF/DOCX parsers run on-demand in bounded workers, but worker threads are not an OS security sandbox; only import documents you trust. Report parser crashes and unexpected data access.

Release checklist: update supported dependencies, review `npm audit`, run packaged integration tests on each OS, verify native SQLite ABI, sign/notarize official installers, and publish accurate performance measurements. No telemetry or automatic updates are implemented in this milestone.
