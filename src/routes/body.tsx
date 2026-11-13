import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BodyMap } from "@/components/BodyMap";
import { EntryDialog } from "@/components/EntryDialog";
import { EntryCard } from "@/components/EntryCard";
import { regionScores, sortByDate, useEntries, type Entry } from "@/lib/entries";
import { REGIONS, type RegionId } from "@/lib/regions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/body")({
  head: () => ({
    meta: [
      { title: "Body — Know Thyself" },
      { name: "description", content: "Tap the body to log pain and feelings. Soft auras and sidereal moon guidance reveal what needs care." },
      { property: "og:title", content: "Body — Know Thyself" },
      { property: "og:description", content: "A holistic body diary with auras, moon phases and gentle suggestions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const entries = useEntries();
  const [region, setRegion] = useState<RegionId | null>(null);
  const [picked, setPicked] = useState<RegionId[]>([]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [status, setStatus] = useState("");
  const sorted = sortByDate(entries);
  const scores = regionScores(entries);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p role="status" aria-live="polite" className={status ? "confirm-banner" : "sr-only"}>{status && <>✓ {status}</>}</p>
      <div className="mx-auto flex max-w-2xl flex-col gap-20 text-center">
        <section aria-labelledby="feel">
          <h1 id="feel" className="font-display text-3xl sm:text-4xl">{t.howFeel}</h1>
          <p className="mt-3 text-base text-ink-muted">{t.tapHint}</p>
          <div className="body-map-frame mt-5">
            <BodyMap scores={scores} onPick={(rs) => { const first = rs[0]; if (!first) return; setEditing(null); setPicked(rs); setRegion(first); setStatus(""); }} />
          </div>
          <details className="mt-5">
            <summary className="btn-ghost inline-flex cursor-pointer text-sm">{t.orChoose}</summary>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
              {REGIONS.map((r) => (
                <li key={r.id}><Button type="button" variant="outline" className="chip chip-body w-full capitalize" onClick={() => { setEditing(null); setPicked([r.id]); setRegion(r.id); }}>{t.regions[r.id]}</Button></li>
              ))}
            </ul>
          </details>
        </section>
        <section aria-labelledby="log">
          <h2 id="log" className="font-display text-3xl">{t.log}</h2>
          <p className="mt-2 text-sm text-ink-muted">{t.privacy}</p>
          {sorted.length === 0 ? <p className="mt-4">{t.noEntries}</p> : (
            <ul className="mt-8 space-y-5 text-left">
              {sorted.slice(0, 4).map((e) => (
                <li key={e.id}><EntryCard e={e} onEdit={() => { setEditing(e); setRegion(e.region); }} /></li>
              ))}
            </ul>
          )}
          <Link to="/patterns" hash="patterns" className="btn-primary mt-8 inline-flex">{t.viewAll} →</Link>
        </section>
      </div>
      <EntryDialog region={region} regions={picked} editing={editing} history={sorted} onClose={() => { setRegion(null); setEditing(null); }} onSaved={setStatus} />
    </div>
  );
}
