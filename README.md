# Know Thyself — a private body, mind & spirit diary

A local-first diary web app. Every note — body sensations, mind reflections,
dreams, moods, moon phases — is stored on your own device. No account is
required, nothing is sent anywhere, and you can download your whole diary as a
JSON backup at any time.

**Live app**: https://twentysixmoons.github.io/know-thyself-app/

Built with [TanStack Start](https://tanstack.com/start) (React + TypeScript +
Vite), styled with Tailwind CSS v4 tokens and a hand-rolled design system, and
deployed as a fully static single-page app on GitHub Pages.

---

## Features

- **Cover page** — the diary's front matter: current date & time, sidereal moon
  & sun positions, your location name, and a privacy notice.
- **Body diary** — tap the traced body silhouette to log a sensation. A
  5-step wizard asks where & when, pain or pleasure, intensity, what you feel,
  and anything else (sleep, water, alcohol, period, injury…). On phones the
  silhouette frame is compact so the page scrolls easily around it.
- **Mind diary** — write a daily reflection with a headline, gratitude list,
  mood chips and an optional photo; gratitude and feelings can also be saved
  as their own quick entries.
- **Spirit diary** — record dreams with multi-select types (standard, lucid,
  nightmare, recurring…) and key symbols, and log the day's spiritual
  practices (meditation, yoga, tai chi, qi gong, sound bath, altar work,
  time in nature, breathwork and more) with a free-text note — one practice
  entry per date.
- **Insights** — patterns across everything, all centered: areas asking for
  attention, left vs. right side balance, Recorded Moods, Spiritual
  practices ("N days of spiritual practice of M days" journaling), Dream
  patterns, gentle suggestions you can dismiss, and a live moon-phase /
  sun-sign card.
- **My Diary Entries** — every note in one place, each card tagged with the
  icon of the diary it came from (body / mind / spirit), sortable
  newest/oldest, filterable by diary, and printable as a clean text-only PDF.
- **Navigation** — Cover → Insights → Entries → New Entry (the New Entry
  pill opens a chooser for body / mind / spirit).
- **Astrology** — computed locally (no external API) with sidereal (Lahiri
  ayanamsa) or tropical zodiac, selectable in settings.
- **Living sky** — the cover and desktop navigation carry a slow bg-pan
  animation that drifts through whichever sky theme (and custom colors)
  you've chosen in settings.
- **Installable** — add it to a phone's home screen ("Know thyself", yellow
  8-pointed star on the cosmic-sky background).
- **Bilingual** — every string is available in English and Spanish (es-MX).
- **Private by design** — data lives in your browser's local storage; the only
  network calls are fonts, the map-name lookup (no coordinates stored), and
  the optional cloud sync when you sign in.

---

## Running the app

Prerequisites: [Bun](https://bun.sh) 1.x (or Node 20+ with npm) and Git.

```sh
git clone https://github.com/twentysixmoons/know-thyself-app.git
cd know-thyself-app
bun install            # or: npm install
bun run dev            # or: npm run dev  → http://localhost:5173
```

### Scripts

| Command                 | What it does                                                                 |
| ----------------------- | ---------------------------------------------------------------------------- |
| `bun run dev`           | Start the dev server with hot reload.                                        |
| `bun run build`         | Production build for a site root (`dist/`).                                   |
| `bun run build:pages`   | Production build with the `/know-thyself-app/` base path (GitHub Pages).      |
| `bun run preview`       | Serve a build locally (`vite preview`).                                       |
| `bunx vite preview --base /know-thyself-app/` | Preview the Pages build exactly as deployed. |
| `bun run test`          | Run the Vitest suite (`src/test/`).                                           |
| `bun run lint`          | ESLint.                                                                       |
| `bun run deploy`        | Build for Pages **and** publish to the `gh-pages` branch (live in ~1 min).     |

### Deploying

`bun run deploy` runs `scripts/deploy.sh`, which:

1. builds with the Pages base path into `dist/`,
2. checks out the `gh-pages` branch into a temporary worktree,
3. wipes it and copies the fresh `dist/` in,
4. commits and pushes `gh-pages`, which GitHub Pages serves.

**Live in about a minute** after the push. `main` always holds the source;
`gh-pages` holds only build artifacts.

### Local preview after a build

```sh
bun run build:pages
bunx vite preview --base /know-thyself-app/
# → http://localhost:4173/know-thyself-app/
```

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — every file and folder, what
  it does, and how the pieces connect (routing, state, design system).
- [`docs/data-formats.md`](docs/data-formats.md) — the exact shape of stored
  diary entries, dream entries, settings keys, and the backup file format.

---

## Built with Lovable

This project was originally scaffolded with [Lovable](https://lovable.dev).
The Lovable editor remains connected to `main`: changes pushed to `main` sync
back into the editor, and schema/migration changes flow the other way.

Database note: when signed in, notes sync through Lovable Cloud; the app
itself never talks to the database directly — all access goes through
`src/lib/entries.ts` and `src/lib/journal.ts`.
