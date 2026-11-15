import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useJournal, type JournalEntry } from "@/lib/journal";
import { JournalComposer } from "@/components/JournalComposer";
import { JournalCard } from "@/components/JournalCard";

export const Route = createFileRoute("/spirit")({
  head: () => ({
    meta: [
      { title: "Spirit — Know Thyself" },
      { name: "description", content: "Record your dreams and revisit what your nights tell you." },
      { property: "og:title", content: "Spirit — Know Thyself" },
      { property: "og:description", content: "Record your dreams and revisit what your nights tell you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Spirit,
});

/** The Spirit tab: the dream journal — add a new dream, edit, and revisit old ones. */
function Spirit() {
  const { t } = useI18n();
  const list = useJournal();
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [status, setStatus] = useState("");

  /** Deep link: /spirit#<entry id> (from the Insights page) opens that dream for editing. */
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    if (!hash) return;
    const found = list.find((x) => x.id === hash && x.kind === "dream");
    if (found) setEditing(found);
  }, [hash, list]);

  const sorted = [...list].filter((j) => j.kind === "dream").sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-center font-display text-5xl">{t.spiritTitle}</h1>
      <p role="status" aria-live="polite" className={status ? "confirm-banner mt-4 text-center" : "sr-only"}>{status && <>✓ {status}</>}</p>

      <JournalComposer moodKind="dream" editing={editing} onClear={() => setEditing(null)} onStatus={setStatus} />

      <h2 className="mt-10 text-center font-display text-2xl">{t.dreamDiary}</h2>
      {sorted.length === 0 ? <p className="mt-6 text-center">{t.dreamEmpty}</p> : (
        <ul className="mt-6 space-y-5">
          {sorted.map((j) => <li key={j.id}><JournalCard j={j} onStatus={setStatus} editTo="/spirit" /></li>)}
        </ul>
      )}
    </div>
  );
}
