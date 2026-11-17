# Architecture & file guide

Know Thyself is a static single-page app built with TanStack Start
(file-based routing on React + Vite). There is no server: after the initial
HTML loads, everything runs in the browser and reads/writes the device's
`localStorage` (plus optional Lovable Cloud sync when signed in).

```
├── public/                  # static assets copied verbatim into the build
│   ├── icon-192.png         # home-screen icon, 8-pointed star on the sky
│   ├── icon-512.png         # large icon (also used as maskable)
│   ├── know-thyself-icon.svg# vector source of the icon
│   ├── manifest.webmanifest # PWA name/icons/colors ("Know thyself")
│   ├── sw.js                # minimal service worker (network passthrough,
│   │                        #  exists so browsers offer "Add to Home Screen")
│   ├── favicon.ico
│   ├── robots.txt
│   └── _redirects           # SPA fallback rule for the host
├── scripts/
│   ├── deploy.sh            # build:pages → publish dist/ to gh-pages
│   └── spa-postbuild.js     # writes dist/index.html + 404.html for SPA mode
├── src/
│   ├── routes/              # one file per URL (file-based routing)
│   ├── components/          # reusable UI (cards, dialog, header…)
│   ├── lib/                 # state stores, domain logic, i18n, design tokens
│   ├── hooks/               # location hook
│   ├── test/                # Vitest suites
│   └── styles.css           # design tokens + all hand-written CSS
└── docs/                    # this guide and data-formats.md
```

## Routes (`src/routes/`)

Each file exports a `Route` with page-specific `<head>` metadata and a
component. `__root.tsx` is the shell for all of them.

| File            | URL        | Purpose |
| --------------- | ---------- | ------- |
| `__root.tsx`    | (shell)    | `<html>` scaffold, global head links (fonts, manifest, icons), loads `initLoadAnim()`, registers the service worker, decides whether the landing page or the app chrome shows. |
| `index.tsx`     | `/`        | The cover — renders the diary's front matter (the nav's "Cover" item points here). |
| `cover.tsx`     | `/cover`   | Cover content (date & time, moon/sun positions, location, privacy notice), also embedded by the home page. |
| `body.tsx`      | `/body`    | Body tracker: tappable silhouette map (compact frame on phones so the page scrolls around it), region list, recent body notes. |
| `diary.tsx`     | `/diary`   | Mind diary: daily reflection composer + gratitude and feelings cards + recent entries. Editing supports deep links (`/diary#<entryId>`). |
| `spirit.tsx`    | `/spirit`  | Spirit diary: spiritual-practice composer (16-practice catalog, shaded chips, one practice entry per date) + dream composer (multi-select dream types) + recent entries. |
| `insights.tsx`  | `/insights`| Moon/sun card (side-by-side at every breakpoint), gentle suggestions (max 4 visible), centered stat cards (Recorded Moods, Spiritual practices with a "days of practice of days journaling" span, Dream patterns), attention bars, body map (display-only). |
| `log.tsx`       | `/log`     | "My Diary Entries": everything merged, each card prefixed with its diary's icon (person standing / brain / moon star), `?filter=body|mind|dream` pre-selects a tab, sort toggle, "Save as PDF" (window.print with print-only CSS). |
| `overview.tsx`  | `/overview`| Printable summary (table + stats) to share with a professional. |
| `auth.tsx`, `reset-password.tsx` | | Sign-in flows (optional cloud sync). |

Navigation order everywhere (desktop bar + mobile bottom nav): **Cover →
Insights → Entries → New Entry** (New Entry opens the diary-chooser sheet).

## Components (`src/components/`)

- **`AppHeader.tsx`** — the slim sky-colored nav bar (sticky, compacts on
  scroll with hysteresis, never wraps on mobile), plus exported pieces:
  `MoonGlyph`, `SunGlyph`, `EightStar`, `skyMove` (pointer-reactive sky
  gradient) and `SettingsMenu` (gear dropdown: backup, load backup, language,
  zodiac system, sky theme, chakra singing bowls).
- **`JournalComposer.tsx`** — the mind/spirit entry flow (create button → form;
  kind is fixed per page: daily, gratitude, feelings on Mind; dream, practice
  on Spirit). Handles create, edit, delete-with-confirm, date sub-step, and
  shows a live astrology line. Dream types are checkbox chips (multi-select);
  practices are large outlined chips that fill with their shade when selected.
- **`EntryDialog.tsx`** — the 5-step body-entry wizard (where & when →
  pain/pleasure → intensity bubbles → notes → anything-else factors grouped
  in three rows + photo), with progress dots, back navigation and inline
  delete confirm.
- **`EntryCard.tsx` / `JournalCard.tsx`** — the two card types (body vs.
  mind/spirit). Both share the same width, tag chips, neutral underlined
  text-link edit/delete affordances and the unified astrology line; on the
  Entries page each card also shows its diary's icon (`icon` prop).
