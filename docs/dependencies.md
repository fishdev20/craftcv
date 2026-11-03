# Dependency verification

Verified 2026-11-02 with npm registry `npm view <package> version`, engine/peer metadata, and official documentation before installation. Exact versions and transitive integrity hashes are recorded in package.json and package-lock.json.

Selected current stable versions include Electron 45.2.1, electron-vite 6.0.0, electron-builder 26.18.0, React 19.3.1, Vite 8.3.5, Tailwind 4.3.3, HeroUI 3.2.7, better-sqlite3 13.0.3, and Zod 4.6.7. TypeScript 7.0.2 was the newest stable but incompatible with typescript-eslint's `<6.1.0` peer requirement; selected 6.0.3, the newest compatible stable. No force/legacy peer install was used.

Official references consulted:

- [electron-vite setup and process builds](https://electron-vite.org/guide/)
- [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [HeroUI React quick start](https://heroui.com/docs/react/getting-started/quick-start)
- [Tailwind CSS Vite plugin](https://tailwindcss.com/docs/installation/using-vite)
- [OpenAI structured responses](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)

`npm audit --omit=dev` reported zero known vulnerabilities at implementation time. The full development dependency tree reported 25 moderate findings, including tooling transitive glob/minimatch dependencies. No automatic breaking downgrade or unverified override was applied. Re-run audits when releasing; audit results are time-sensitive.

The local document editor adds Tiptap 3.32.2 (React, core, ProseMirror, StarterKit, tables, text style, text alignment), verified against npm engine/peer metadata and [official React setup](https://tiptap.dev/docs/editor/getting-started/install/react), [table](https://tiptap.dev/docs/editor/extensions/nodes/table), and [text style](https://tiptap.dev/docs/editor/extensions/functionality/text-style-kit) documentation. All Tiptap packages are pinned to the same version and editor code is route-split. This supersedes the original avoidance of a rich editor because the user explicitly requested full local document editing.

Icons use Iconify: `@iconify/react` 6.0.4 (offline entry point, `@iconify/react/offline`, which contains no API loader) and `@iconify-icons/lucide` 2.0.26 per-icon data modules, replacing `lucide-react`. Only the icons registered in `src/renderer/icons.ts` are bundled, and nothing is fetched from the Iconify API at runtime, keeping the renderer offline. `tests/icons.test.ts` fails if the renderer references an unregistered icon.
