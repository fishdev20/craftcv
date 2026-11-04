# Security policy

CraftCV 0.1 is an early desktop application. Security fixes are developed for the latest release;
older versions are not supported with security patches.

## Reporting a vulnerability

Do not disclose personal CV data, API keys, private repository contents, or exploit details in a
public issue. Use
[GitHub private vulnerability reporting](https://github.com/fishdev20/craftcv/security/advisories/new).
Include the affected version, operating system, impact, reproduction steps, and a minimal proof of
concept without real personal data. You should receive an acknowledgement within seven days. Please
allow time for a fix and coordinated disclosure before publishing details.

For ordinary bugs that do not have a confidentiality or security impact, use the public bug report
template instead.

## Security model

The renderer is sandboxed and context-isolated. Main validates IPC payloads and trusted sender frames. Only native-dialog-selected repositories can be scanned. API keys and ChatGPT OAuth tokens are protected through the OS credential service and never stored in SQLite or exposed to the renderer. CraftCV does not read Codex authentication files. Application documents and source caches are plaintext local data; disk encryption and backup protection are the user's responsibility.

Source filters and claim checks are defense in depth, not secret-detection or correctness guarantees. Review every snippet before cloud sharing. Untrusted PDF/DOCX parsers run on-demand in bounded workers, but worker threads are not an OS security sandbox; only import documents you trust. Report parser crashes and unexpected data access.

See [the security model](docs/security-model.md) for trust boundaries, protected assets, and known
limitations.

## Release expectations

Maintainers update supported dependencies, review dependency and CodeQL findings, run integration
tests against the production build, smoke-test packaged artifacts, verify the native SQLite ABI,
sign/notarize official installers, and
publish checksums and build provenance. No telemetry or automatic updates are implemented in this
milestone.
