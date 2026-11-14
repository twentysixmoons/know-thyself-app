import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { EntryCard } from "@/components/EntryCard";
import { EntryDialog } from "@/components/EntryDialog";
import { exportEntries, importEntries, regionScores, sortByDate, useEntries, type Entry } from "@/lib/entries";
import { REGIONS, type RegionId } from "@/lib/regions";
import { suggestions } from "@/lib/suggest";
import { useI18n } from "@/lib/i18n";
import { journalSnapshot, mindBody, restoreJournal, useJournal, MOOD_COLORS, MOOD_NEUTRAL } from "@/lib/journal";
import { JournalCard } from "@/components/JournalCard";
import { astroFor, nextMoonEvent, nextSunSign, useZodiac } from "@/lib/astro";
import { MoonGlyph, SunGlyph } from "@/components/AppHeader";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Know Thyself" },
      { name: "description", content: "See which body areas need attention, left vs. right, cycle and moon-phase patterns, plus gentle suggestions." },
      { property: "og:title", content: "Insights — Know Thyself" },
      { property: "og:description", content: "Patterns across your body diary, guided by the moon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-base"><span className="capitalize">{label}</span><span>{value}</span></div>
      <div className="mt-1 h-3 rounded-full bg-ink/10" aria-hidden="true"><div className="aura-bar h-3 rounded-full" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div>
    </div>
  );
}

