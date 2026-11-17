import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { showStatus } from "@/lib/status";
import { useJournal, saveJournal, type JournalEntry } from "@/lib/journal";
import { JournalComposer } from "@/components/JournalComposer";
import { JournalCard } from "@/components/JournalCard";
import { AstroLine } from "@/components/AstroLine";
import { PRACTICES, type Practice } from "@/lib/practices";

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
  const { t, locale } = useI18n();
  const list = useJournal();
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  

  /** Deep link: /spirit#<entry id> (from the Insights page) opens that dream for editing. */
  const hash = useRouterState({ select: (s) => s.location.hash });
  /** Deep link: /spirit#<entry id> opens dreams in the composer and practice
   *  entries in the practices card. */
  useEffect(() => {
    if (!hash) return;
    const found = list.find((x) => x.id === hash);
    if (!found) return;
    if (found.kind === "dream") setEditing(found);
    else if (found.kind === "practice") { setEditingPractice(found); setPracticeDraft(found.practices ?? []); setPracticeDate(found.date); }
  }, [hash, list]);

  const sorted = [...list].filter((j) => j.kind === "dream" || j.kind === "practice").sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const [practiceDraft, setPracticeDraft] = useState<Practice[]>([]);
  const [practiceDate, setPracticeDate] = useState(new Date().toISOString().slice(0, 10));
  const [practiceDateOpen, setPracticeDateOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<JournalEntry | null>(null);
  const [practiceError, setPracticeError] = useState("");
  // The chips pre-fill with the practices already recorded for the chosen date
  // (unless a specific entry is being edited via a deep link).
  useEffect(() => {
    if (editingPractice) return;
    setPracticeDraft(list.filter((j) => j.kind === "practice" && j.date === practiceDate).flatMap((j) => j.practices ?? []));
  }, [practiceDate, list]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Deep link: /spirit#<entry id> opens dreams in the composer and practice
   *  entries in the practices card. */
  useEffect(() => {
    if (!hash) return;
    const found = list.find((x) => x.id === hash);
    if (!found) return;
    if (found.kind === "dream") setEditing(found);
    else if (found.kind === "practice") { setEditingPractice(found); setPracticeDraft(found.practices ?? []); setPracticeDate(found.date); }
  }, [hash, list]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-center font-display text-3xl sm:text-5xl">{t.spiritTitle}</h1>

      <JournalComposer moodKind="dream" editing={editing} onClear={() => setEditing(null)} onStatus={showStatus} />

      <section aria-labelledby="ti" className="paper-card mt-8 p-5">
        <h2 id="ti" className="flex items-center gap-2 font-display text-2xl">{editingPractice ? t.edit : t.practiceStatsTitle}</h2>
        <div role="group" aria-label={t.practiceStatsTitle} className="mt-3 flex flex-wrap gap-2">
          {PRACTICES.map((p) => (
            <button key={p} type="button" className="chip chip-body" aria-pressed={practiceDraft.includes(p)} onClick={() => setPracticeDraft(practiceDraft.includes(p) ? practiceDraft.filter((x) => x !== p) : [...practiceDraft, p])}>
              {t.practiceNames[p] ?? p}
            </button>
          ))}
        </div>
        <div className="field mt-3">
          {practiceDateOpen ? (
            <input type="date" className="input" value={practiceDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPracticeDate(e.target.value)} autoFocus />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold"><time dateTime={practiceDate}>{new Date(practiceDate + "T12:00").toLocaleDateString(locale, { dateStyle: "full" })}</time></p>
                <button type="button" className="cursor-pointer text-sm text-ink-muted underline underline-offset-2 hover:text-ink" onClick={() => setPracticeDateOpen(true)}>{t.jChangeDate}</button>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
                <AstroLine date={new Date(practiceDate + "T12:00")} />
              </p>
            </>
          )}
        </div>
        {practiceError && <p role="alert" className="text-destructive">{practiceError}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-primary flex-1" onClick={() => {
            if (!practiceDraft.length) { setPracticeError(t.practiceRequired); return; }
            // One practice entry per date: update the existing one, else create.
            const existing = list.find((j) => j.kind === "practice" && j.date === practiceDate);
            saveJournal({ id: editingPractice?.id ?? existing?.id, date: practiceDate, kind: "practice", text: "", gratitude: [], moods: [], practices: practiceDraft });
            setEditingPractice(null); setPracticeDraft([]);
            setPracticeDate(new Date().toISOString().slice(0, 10));
            setPracticeError("");
            showStatus(t.statusSaved(t.typePractice));
          }}>{t.savePractice}</button>
          <button type="button" className="btn-ghost" onClick={() => { setEditingPractice(null); setPracticeDraft([]); setPracticeError(""); }}>{t.deleteCancel}</button>
        </div>
      </section>

      <h2 className="mt-10 text-center font-display text-2xl">{t.spiritRecent}</h2>
      {sorted.length === 0 ? <p className="mt-6 text-center">{t.dreamEmpty}</p> : (
        <ul className="mt-6 space-y-5">
          {sorted.slice(0, 3).map((j) => <li key={j.id}><JournalCard j={j} onStatus={showStatus} editTo="/spirit" /></li>)}
        </ul>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/log" search={{ filter: "dream" }} className="btn-primary">{t.viewAllEntries} →</Link>
        <Link to="/insights" className="btn-ghost">{t.viewInsights}</Link>
      </div>
    </div>
  );
}
