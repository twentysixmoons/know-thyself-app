import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Heart, Plus, Smile, X } from "lucide-react";
import { deleteJournal, saveJournal, useJournal, MOODS, MOOD_COLORS, MOOD_NEUTRAL, type JournalEntry, type Mood } from "@/lib/journal";
import { useI18n } from "@/lib/i18n";
import { JournalComposer } from "@/components/JournalComposer";
import { AstroLine } from "@/components/AstroLine";

export const Route = createFileRoute("/diary")({
  head: () => ({
    meta: [
      { title: "What's on your mind? — Know Thyself" },
      { name: "description", content: "Journal how your mind feels, note three nice things from your day and add a photo." },
      { property: "og:title", content: "What's on your mind? — Know Thyself" },
      { property: "og:description", content: "A gentle journal for your mind, with daily gratitude." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Diary,
});

function Diary() {
  const { t, locale } = useI18n();
  const list = useJournal();
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [status, setStatus] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /** Deep link: /diary#<entry id> (from the Insights page) opens that entry for editing. */
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    if (!hash) return;
    const found = list.find((x) => x.id === hash);
    if (found && found.kind === "daily") setEditing(found); // only reflections are editable; dreams live on the Spirit tab
  }, [hash, list]);

  const sorted = [...list].filter((j) => j.kind !== "dream").sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const [gratitudeDraft, setGratitudeDraft] = useState<string[]>([""]);
  const [feelingsDraft, setFeelingsDraft] = useState<Mood[]>([]);
  const [gratitudeDate, setGratitudeDate] = useState(new Date().toISOString().slice(0, 10));
  const [feelingsDate, setFeelingsDate] = useState(new Date().toISOString().slice(0, 10));
  const [gratitudeError, setGratitudeError] = useState("");
  const [feelingsError, setFeelingsError] = useState("");
  const today = () => new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-center font-display text-3xl sm:text-4xl">{t.jTitle}</h1>
      <p className="mt-2 text-center text-lg text-ink-muted">{t.jIntro}</p>
      <p role="status" aria-live="polite" className={status ? "confirm-banner mt-4 text-center" : "sr-only"}>{status && <>✓ {status}</>}</p>

      <JournalComposer moodKind="daily" editing={editing} onClear={() => setEditing(null)} onStatus={setStatus} />

      {/* Standalone mind-diary entries — gratitude and feelings save as their
          own entries, which then appear in the recent list and Entries page.
          Both mimic the dream card: rows with remove buttons, an add button,
          a date, and ✓ to submit / ✕ to close. */}
      <section aria-labelledby="grat" className="paper-card mt-4 p-5">
        <h2 id="grat" className="flex items-center gap-2 font-display text-2xl"><Heart className="size-5 text-[var(--btn-red)]" aria-hidden="true" />{t.gratitudeCard}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {gratitudeDraft.map((n, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" value={n} maxLength={300} aria-label={t.jNicePh(i + 1)} placeholder={`${i + 1}. ${t.jNicePh(i + 1)}`}
                onChange={(e) => setGratitudeDraft(gratitudeDraft.map((x, k) => (k === i ? e.target.value : x)))} />
              <button type="button" className="btn-ghost !min-h-11 !min-w-11 !px-2" aria-label={t.removeRow}
                onClick={() => setGratitudeDraft(gratitudeDraft.length > 1 ? gratitudeDraft.filter((_, k) => k !== i) : [""])}><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
          ))}
          {gratitudeDraft.length < 3 && (
            <button type="button" className="btn-ghost self-start" onClick={() => setGratitudeDraft([...gratitudeDraft, ""])}>
              <Plus className="h-5 w-5" aria-hidden="true" />{t.jAddGratitude}
            </button>
          )}
        </div>
        <div className="field mt-3">
          <span>{t.jDate}</span>
          <input type="date" className="input" value={gratitudeDate} max={today()} onChange={(e) => setGratitudeDate(e.target.value)} />
        </div>
        {gratitudeError && <p role="alert" className="text-destructive">{gratitudeError}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" aria-label={t.saveGratitudes} title={t.saveGratitudes} className="btn-primary !min-h-11 !min-w-11 !rounded-full !px-0"
            onClick={() => {
              if (!gratitudeDraft.some((n) => n.trim())) { setGratitudeError(t.gratitudeRequired); return; }
              saveJournal({ date: gratitudeDate, kind: "gratitude", text: "", gratitude: gratitudeDraft.map((n) => n.trim().slice(0, 300)), moods: [] });
              setGratitudeDraft([""]);
              setGratitudeDate(new Date().toISOString().slice(0, 10));
              setGratitudeError("");
              setStatus(t.gratitudesSaved);
            }}><Check className="size-5" aria-hidden="true" /></button>
          <button type="button" aria-label={t.cancel} title={t.cancel} className="btn-ghost !min-h-11 !min-w-11 !rounded-full !px-0"
            onClick={() => { setGratitudeDraft([""]); setGratitudeDate(new Date().toISOString().slice(0, 10)); setGratitudeError(""); }}><X className="size-5" aria-hidden="true" /></button>
        </div>
      </section>

      <section aria-labelledby="feel" className="paper-card mt-4 p-5">
        <h2 id="feel" className="flex items-center gap-2 font-display text-2xl"><Smile className="size-5 text-[var(--moss-deep)]" aria-hidden="true" />{t.jMoods}</h2>
        <div role="group" aria-label={t.jMoods} className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m} type="button" className="chip" aria-pressed={feelingsDraft.includes(m)} onClick={() => setFeelingsDraft(feelingsDraft.includes(m) ? feelingsDraft.filter((x) => x !== m) : [...feelingsDraft, m])}>
              {t.moods[m]}
            </button>
          ))}
        </div>
        <div className="field mt-3">
          <span>{t.jDate}</span>
          <input type="date" className="input" value={feelingsDate} max={today()} onChange={(e) => setFeelingsDate(e.target.value)} />
        </div>
        {feelingsError && <p role="alert" className="text-destructive">{feelingsError}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" aria-label={t.saveMood} title={t.saveMood} className="btn-primary !min-h-11 !min-w-11 !rounded-full !px-0"
            onClick={() => {
              if (!feelingsDraft.length) { setFeelingsError(t.moodRequired); return; }
              saveJournal({ date: feelingsDate, kind: "feelings", text: "", gratitude: [], moods: feelingsDraft });
              setFeelingsDraft([]);
              setFeelingsDate(new Date().toISOString().slice(0, 10));
              setFeelingsError("");
              setStatus(t.moodSaved);
            }}><Check className="size-5" aria-hidden="true" /></button>
          <button type="button" aria-label={t.cancel} title={t.cancel} className="btn-ghost !min-h-11 !min-w-11 !rounded-full !px-0"
            onClick={() => { setFeelingsDraft([]); setFeelingsDate(new Date().toISOString().slice(0, 10)); setFeelingsError(""); }}><X className="size-5" aria-hidden="true" /></button>
        </div>
      </section>

      <h2 className="mt-10 text-center font-display text-2xl">{t.mindRecent}</h2>
      {sorted.length === 0 ? <p className="mt-6 text-center">{t.jEmpty}</p> : (
        <ul className="mt-6 space-y-5">
          {sorted.slice(0, 3).map((j) => {
            const d = new Date(j.date + "T12:00");
            const isGratitude = j.kind === "gratitude";
            const isFeelings = j.kind === "feelings";
            const canEdit = !isGratitude && !isFeelings;
            return (
              <li key={j.id}>
                <article className="paper-card p-4">
                  <h3 className="font-display text-lg">{isGratitude ? t.gratitudeCard : isFeelings ? t.jMoods : (j.title || t.jNoTitle)}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    <time dateTime={j.date}>{d.toLocaleDateString(locale, { dateStyle: "full" })}</time>
                  </p>

                  {j.kind === "dream" ? (
                    <p className="mt-2 flex flex-wrap gap-1">
                      <span className="tag">{t.jDreamTag}</span>
                      {j.dreamType && <span className="tag">{t.dreamTypes[j.dreamType]}</span>}
                      {j.symbols?.filter((s) => s.trim()).map((s) => <span key={s} className="tag">{s}</span>)}
                    </p>
                  ) : isGratitude ? (
                    <ol className="mt-2 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
                  ) : isFeelings ? (
                    j.moods.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1">
                        {j.moods.map((m) => <span key={m} className="tag" style={{ background: MOOD_COLORS[m] ?? MOOD_NEUTRAL }}>{t.moods[m] ?? m}</span>)}
                      </p>
                    )
                  ) : (
                    j.moods.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1">
                        {j.moods.map((m) => <span key={m} className="tag" style={{ background: MOOD_COLORS[m] ?? MOOD_NEUTRAL }}>{t.moods[m] ?? m}</span>)}
                      </p>
                    )
                  )}

                  <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
                    <AstroLine date={d} />
                  </p>

                  {j.text && <p className="mt-3 whitespace-pre-line">{j.text}</p>}

                  {j.kind !== "dream" && !isGratitude && j.gratitude.some((g) => g.trim()) && (
                    <div className="mt-3">
                      <p className="text-sm text-ink-muted">{t.jGratefulLead}</p>
                      <ol className="mt-1 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
                    </div>
                  )}

                  {j.kind !== "dream" && !isGratitude && j.image && <img src={j.image} alt={t.photo} className="mt-3 max-h-80 w-full rounded-md object-cover" />}

                  <div className="mt-4 flex gap-2">
                    {canEdit && <button type="button" className="btn-subtle" onClick={() => setEditing(j)}>{t.edit}</button>}
                    <button type="button" className="btn-subtle" onClick={() => setConfirmId(j.id)}>{t.del}</button>
                  </div>

                  {confirmId === j.id && (
                    <div role="alertdialog" aria-label={t.deleteConfirm} className="confirm-warning mt-3">
                      <p>{t.deleteConfirm}</p>
                      <div className="mt-3 flex gap-3">
                        <button type="button" autoFocus className="btn-ghost flex-1" onClick={() => setConfirmId(null)}>{t.deleteCancel}</button>
                        <button type="button" className="btn-primary flex-1" onClick={() => { deleteJournal(j.id); setConfirmId(null); setStatus(t.jDeleted); }}>{t.deleteYes}</button>
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/log" search={{ filter: "mind" }} className="btn-primary">{t.viewAllEntries} →</Link>
        <Link to="/insights" className="btn-ghost">{t.viewInsights}</Link>
      </div>
    </div>
  );
}
