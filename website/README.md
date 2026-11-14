# CraftCV website

The public landing page for CraftCV: a Next.js 16 app (TypeScript, HeroUI v3, Tailwind CSS v4, Iconify) in the desktop app's own theme, hosted on Vercel. The pages are prerendered; two small API routes let visitors star the repository from the site. It is its own project, hosted separately from the desktop app and never packaged with it.

## Develop

```sh
cd website
npm install
cp .env.example .env.local   # optional: the GitHub App keys for starring (see below)
npm run dev                  # http://localhost:3000
npm run build && npm run start
npm run typecheck && npm run lint
```

Without the keys, everything works except starring in place: the star button then opens the repository on GitHub.

## Host on Vercel

1. **Import the repository** in Vercel. Set the root directory to `website`, keep framework Next.js and the default build.
2. **Add the environment variables** `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from the GitHub App below, for Production and Preview.
3. **Use a domain at its root.** Links start at the site root (`/download/`, `/logo.svg`), so serve the site at a domain's root, not under a sub-path.

## Starring from the site

The star button in the nav shows the repository's live star count. Pressing it opens GitHub's sign-in in a popup; once the visitor approves, `src/app/api/github/callback` stars the repository as them. The route then revokes the token, so the site never keeps one, and the count goes up. If the browser blocks popups, the same flow runs in the tab and returns to the home page. A visitor who has starred sees "Starred", and the button then opens the repository.

It uses a **GitHub App**, not an OAuth App. A GitHub App can ask for the Starring permission alone; an OAuth App would need the `public_repo` scope, which also grants write access to the visitor's public repositories. To set it up:

1. **Create the app:** GitHub, then Settings, Developer settings, GitHub Apps, New GitHub App.
2. **Callback URL:** `https://<your-domain>/api/github/callback/`. Add `http://localhost:3000/api/github/callback/` too for local testing; the trailing slash matters.
3. **Other settings:** leave "Request user authorization (OAuth) during installation" off and turn the webhook off. "Expire user authorization tokens" can stay on; each token is revoked straight after its one star anyway.
4. **Permissions:** Account permissions, Starring, Read and write. Nothing else.
5. **Who can install it:** "Any account".
6. **Keys:** copy the Client ID and generate a client secret. These are `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`; keep them in Vercel's settings or `.env.local`, never in the repository.

## Sky

The hero, the download page, the feature cards and the before-and-after panel use one cloud photograph, `public/sky/clouds-photo.jpg`, supplied by the project owner. `SkyScene` shows it still, with a soft scrim behind the words and a fade into the page.

## The home page

`/` (`src/app/page.tsx`) is in an editorial style modelled on diabrowser.com's home page, in CraftCV's own colours:

- **Hero:** the sky and the fanned CVs, one serif line, and the name set huge in Instrument Serif italic behind them.
- **Download dome (`DownloadDock`):** a white dome held at the foot of the screen, which lands above the footer.
- **How it works (`FeatureList`):** a sticky list beside real app screenshots from `public/app/` in `AppWindow` frames.
- **Before and after:** the pinned before-and-after diff (`Compare`).
- **Feature cards:** the cards on the cloud photograph (`CardMocks`: the template sheets, the action pills and the live applications board).
- **Privacy:** the dotted privacy panel.
- **Nav (`Nav`) and footer (`Footer`, with the `Stamp`):** shared with the download page; the footer ends in the fading wordmark.

Its styles are in `src/app/site.css`, scoped under `.site`; `src/app/globals.css` holds the tokens and the shared base (hero sky, CV stack, before-and-after, release page). Fonts: Instrument Serif, Newsreader, Inter and JetBrains Mono, all SIL OFL through `next/font`. The logo is `public/logo.svg`: the Instrument Serif italic C holding a CV, on a sky tile. A first landing page in another style was removed on 2026-11-13; `/v2/` redirects to `/` (`next.config.ts`).

## Code layout

- `src/app`: the pages (`page.tsx`, `download/page.tsx`), the root layout, the GitHub API routes, and the two stylesheets.
- `src/components`: one component per file, named for what it shows.
  - `Ico` resolves an Iconify icon on the server.
  - `star-icons.tsx` hands ready-made icons to the client nav.
- `src/lib`:
  - `site.ts`: the repository's URLs, named once.
  - `releases.ts`: reads GitHub releases, cached for ten minutes.
  - `github-app.ts`: the starring flow.
  - `icons.ts`: the bundled Iconify data.
  - `use-scroll-frame.ts`: runs an update once per animation frame on scroll and resize; used by `ScrollScenes` and `DownloadDock`.

## Download page

`/download/` (`src/app/download`, `src/components/Release.tsx`) reads the repository's releases from the GitHub API in the browser when the page opens. It caches the answer in session storage for ten minutes, to stay well under GitHub's 60-requests-an-hour limit for visitors who aren't signed in.

- **Files:** it matches each build by the file names `electron-builder.yml` sets (`-mac-arm64.dmg`, `-mac-x64.dmg`, `-linux-x86_64.AppImage`) and marks the visitor's platform as recommended.
- **No release yet:** it shows "Coming soon".
- **GitHub unreachable:** it links to the releases page on GitHub instead.

Every "Download" button on the site points here.

## App screenshots

The screenshots in `public/app/` come from the capture scripts (`scripts/capture-app.mjs`, `scripts/encode-app.sh`). They drive the built app with made-up demo content in a throwaway data folder.

## Avatars

The hero CVs show drawn faces from DiceBear's Notionists style (artwork by Zoish, CC0 1.0; the `@dicebear` code is MIT). They were generated once with `@dicebear/core` 9 and `@dicebear/notionists` 9.4.2 (seeds `alex-3`, `alex-6`, `sam-6`; `scale: 150`, `translateY: 14`, background `#e8f2fc`) and saved to `public/avatars/`, so the page loads nothing from a third party. Neither package is a dependency of the site.

## Notes

- **Icons:** Iconify data is resolved at build time from the bundled `@iconify-json/*` collections (`src/lib/icons.ts`), so the page never calls the Iconify API.
- **Hover layer:** `src/styles/motion.css` is the design-taste skill's hover and press layer, unchanged.
- **Claims:** the page only claims what the app ships today. Keep it in step with the root README.
