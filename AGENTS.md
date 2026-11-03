# CraftCV agent instructions

- Read `docs/handoff.md` and `docs/architecture.md` before changing code. The handoff is the canonical shared context for Claude Code and Codex; private memory and chat history are not.
- Before ending material work, refresh `docs/handoff.md`: current state, active work, decisions and reasons, checks run, and the exact next step. Keep it current rather than appending a diary.
- Preserve work already present in the filesystem. This checkout currently has no Git metadata, so do not assume `git diff` can identify another agent's changes.
- Never put secrets, credentials, access tokens, raw provider responses, or private chat transcripts in the shared context.
- The `heroui-react` MCP server is configured for this project in `.mcp.json` (Claude Code) and `.codex/config.toml` (Codex).
- Use the `heroui-react` MCP server as the source of truth before installing, updating, or implementing HeroUI components.
- This app uses HeroUI v3, React 19, and Tailwind CSS v4. Do not introduce HeroUI v2 APIs or a HeroUI provider wrapper.
- Check `list_components`, then read the selected component documentation before changing a HeroUI component.
- Run `npm run check` after code changes. Run `npm run test:integration` when a user flow, IPC contract, preload bridge, persistence, import/export, or Electron behavior changes.