function Insights() {
  const { t, locale } = useI18n();
  const entries = useEntries();
  const [editing, setEditing] = useState<Entry | null>(null);
  const [status, setStatus] = useState("");
  const sorted = sortByDate(entries);
  const scores = regionScores(entries);
  const top = (Object.entries(scores) as [RegionId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const count = (f: (e: Entry) => boolean) => entries.filter(f).length;
  const sideOf = (e: Entry) => REGIONS.find((r) => r.id === e.region)?.side;
  const left = count((e) => sideOf(e) === "L"), right = count((e) => sideOf(e) === "R");
  const period = count((e) => e.factors.includes("period"));
  const sugg = suggestions(entries, scores);
  const journal = useJournal();
  const journalSorted = [...journal].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const mb = mindBody(entries, journal);
  const mbSugg: string[] = [];
  if (mb.heavyPain !== null && mb.lightPain !== null && mb.heavyPain > mb.lightPain + 0.3) mbSugg.push(t.mbSuggHeavy);
  if (mb.gratefulPain !== null && mb.otherPain !== null && mb.gratefulPain < mb.otherPain) mbSugg.push(t.mbSuggGrateful);
  if (mb.lightPain !== null && mb.lightPain >= 4) mbSugg.push(t.mbSuggDoctor);
  const moodCounts = new Map<string, number>();
  journal.forEach((j) => j.moods.forEach((m) => moodCounts.set(m, (moodCounts.get(m) ?? 0) + 1)));
  const moodTop = [...moodCounts.entries()].sort((x, y) => y[1] - x[1]);
  const moodTotal = moodTop.reduce((s, [, n]) => s + n, 0) || 1;
  // Whole percentages that always sum to exactly 100 (largest-remainder rounding).
  const moodPcts = new Map<string, number>();
  {
    const frac = moodTop.map(([, n]) => (n / moodTotal) * 100);
    const pcts = frac.map((f) => Math.floor(f));
    let left = 100 - pcts.reduce((s, p) => s + p, 0);
    frac.map((f, i) => ({ i, f: f - Math.floor(f) })).sort((a, b) => b.f - a.f).slice(0, left).forEach(({ i }) => pcts[i]!++);
    moodTop.forEach(([m], i) => moodPcts.set(m, pcts[i]!));
  }

  const zodiac = useZodiac();
  const a = astroFor(new Date(), zodiac);
  const m = nextMoonEvent();
  const mDays = Math.round(m.days);
  const sunNext = nextSunSign(new Date(), zodiac);
  const sunDays = Math.round(sunNext.days);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const dismiss = (id: string) => setHidden((h) => { const n = new Set(h); n.add(id); return n; });
  const suggCards: { id: string; level: "gentle" | "care" | "doctor"; text: string }[] = [
    ...sugg.map((s) => ({ id: `${s.key}:${s.region ?? ""}`, level: s.level, text: t.sugg[s.key]?.(s.region ? t.regions[s.region] : "") ?? "" })),
    ...mbSugg.map((m) => ({ id: m, level: "care" as const, text: m })),
  ].filter((c) => c.text && !hidden.has(c.id));

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 id="insights" className="scroll-mt-6 text-center font-display text-5xl">{t.patternsTitle}</h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-lg text-ink-muted">{t.patternsIntro}</p>
      <p role="status" aria-live="polite" className={status ? "confirm-banner mt-4 text-center" : "sr-only"}>{status && <>✓ {status}</>}</p>

      <section aria-labelledby="mn sn" className="paper-card mt-8 p-5 text-center">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-0">
          <div className="sm:pr-6">
            <h2 id="mn" className="font-display text-2xl">{t.moonNames[a.phase]}</h2>
            <div className="mt-3 flex justify-center"><MoonGlyph illumination={a.illumination} waxing={a.waxing} size={56} /></div>
            <p className="mt-3 text-lg">{t.sugg[`moon_${a.phase}`]?.("")}</p>
            <p className="mt-2 text-ink-muted">{t.moonTarget[m.target]} {mDays === 0 ? t.moonTonight : t.moonInDays(mDays)}</p>
          </div>
          <div className="border-t border-ink/10 pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <h2 id="sn" className="font-display text-2xl">{t.signs[a.sunSign]} {t.sun.toLocaleLowerCase(locale)}</h2>
            <div className="mt-3 flex justify-center"><SunGlyph eclipse={a.solarEclipse} size={56} /></div>
            <p className="mt-3 text-lg">{t.signs[a.sunSign]}</p>
            <p className="mt-2 text-ink-muted">{sunNext.days < 0.5 ? t.sunToday : t.sunIn(t.signs[sunNext.sign], Math.max(1, sunDays))}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="sg" className="mt-8">
        <h2 id="sg" className="font-display text-3xl">{t.suggestionsTitle}</h2>
        {suggCards.length === 0 ? (
          <p className="paper-card sugg-card mt-3 p-5">{t.suggNone}</p>
        ) : (
          <ul className="mt-3 grid gap-4 md:grid-cols-2">
            {suggCards.map((c) => (
              <li key={c.id} className={`paper-card sugg-card sugg-${c.level} relative p-5`}>
                <button type="button" onClick={() => dismiss(c.id)} aria-label={t.dismiss}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-muted hover:text-foreground">✕</button>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mood" className="paper-card mt-8 p-5">
        <h2 id="mood" className="font-display text-2xl">{t.moodLogTitle}</h2>
        {moodTop.length === 0 ? <p className="mt-2">{t.moodLogEmpty}</p> : (
          <div className="mt-3">
            <div className="flex h-4 overflow-hidden rounded-full" aria-hidden="true">
              {moodTop.map(([m, n]) => (
                <span key={m} style={{ width: `${(n / moodTotal) * 100}%`, background: MOOD_COLORS[m] ?? MOOD_NEUTRAL }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {moodTop.map(([m]) => (
                <li key={m} className="tag" style={{ background: MOOD_COLORS[m] ?? MOOD_NEUTRAL }}>
                  {t.moods[m] ?? m} · {moodPcts.get(m)}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className={`mt-8 grid gap-6 ${period > 0 ? "md:grid-cols-2" : ""}`}>
        <section aria-labelledby="at" className="paper-card p-5">
          <h2 id="at" className="font-display text-2xl">{t.attention}</h2>
          {(left > 0 || right > 0) && (
            <p className="mt-2 text-ink-muted">
              {left > right ? t.sidesNote(t.left, left) : right > left ? t.sidesNote(t.right, right) : t.sidesEven(left)}
            </p>
          )}
          <div className="mt-3 space-y-3">{top.map(([r]) => <Bar key={r} label={`${t.regions[r]} · ${t.notesCount(count((e) => e.region === r))}`} value={count((e) => e.region === r)} max={Math.max(...top.map(([x]) => count((e) => e.region === x)))} />)}</div>
        </section>
        {period > 0 && (
          <section aria-labelledby="cy" className="paper-card p-5">
            <h2 id="cy" className="font-display text-2xl">{t.cycleTitle}</h2>
            <p className="mt-2">{t.cycleText(period)}</p>
          </section>
        )}
      </div>

      <section aria-labelledby="all" className="mt-10">
        <h2 id="all" className="font-display text-3xl">{t.allLog}</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="bd">
            <h3 id="bd" className="font-display text-xl">{t.bodyDiary}</h3>
            <ul className="mt-3 space-y-3">{sorted.map((e) => <li key={e.id}><EntryCard e={e} onEdit={() => setEditing(e)} onStatus={setStatus} /></li>)}</ul>
          </section>
          <section aria-labelledby="md">
            <h3 id="md" className="font-display text-xl">{t.mindDiary}</h3>
            {journalSorted.length === 0 ? <p className="mt-3 text-ink-muted">{t.jEmpty}</p> :
              <ul className="mt-3 space-y-3">{journalSorted.map((j) => <li key={j.id}><JournalCard j={j} onStatus={setStatus} /></li>)}</ul>}
          </section>
        </div>
      </section>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-ghost" onClick={() => exportEntries(journalSnapshot())}>{t.backup}</button>
            <label className="btn-ghost cursor-pointer">{t.restore}
              <input type="file" accept="application/json" className="sr-only" onChange={async (ev) => { const f = ev.target.files?.[0]; if (!f) return; try { setStatus(t.restored(await importEntries(f, restoreJournal))); } catch { setStatus(t.restoreFail); } ev.target.value = ""; }} />
            </label>
          </div>
      <EntryDialog region={editing?.region ?? null} editing={editing} history={sorted} onClose={() => setEditing(null)} onSaved={setStatus} />
    </div>
  );
}
