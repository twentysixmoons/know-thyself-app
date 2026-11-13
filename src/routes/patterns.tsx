import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EntryCard } from "@/components/EntryCard";
import { EntryDialog } from "@/components/EntryDialog";
import { exportEntries, importEntries, regionScores, sortByDate, useEntries, type Entry } from "@/lib/entries";
import { REGIONS, type RegionId } from "@/lib/regions";
import { suggestions } from "@/lib/suggest";
import { useI18n } from "@/lib/i18n";
import { journalSnapshot, mindBody, restoreJournal, useJournal } from "@/lib/journal";
import { JournalCard } from "@/components/JournalCard";

export const Route = createFileRoute("/patterns")({
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
  component: Patterns,
});

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-base"><span className="capitalize">{label}</span><span>{value}</span></div>
      <div className="mt-1 h-3 rounded-full bg-ink/10" aria-hidden="true"><div className="aura-bar h-3 rounded-full" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div>
    </div>
  );
}

function Patterns() {
  const { t } = useI18n();
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
  const f1 = (n: number) => n.toFixed(1);
  const mbSugg: string[] = [];
  if (mb.heavyPain !== null && mb.lightPain !== null && mb.heavyPain > mb.lightPain + 0.3) mbSugg.push(t.mbSuggHeavy);
  if (mb.gratefulPain !== null && mb.otherPain !== null && mb.gratefulPain < mb.otherPain) mbSugg.push(t.mbSuggGrateful);
  if (mb.lightPain !== null && mb.lightPain >= 4) mbSugg.push(t.mbSuggDoctor);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 id="patterns" className="scroll-mt-6 text-center font-display text-5xl">{t.patternsTitle}</h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-lg text-ink-muted">{t.patternsIntro}</p>
      <p role="status" aria-live="polite" className={status ? "confirm-banner mt-4 text-center" : "sr-only"}>{status && <>✓ {status}</>}</p>

      <section aria-labelledby="sg" className="paper-card mt-8 p-5">
        <h2 id="sg" className="font-display text-3xl">{t.suggestionsTitle}</h2>
        <ul className="mt-3 space-y-3">
          {sugg.map((s, i) => (
            <li key={i} className={`sugg sugg-${s.level}`}>{t.sugg[s.key]?.(s.region ? t.regions[s.region] : "")}</li>
          ))}
          {mbSugg.map((m) => <li key={m} className="sugg sugg-care">{m}</li>)}
        </ul>
      </section>

      <section aria-labelledby="mb" className="paper-card mt-8 p-5">
        <h2 id="mb" className="font-display text-2xl">{t.mbTitle}</h2>
        <div className="mt-3 space-y-2">
          {mb.heavyPain !== null && mb.lightPain !== null && <p>{t.mbHeavy(f1(mb.heavyPain), f1(mb.lightPain))}</p>}
          {mb.gratefulPain !== null && mb.otherPain !== null && <p>{t.mbGrateful(f1(mb.gratefulPain), f1(mb.otherPain))}</p>}
          {(mb.heavyPain === null || mb.lightPain === null) && (mb.gratefulPain === null || mb.otherPain === null) && <p>{t.mbNeed}</p>}
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="at" className="paper-card p-5">
          <h2 id="at" className="font-display text-2xl">{t.attention}</h2>
          <div className="mt-3 space-y-3">{top.map(([r]) => <Bar key={r} label={`${t.regions[r]} · ${t.notesCount(count((e) => e.region === r))}`} value={count((e) => e.region === r)} max={Math.max(...top.map(([x]) => count((e) => e.region === x)))} />)}</div>
        </section>
        <section aria-labelledby="sd" className="paper-card p-5">
          <h2 id="sd" className="font-display text-2xl">{t.sides}</h2>
          <div className="mt-3 space-y-3"><Bar label={t.left} value={left} max={Math.max(left, right)} /><Bar label={t.right} value={right} max={Math.max(left, right)} /></div>
          <h2 className="mt-6 font-display text-2xl">{t.cycleTitle}</h2>
          <p className="mt-2">{t.cycleText(period)}</p>
        </section>
      </div>

      <section aria-labelledby="all" className="mt-10">
        <h2 id="all" className="font-display text-3xl">{t.allLog}</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="bd">
            <h3 id="bd" className="font-display text-xl">{t.bodyDiary}</h3>
            <ul className="mt-3 space-y-3">{sorted.map((e) => <li key={e.id}><EntryCard e={e} onEdit={() => setEditing(e)} /></li>)}</ul>
          </section>
          <section aria-labelledby="md">
            <h3 id="md" className="font-display text-xl">{t.mindDiary}</h3>
            {journalSorted.length === 0 ? <p className="mt-3 text-ink-muted">{t.jEmpty}</p> :
              <ul className="mt-3 space-y-3">{journalSorted.map((j) => <li key={j.id}><JournalCard j={j} /></li>)}</ul>}
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
