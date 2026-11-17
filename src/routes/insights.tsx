import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { regionScores, useEntries, type Entry } from "@/lib/entries";
import { REGIONS, type RegionId } from "@/lib/regions";
import { suggestions } from "@/lib/suggest";
import { tickSugg, dismissSugg } from "@/lib/sugg-queue";
import { useI18n } from "@/lib/i18n";
import { mindBody, useJournal, dreamShade, DREAM_TYPES, MOOD_COLORS, MOOD_NEUTRAL } from "@/lib/journal";
import { practiceColor } from "@/lib/practices";
import { astroFor, SIGN_GLYPH, nextMoonEvent, nextSunSign, useZodiac } from "@/lib/astro";
import { MoonGlyph, SunGlyph } from "@/components/AppHeader";
import { BodyMap } from "@/components/BodyMap";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Know Thyself" },
      { name: "description", content: "See which body areas need attention, moon-phase patterns, plus gentle suggestions." },
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
  
  const scores = regionScores(entries);
  // "Areas asking for attention" counts only painful entries.
  const painScores = regionScores(entries.filter((e) => (e.feeling ?? "pain") === "pain"));
  const top = (Object.entries(painScores) as [RegionId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const count = (f: (e: Entry) => boolean) => entries.filter(f).length;
  const painCount = (r: RegionId) => entries.filter((e) => e.region === r && (e.feeling ?? "pain") === "pain").length;
  const sideOf = (e: Entry) => REGIONS.find((r) => r.id === e.region)?.side;
  const left = count((e) => sideOf(e) === "L"), right = count((e) => sideOf(e) === "R");
  const sugg = suggestions(entries, painScores);
  const journal = useJournal();
  const dreams = journal.filter((j) => j.kind === "dream");
  const practiceEntries = journal.filter((j) => j.kind === "practice");
  const practiceDays = new Set(practiceEntries.map((j) => j.date)).size;
  const dreamTypeCounts = new Map<string, number>();
  dreams.forEach((d) => (d.dreamTypes?.length ? d.dreamTypes : [""]).forEach((d) => dreamTypeCounts.set(d, (dreamTypeCounts.get(d) ?? 0) + 1)));
  const dreamTypeTop = [...dreamTypeCounts.entries()].sort((x, y) => y[1] - x[1]);
  const dreamTotal = dreams.length || 1;
  // Whole percentages that always sum to exactly 100 (largest-remainder rounding).
  const dreamPcts = new Map<string, number>();
  {
    const frac = dreamTypeTop.map(([, n]) => (n / dreamTotal) * 100);
    const pcts = frac.map((f) => Math.floor(f));
    let left = 100 - pcts.reduce((s, p) => s + p, 0);
    frac.map((f, i) => ({ i, f: f - Math.floor(f) })).sort((x, y) => y.f - x.f).slice(0, left).forEach(({ i }) => pcts[i]!++);
    dreamTypeTop.forEach(([d], i) => dreamPcts.set(d, pcts[i]!));
  }
  const mb = mindBody(entries, journal);
  const mbSugg: string[] = [];
  if (mb.heavyPain !== null && mb.lightPain !== null && mb.heavyPain > mb.lightPain + 0.3) mbSugg.push(t.mbSuggHeavy);
  if (mb.gratefulPain !== null && mb.otherPain !== null && mb.gratefulPain < mb.otherPain) mbSugg.push(t.mbSuggGrateful);
  if (mb.lightPain !== null && mb.lightPain >= 4) mbSugg.push(t.mbSuggDoctor);
  const moodCounts = new Map<string, number>();
  journal.forEach((j) => j.moods.forEach((m) => moodCounts.set(m, (moodCounts.get(m) ?? 0) + 1)));
  const moodTop = [...moodCounts.entries()].sort((x, y) => y[1] - x[1]);
  const moodTotal = moodTop.reduce((s, [, n]) => s + n, 0) || 1;
  const practiceCounts = new Map<string, number>();
  practiceEntries.forEach((j) => (j.practices ?? []).forEach((p) => practiceCounts.set(p, (practiceCounts.get(p) ?? 0) + 1)));
  const practiceTop = [...practiceCounts.entries()].sort((x, y) => y[1] - x[1]);
  const practiceShadeFor = (p: string) => practiceColor(p);
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
  const allCards: { id: string; level: "gentle" | "care" | "doctor"; text: string }[] = [
    ...sugg.map((s) => ({ id: `${s.key}:${s.region ?? ""}`, level: s.level, text: t.sugg[s.key]?.(s.region ? t.regions[s.region] : "") ?? "" })),
    ...mbSugg.map((m) => ({ id: m, level: "care" as const, text: m })),
  ].filter((c) => c.text);
  const allIds = allCards.map((c) => c.id);
  const idsKey = allIds.join("|");
  const [queue, setQueue] = useState(() => tickSugg(allIds));
  useEffect(() => { setQueue(tickSugg(allIds)); }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => setQueue((q) => { const after = tickSugg(allIds); return JSON.stringify(after) === JSON.stringify(q) ? q : after; }), 30000);
    return () => clearInterval(t);
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const dismiss = (id: string) => setQueue(dismissSugg(id));
  const visible = queue.active.map((id) => allCards.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 id="insights" className="scroll-mt-6 text-center font-display text-3xl sm:text-5xl">{t.patternsTitle}</h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-lg text-ink-muted">{t.patternsIntro}</p>

      <section aria-labelledby="mn sn" className="paper-card mt-8 p-5 text-center">
        <div className="grid grid-cols-2">
          <div className="pr-2 sm:pr-6">
            <h2 id="mn" className="font-display text-base sm:text-2xl">{t.moonNames[a.phase]}</h2>
            <div className="mt-2 flex justify-center sm:mt-3"><MoonGlyph illumination={a.illumination} waxing={a.waxing} size={40} /></div>
            <p className="mt-1 text-sm sm:mt-2 sm:text-lg"><span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[a.moonSign]}</span> {t.signs[a.moonSign]}</p>
            <p className="mt-1 hidden sm:mt-3 sm:block sm:text-lg">{t.sugg[`moon_${a.phase}`]?.("")}</p>
            <p className="mt-1 text-ink-muted text-xs sm:mt-2 sm:text-sm">{t.moonTarget[m.target]} {mDays === 0 ? t.moonTonight : t.moonInDays(mDays)}</p>
          </div>
          <div className="border-l border-ink/10 pl-2 sm:pl-6">
            <h2 id="sn" className="font-display text-base sm:text-2xl">{t.sun.toLocaleLowerCase(locale)}</h2>
            <div className="mt-2 flex justify-center sm:mt-3"><SunGlyph eclipse={a.solarEclipse} size={40} /></div>
            <p className="mt-3 text-sm sm:text-lg"><span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[a.sunSign]}</span> {t.signs[a.sunSign]}</p>
            <p className="mt-1 hidden sm:mt-2 sm:block text-ink-muted">{sunNext.days < 0.5 ? t.sunToday : t.sunIn(t.signs[sunNext.sign], Math.max(1, sunDays))}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="sg" className="mt-8">
        <h2 id="sg" className="font-display text-3xl">{t.suggestionsTitle}</h2>
        {visible.length === 0 ? (
          <p className="paper-card sugg-card mt-3 p-5 pr-12 text-center">
            <span className="block font-display font-bold">{t.suggNoneTitle}</span>
            <span className="mt-2 block">{t.suggNoneBody}</span>
          </p>
        ) : (
          <ul className="mt-3 grid gap-4 md:grid-cols-2">
            {visible.map((c) => (
              <li key={c.id} className={`paper-card sugg-card sugg-${c.level} relative p-5 pr-12`}>
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
        {moodTop.length === 0 ? (
          <>
            <p className="mt-2">{t.moodLogEmpty}</p>
            <Link to="/diary" className="btn-primary mt-3 inline-flex">{t.addMindEntry}</Link>
          </>
        ) : (
          <div className="mt-3">
            <div className="flex h-4 overflow-hidden rounded-full" aria-hidden="true">
              {moodTop.map(([m, n]) => (
                <span key={m} style={{ width: `${(n / moodTotal) * 100}%`, background: MOOD_COLORS[m] ?? MOOD_NEUTRAL }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {moodTop.map(([m]) => (
                <li key={m} className="chip chip-sm" style={{ background: `color-mix(in oklab, ${MOOD_COLORS[m] ?? MOOD_NEUTRAL} 55%, var(--ink))`, color: "var(--paper-light)", borderColor: "transparent" }}>
                  {t.moods[m] ?? m} · {moodPcts.get(m)}%
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-muted">
              <Link to="/diary" className="underline underline-offset-2 hover:text-ink">{t.addNewMind}</Link>
              {` ${t.orSeparator} `}
              <Link to="/log" search={{ filter: "mind" }} className="underline underline-offset-2 hover:text-ink">{t.viewMindEntries}</Link>
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="pr" className="paper-card mt-8 p-5">
        <h2 id="pr" className="font-display text-2xl">{t.practiceStatsTitle}</h2>
        {practiceTop.length === 0 ? (
          <>
            <p className="mt-2">{t.practiceEmpty}</p>
            <Link to="/spirit" className="btn-primary mt-3 inline-flex">{t.addPractice}</Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink-muted">{t.practiceDays(practiceDays)}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {practiceTop.map(([p, n]) => (
                <li key={p} className="tag" style={{ background: practiceShadeFor(p), color: "var(--paper-light)", borderColor: "transparent" }}>{t.practiceNames[p] ?? p} · {n}×</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-muted">
              <Link to="/spirit" className="underline underline-offset-2 hover:text-ink">{t.addNewPractice}</Link>
              {` ${t.orSeparator} `}
              <Link to="/log" search={{ filter: "dream" }} className="underline underline-offset-2 hover:text-ink">{t.viewSpiritEntries}</Link>
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="dst" className="paper-card mt-8 p-5">
        <h2 id="dst" className="font-display text-2xl">{t.dreamStatsTitle}</h2>
        {dreams.length === 0 ? (
          <>
            <p className="mt-2">{t.dreamEmpty}</p>
            <Link to="/spirit" className="btn-primary mt-3 inline-flex">{t.addDreamBtn}</Link>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-lg">{t.dreamCount(dreams.length)}</p>
            {dreamTypeTop.length > 0 && (
              <>
                <div className="mt-2 flex h-4 overflow-hidden rounded-full" aria-hidden="true">
                  {dreamTypeTop.map(([d], i) => (
                    <span key={d} style={{ width: `${(dreamTypeCounts.get(d) ?? 0) / dreamTotal * 100}%`, background: dreamShade((DREAM_TYPES as readonly string[]).indexOf(d)) }} />
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {dreamTypeTop.map(([d, n]) => (
                    <li key={d} className="chip chip-sm" style={{ background: `color-mix(in oklab, ${dreamShade((DREAM_TYPES as readonly string[]).indexOf(d))} 60%, var(--ink))`, color: "var(--paper-light)", borderColor: "transparent" }}>
                      {d === "" ? t.dreamNoType : t.dreamTypes[d] ?? d} · {dreamPcts.get(d)}%
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-sm text-ink-muted">
              <Link to="/spirit" className="underline underline-offset-2 hover:text-ink">{t.addNewDream}</Link>
              {` ${t.orSeparator} `}
              <Link to="/log" search={{ filter: "dream" }} className="underline underline-offset-2 hover:text-ink">{t.viewDreamEntries}</Link>
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="at" className="paper-card p-5">
          <h2 id="at" className="font-display text-2xl">{t.attention}</h2>
          {top.length === 0 ? (
            <>
              <p className="mt-2 text-ink-muted">{t.bodyEmpty}</p>
              <Link to="/body" className="btn-primary mt-3 inline-flex">{t.recordBodyEntry}</Link>
            </>
          ) : (
            <>
              {(left > 0 || right > 0) && (
                <p className="mt-2 text-ink-muted">
                  {left > right ? t.sidesNote(t.left, left) : right > left ? t.sidesNote(t.right, right) : t.sidesEven(left)}
                </p>
              )}
              <div className="mt-3 space-y-3">{top.map(([r]) => <Bar key={r} label={`${t.regions[r]} · ${t.notesCount(painCount(r))}`} value={painCount(r)} max={Math.max(...top.map(([x]) => painCount(x)))} />)}</div>
              <p className="mt-3 text-sm text-ink-muted">
                <Link to="/body" className="underline underline-offset-2 hover:text-ink">{t.addNewBody}</Link>
                {` ${t.orSeparator} `}
                <Link to="/log" search={{ filter: "body" }} className="underline underline-offset-2 hover:text-ink">{t.viewBodyEntries}</Link>
              </p>
            </>
          )}
        </section>
        <section aria-labelledby="aa" className="paper-card p-5">
          <h2 id="aa" className="font-display text-2xl">{t.activatedAreas}</h2>
          <p className="mt-2 text-ink-muted">{t.activatedHint}</p>
          <div className="mx-auto mt-3 w-[180px]">
            <BodyMap scores={scores} />
          </div>
        </section>
      </div>
    </div>
  );
}
