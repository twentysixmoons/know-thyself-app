import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { EntryCard } from "@/components/EntryCard";
import { JournalCard } from "@/components/JournalCard";
import { sortByDate, useEntries, type Entry } from "@/lib/entries";
import { useJournal, type JournalEntry } from "@/lib/journal";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/log")({
  validateSearch: (search: Record<string, unknown>): { filter?: Diary } => {
    const f = search["filter"];
    return f === "body" || f === "mind" || f === "dream" ? { filter: f } : {};
  },
  head: () => ({
    meta: [
      { title: "My Diary Entries — Know Thyself" },
      { name: "description", content: "Every body, mind and dream note in one place — sortable, filterable, printable." },
      { property: "og:title", content: "My Diary Entries — Know Thyself" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Log,
});

type Diary = "body" | "mind" | "dream";
type Row = { diary: Diary; createdAt: number; body?: Entry; mind?: JournalEntry };

function Log() {
  const { t } = useI18n();
  const bodyEntries = useEntries();
  const journal = useJournal();
  const filter = Route.useSearch()["filter"] as Diary | undefined;
  const [newestFirst, setNewestFirst] = useState(true);
  const [selected, setSelected] = useState<Set<Diary>>(() => new Set(filter ? [filter] : []));
  // A filter passed in the URL (from the diary pages) selects its tab.
  useEffect(() => { setSelected(new Set(filter ? [filter] : [])); }, [filter]);

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = [
      ...sortByDate(bodyEntries).map((e) => ({ diary: "body" as const, createdAt: e.createdAt, body: e })),
      ...journal.filter((j) => j.kind !== "dream").map((j) => ({ diary: "mind" as const, createdAt: j.createdAt, mind: j })),
      ...journal.filter((j) => j.kind === "dream").map((j) => ({ diary: "dream" as const, createdAt: j.createdAt, mind: j })),
    ];
    return all.sort((a, b) => (newestFirst ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
  }, [bodyEntries, journal, newestFirst]);

  const toggle = (f: Diary) => setSelected((s) => { const n = new Set(s); if (n.has(f)) n.delete(f); else n.add(f); return n; });
  const shown = selected.size === 0 ? rows : rows.filter((r) => selected.has(r.diary));
  const emptyFor = (f: Diary) => (f === "body" ? t.noEntries : f === "dream" ? t.dreamEmpty : t.jEmpty);

  return (
    <div className="print-sheet mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-center font-display text-5xl">{t.myEntries}</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-lg text-ink-muted">{t.logIntro}</p>

      <div className="no-print mt-5 flex flex-wrap items-center justify-center gap-2">
        <div role="group" aria-label={t.myEntries} className="flex flex-wrap justify-center gap-1.5">
          <button type="button" aria-pressed={selected.size === 0} onClick={() => setSelected(new Set())}
            className={selected.size === 0 ? "btn-subtle !bg-[color-mix(in_oklab,var(--btn-orange)_12%,transparent)]" : "btn-subtle"}>
            {t.filterAll}
          </button>
          {(["body", "mind", "dream"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={selected.has(f)} onClick={() => toggle(f)}
              className={selected.has(f) ? "btn-subtle !bg-[color-mix(in_oklab,var(--btn-orange)_12%,transparent)]" : "btn-subtle"}>
              {f === "body" ? t.filterBody : f === "dream" ? t.filterDream : t.filterMind}
            </button>
          ))}
        </div>
        <button type="button" className="btn-subtle" onClick={() => setNewestFirst(!newestFirst)}>
          {newestFirst ? t.sortOldest : t.sortNewest}
        </button>
        <button type="button" className="btn-primary" onClick={() => window.print()}>{t.savePdf}</button>
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 text-center">{selected.size === 1 ? emptyFor([...selected][0]!) : t.noEntries}</p>
      ) : (
        <ul className="print-log mt-6 space-y-5">
          {shown.map((r, i) => (
            <li key={`${r.diary}-${r.createdAt}-${i}`}>
              {r.body
                ? <EntryCard e={r.body} />
                : <JournalCard j={r.mind!} editTo={r.diary === "dream" ? "/spirit" : "/diary"} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
