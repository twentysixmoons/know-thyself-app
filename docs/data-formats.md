# Data formats & storage

Everything the diary stores lives in the browser's `localStorage` on the
device. Nothing is sent anywhere unless the user signs in (optional
Lovable Cloud sync) or actively downloads/loads a backup file.

## Storage keys

| Key                        | Contents                                            |
| -------------------------- | --------------------------------------------------- |
| `knowthyself.entries.v2`   | Body diary notes (JSON array of `Entry`).           |
| `knowthyself.entries.v1`   | Legacy body notes, migrated once on first read.     |
| `knowthyself.journal.v1`   | Mind diary entries (JSON array of `JournalEntry`) — daily reflections, gratitude, feelings, dreams, and spiritual practices. |
| `knowthyself.practices.v1` | Legacy standalone practices store, auto-migrated into the journal as `practice` entries and removed (guarded by the flag below). |
| `knowthyself.practices.migrated` | `"1"` once the legacy practices store has been merged into `knowthyself.journal.v1`. |
| `knowthyself.place`        | Resolved place **name** only (never coordinates).   |
| `knowthyself.zodiac`       | `"sidereal"` (default) or `"tropical"`.             |
| `knowthyself.sky`          | Chosen sky theme.                                   |
| `knowthyself.cycle`        | Legacy cycle-tracking flag (unused since the cycle card now keys off "On my period" entries). |
| `knowthyself.sugg.v1`      | Gentle-suggestion queue: `{ active, pending, hidden, nextPromote }`. |

## Body entry (`Entry`)

Stored in `knowthyself.entries.v2`, one JSON object per note:

```jsonc
{
  "id": "0189…",              // crypto.randomUUID()
  "date": "2026-11-14",       // ISO date (the note's own date, not creation time)
  "region": "kneeL",          // RegionId — see regions list below
  "intensity": 3,             // 1–5
  "kind": "body",             // "body" | "mind" | "spirit" (dialog entries are "body")
  "feeling": "pain",          // "pain" | "pleasure" — older entries read as "pain"
  "notes": "Slipped on the garden steps…",  // ≤ 2000 chars
  "factors": ["fall", "poorSleep"],          // subset of FACTORS
  "image": "data:image/jpeg;base64,…",       // optional, downscaled to ≤640px
  "createdAt": 1731600000000  // ms timestamp — used for ordering in My Diary Entries
}
```

**Factors** (`FACTORS` in `src/lib/entries.ts`), grouped in the wizard as:

1. `lowWater` (Little water), `alcohol` (Drank alcohol), `smoked` (Smoked)
2. `poorSleep` (Poor sleep), `goodSleep` (Good sleep), `meditation` (Meditation / prayer)
3. `period` (On my period), `exercise` (Exercised), `stress` (Stress), `fall` (Injury)

**Regions** (`RegionId` in `src/lib/regions.ts`): `head`, `neck`,
`shoulderR/L`, `chest`, `upperBack`, `stomach`, `lowerBack`, `pelvis`,
`armR/L`, `elbowR/L`, `forearmR/L`, `handR/L`, `hipR/L`, `kneeR/L`,
`footR/L`, and `general`. Suffix `L`/`R` marks body sides (mirror view).
`upperBack`, `lowerBack` and `general` are list-only (no tap target).

## Mind & spirit diary entries (`JournalEntry`)

Stored in `knowthyself.journal.v1`. The `kind` field selects what the entry
carries — a missing kind means `daily` (old entries):

| kind          | Written from        | Carries                                              |
| ------------- | ------------------- | ---------------------------------------------------- |
| `daily`       | Mind page           | `title`, `text`, `gratitude`, `moods`, `image`       |
| `gratitude`   | Mind page           | `gratitude` list only (standalone, delete-only)      |
| `feelings`    | Mind page           | `moods` list only (standalone, delete-only)          |
| `dream`       | Spirit page         | `dreamTypes` (multi), `symbols`, `text`              |
| `practice`    | Spirit page         | `practices` list + optional free-text note; one per date (re-saving updates it) |

