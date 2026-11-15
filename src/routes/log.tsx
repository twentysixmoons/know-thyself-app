import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EntryCard } from "@/components/EntryCard";
import { JournalCard } from "@/components/JournalCard";
import { useEntries, type Entry } from "@/lib/entries";
import { useJournal, type JournalEntry } from "@/lib/journal";
import { useI18n } from "@/lib/i18n";
import { sortByDate } from "@/lib/entries";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Full log — Know Thyself" },
      { name: "description", content: "Every body, mind and dream note in one place — sortable, filterable, printable." },
      { property: "og:title", content: "Full log — Know Thyself" },
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
  const [newestFirst, setNewestFirst] = useState(true);
  const [filter, setFilter] = useState<Diary | "all">("all");

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = [
      ...sortByDate(bodyEntries).map((e) => ({ diary: "body" as const, createdAt: e.createdAt, body: e })),
      ...journal.filter((j) => j.kind !== "dream").map((j) => ({ diary: "mind" as const, createdAt: j.createdAt, mind: j })),
      ...journal.filter((j) => j.kind === "dream").map((j) => ({ diary: "dream" as const, createdAt: j.createdAt, mind: j })),
    ];
    return all.sort((a, b) => (newestFirst ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
  }, [bodyEntries, journal, newestFirst]);

  const shown = filter === "all" ? rows : rows.filter((r) => r.diary === filter);
  const emptyFor = (f: Diary) => (f === "body" ? t.noEntries : f === "dream" ? t.dreamEmpty : t.jEmpty);

  return (
    <div className="print-sheet mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-center font-display text-5xl">{t.allLog}</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-lg text-ink-muted">{t.logIntro}</p>

      <div className="no-print mt-5 flex flex-wrap items-center justify-center gap-2">
        <div role="group" aria-label={t.allLog} className="flex flex-wrap justify-center gap-1.5">
          {(["all", "body", "mind", "dream"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
              className={filter === f ? "btn-subtle !bg-[color-mix(in_oklab,var(--btn-orange)_12%,transparent)]" : "btn-subtle"}>
              {f === "all" ? t.filterAll : f === "body" ? t.bodyDiary : f === "dream" ? t.dreamDiary : t.mindDiary}
            </button>
          ))}
        </div>
        <button type="button" className="btn-subtle" onClick={() => setNewestFirst(!newestFirst)}>
          {newestFirst ? t.sortOldest : t.sortNewest}
        </button>
        <button type="button" className="btn-primary" onClick={() => window.print()}>{t.printNow}</button>
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 text-center">{emptyFor(filter === "all" ? "body" : filter)}</p>
      ) : (
        <ul className="mt-6 space-y-5">
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