- **`StatusToast.tsx`** — centered frosted-glass confirmation pop-up
  ("Your [type] was saved/updated/deleted"); dismisses on outside tap, ✕,
  or a 6-second timeout.
- **`AstroLine.tsx`** — the single source of the card astrology text:
  `<phase> <moon glyph> <moon sign> moon · <sun glyph> <sun sign> sun`
  (new moons read just "New"). Reacts to the zodiac system setting.
- **`BodyMap.tsx`** — interactive SVG silhouette (reference-traced contours
  from `lib/body-outline.ts`) with chakra-colored auras per region.
- **`EntryDialog`/`JournalComposer` confirm flows** share the amber
  `confirm-warning` inline pattern.
- **`SkyToggle.tsx`** — the sky-theme picker (cosmic/prism/chakra/custom
  gradient) stored per device.
- **`ui/*`** — small shadcn/Radix primitives (dropdown menu, button, dialog…).

## Libraries (`src/lib/`)

- **`entries.ts`** — body-diary store (`knowthyself.entries.v2`), FACTORS and
  their dialog groups, recency-weighted `regionScores`, backup export/import.
- **`journal.ts`** — mind/spirit store (`knowthyself.journal.v1`): five entry
  kinds (daily, gratitude, feelings, dream, practice), MOODS and their pastel
  `MOOD_COLORS`, dream-type shades, multi-select/legacy migrations, and
  mind-body cross analysis.
- **`practices.ts`** — the 16-item spiritual-practice catalog, legacy id
  mapping, and the interpolated chip shade/tint helpers.
- **`status.ts`** — the confirmation-toast store (`showStatus`).
- **`astro.ts`** — local astronomy: sun/moon longitudes, moon phase,
  illumination, next moon event, next sun-sign change, sidereal (Lahiri) vs
  tropical zodiac switch (`knowthyself.zodiac`).
- **`i18n.tsx`** — every user-facing string, English + Spanish (es-MX).
  Components never hardcode text.
- **`regions.ts`** — body region coordinates (200×460 viewBox), sides, chakra
  mapping.
- **`body-outline.ts`** — traced vector contours (silhouette, outline, hit
  area) used by the cover art and the body map.
- **`suggestions.ts`** — data-driven gentle suggestions (doctor/care/gentle).
- **`sugg-queue.ts`** — the 4-visible / 3-hour-refill suggestion queue
  (`knowthyself.sugg.v1`).
- **`load-anim.ts`** — port of Neale Van Fleet's CodePen load-animation
  system: tags page elements with staggered keyframes (skips reduced-motion,
  faint background art and menus).
- **`soundbowls.ts`**, **`seed.ts`** — chakra bowl audio state; sample data
  loader (now only reachable from code, the settings UI options were removed).
- **`use-location.ts`** (`hooks/`) — opt-in geolocation → OpenStreetMap
  Nominatim city/state/country lookup; only the resolved place *name* is kept
  (`knowthyself.place`), never coordinates, never synced.

## Design system (`src/styles.css`)

- Tokens in `:root`: paper/ink palette, `--sun`, `--moss`, `--btn-orange`,
  `--btn-red`, sky theme variables, and the signature shape
  (`--card-radius: 0.25rem 1.6rem 1.6rem 0.4rem` — square-ish left, rounded
  right; `--btn-radius` for buttons; inputs/dialogs follow).
- Utility classes: `.paper-card`, `.btn-primary/ghost/subtle`, `.tag`
  (neutral chips; mood chips override the background per mood), `.chip`
  with `.chip-lg` (creation cards, large outlined Unbounded chips that
  invert to their shade color when selected) and `.chip-sm` (saved-entry /
  stat chips, small filled Unbounded chips in deepened tints), `.input`,
  `.field`, `.sugg-card` (suggestion accent), `.intensity-*`,
  `.confirm-banner/.confirm-warning`, `.nav-*`, `.sky-band`.
- The `.sky-band` bg-pan animation (cover + desktop navigation): the
  sky's color gradient drifts slowly side-to-side (45s ease-in-out
  alternate) in whatever theme/colors settings chose; the grain and
  pointer-glow layers stay anchored, and `prefers-reduced-motion` turns it
  off.
- The load-animation keyframes (fade/pop/blur/glow/grow/splat/roll/flip/
  spin/slide/drop) ported from Neale Van Fleet's CodePen, with a
  `prefers-reduced-motion` off-switch.
- Print rules: on `/log` the `.print-log` block strips backgrounds, buttons,
  images and links so "Save as PDF" captures compact text-only entries.

## State & persistence

All data lives in the browser (`localStorage`) via tiny
`useSyncExternalStore` stores — no global state library. Keys and data shapes
are documented in [`data-formats.md`](data-formats.md). Optional cloud sync
(when signed in through Lovable Cloud) mirrors the same records per user;
components never touch the database directly — always through
`entries.ts` / `journal.ts`.

## Tests (`src/test/`)

Vitest + Testing Library: dream-journal flow, card deletion confirmation
(walks the body-entry wizard), and others. `bun run test` must stay green
before every push.