```jsonc
{
  "id": "0189…",
  "date": "2026-11-14",
  "kind": "dream",            // "daily" | "dream" | "gratitude" | "feelings" | "practice" | undefined (= daily, old entries)
  "title": "Quiet morning",   // optional, ≤ 120 chars (daily/dream)
  "text": "Woke up slowly…",  // ≤ 5000 chars
  "gratitude": ["Tea in bed", "…", "…"],     // daily + gratitude entries, up to 3 × 300 chars
  "moods": ["calm", "grateful"],             // subset of MOODS (daily, feelings)
  "image": "data:image/jpeg;base64,…",       // optional, ≤ 900px (daily)
  "dreamTypes": ["lucid", "vivid"],  // dream entries only — multi-select, see types below
  "practices": ["meditation", "yoga"], // practice entries only — subset of PRACTICES
  "symbols": ["flying", "…"], // dream entries only, ≤ 12 × 80 chars
  "createdAt": 1731600000000
}
```

Old entries with a single `dreamType` are migrated on read into a
`dreamTypes` array; the legacy `knowthyself.practices.v1` store is migrated
once into `practice` journal entries (flag `knowthyself.practices.migrated`).

**Dream types** (`DREAM_TYPES`, multi-select): `standard`, `lucid`,
`nightmare`, `recurring`, `falseAwakening`, `vivid`, `progressive`,
`prophetic` (displayed as "Precognitive").

**Practices** (`PRACTICES` in `src/lib/practices.ts`): `meditation`, `yoga`,
`taiChi`, `qiGong`, `soundBath`, `altarWork`, `nature`, `breathwork`,
`gardening`, `divination`, `skyGazing`, `journaling`, `cleansing`,
`singing`, `dancing`, `art`. Legacy ids (`meditated`, `altar`,
`cleanedSpace`, `danced`) map through `LEGACY_PRACTICE_MAP`. Each practice
gets a chip shade interpolated `#351969` → `#691954` by catalog position
(`practiceShade`), reused for chips and glows.

**Moods** (`MOODS`): `calm`, `happy`, `grateful`, `confident`, `sad`,
`angry`, `anxious`, `numb`, `neutral` — plus display-only extras
(`joyful`, `reflective`, `tired`, `overwhelmed`) for older data. Each mood
has a fixed pastel color in `MOOD_COLORS`, reused on chips and the
Insights mood bar (stat chips render a deepened tint: the color mixed
with ink for light text).

## Backup file

"Download my diary backup" (settings) writes `know-thyself-backup-YYYY-MM-DD.json`:

```jsonc
{
  "app": "know-thyself",
  "version": 2,
  "body":  [ /* Entry[]  — the full body diary */ ],
  "journal": [ /* JournalEntry[] — reflections + dreams */ ]
}
```

"Load backup" accepts this format **and** older backups:

- an array at the top level (v1, body entries only),
- `{ body, journal }` (v2, current).

On import, entries are merged by `id` (valid UUIDs keep their identity,
invalid ones are re-uuid'd), so loading a backup adds/updates without
duplicating what's already on the device.

## Astrology

`src/lib/astro.ts` computes everything locally (~1° precision, no API):

- `astroFor(date, mode)` → sun sign, moon sign, phase (8 phases),
  illumination, waxing/waning, solar-eclipse proximity.
- `mode` = `"sidereal"` (Lahiri ayanamsa, the default) or `"tropical"`,
  chosen in settings (`knowthyself.zodiac`) — every astrology display in the
  app re-renders when it changes.
- `nextMoonEvent()` → days to the next new/full moon; `nextSunSign()` → days
  until the sun enters the next sign.

## i18n

All user-facing strings live in `src/lib/i18n.tsx` (`en` + `es` dicts, es
formatted as es-MX). New strings must be added to both dictionaries —
TypeScript enforces it because `es` is typed as `typeof en`.

## PWA files (`public/`)

- `manifest.webmanifest` — name **"Know thyself"**, standalone display,
  theme `#1a0f24`, icons below.
- `know-thyself-icon.svg` / `icon-192.png` / `icon-512.png` — the yellow
  8-pointed star (same geometry as the in-app `EightStar`) centered on the
  cosmic-sky gradient.
- `sw.js` — minimal install-enabling service worker; a network passthrough
  with a cache fallback, no data handling.
