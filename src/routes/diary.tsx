import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Plus, Smile, X } from "lucide-react";
import { deleteJournal, dreamShade, DREAM_TYPES, saveJournal, useJournal, MOODS, MOOD_COLORS, MOOD_NEUTRAL, type JournalEntry, type Mood } from "@/lib/journal";
import { useI18n } from "@/lib/i18n";
import { showStatus } from "@/lib/status";
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
  
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /** Deep link: /diary#<entry id> (from the Insights page) opens that entry in
   *  its matching card — reflections in the composer, gratitude and feelings in
   *  their own cards. Dreams live on the Spirit tab. */
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    if (!hash) return;
    const found = list.find((x) => x.id === hash);
    if (!found) return;
    if (found.kind === "daily") setEditing(found);
    else if (found.kind === "gratitude") { setEditingGratitude(found); setGratitudeDraft(found.gratitude); setGratitudeDate(found.date); }
    else if (found.kind === "feelings") { setEditingFeelings(found); setFeelingsDraft(found.moods); setFeelingsDate(found.date); }
  }, [hash, list]);

  const sorted = [...list].filter((j) => j.kind !== "dream" && j.kind !== "practice").sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const [gratitudeDraft, setGratitudeDraft] = useState<string[]>([""]);
  const [gratitudeDate, setGratitudeDate] = useState(new Date().toISOString().slice(0, 10));
  const [gratitudeDateOpen, setGratitudeDateOpen] = useState(false);
  const [editingGratitude, setEditingGratitude] = useState<JournalEntry | null>(null);
  const [feelingsDraft, setFeelingsDraft] = useState<Mood[]>([]);
  const [feelingsDate, setFeelingsDate] = useState(new Date().toISOString().slice(0, 10));
  const [feelingsDateOpen, setFeelingsDateOpen] = useState(false);
  const [editingFeelings, setEditingFeelings] = useState<JournalEntry | null>(null);
  const [gratitudeError, setGratitudeError] = useState("");
  const [feelingsError, setFeelingsError] = useState("");
  const today = () => new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-center font-display text-3xl sm:text-4xl">{t.jTitle}</h1>
      <p className="mt-2 text-center text-lg text-ink-muted">{t.jIntro}</p>

      <JournalComposer moodKind="daily" editing={editing} onClear={() => setEditing(null)} onStatus={showStatus} />

      {/* Standalone mind-diary entries — gratitude and feelings save as their
          own entries, which then appear in the recent list and Entries page.
          The gratitude rows mimic the dream card, and each row carries a ✓ to
          submit it and an ✕ to clear it. */}
      <section aria-labelledby="grat" className="paper-card mt-4 p-5">
        <h2 id="grat" className="flex items-center gap-2 font-display text-2xl"><Heart className="size-5 text-[var(--btn-red)]" aria-hidden="true" />{editingGratitude ? t.edit : t.gratitudeCard}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {gratitudeDraft.map((n, i) => (
            <div key={i} className="relative">
              <input className="input pr-10" value={n} maxLength={300} aria-label={t.jNicePh(i + 1)} placeholder={t.gratitudePh}
                onChange={(e) => setGratitudeDraft(gratitudeDraft.map((x, k) => (k === i ? e.target.value : x)))} />
              <button type="button" aria-label={t.removeRow} title={t.removeRow}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/50 transition hover:text-ink"
                onClick={() => setGratitudeDraft(gratitudeDraft.length > 1 ? gratitudeDraft.filter((_, k) => k !== i) : [""])}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="btn-ghost self-start" onClick={() => {
            // "Add gratitude" keeps the written text and opens a new row —
            // nothing reaches the journal until "Save gratitudes".
            if (!gratitudeDraft[gratitudeDraft.length - 1]?.trim()) return;
            setGratitudeDraft([...gratitudeDraft, ""]);
          }}>
            <Plus className="h-5 w-5" aria-hidden="true" />{t.jAddGratitude}
          </button>
        </div>
        <div className="mt-3">
            {gratitudeDateOpen ? (
            <input type="date" className="input" value={gratitudeDate} max={today()} onChange={(e) => setGratitudeDate(e.target.value)} autoFocus />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold"><time dateTime={gratitudeDate}>{new Date(gratitudeDate + "T12:00").toLocaleDateString(locale, { dateStyle: "full" })}</time></p>
                <button type="button" className="cursor-pointer text-sm text-ink-muted underline underline-offset-2 hover:text-ink" onClick={() => setGratitudeDateOpen(true)}>{t.jChangeDate}</button>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
                <AstroLine date={new Date(gratitudeDate + "T12:00")} />
              </p>
            </>
          )}
        </div>
        {gratitudeError && <p role="alert" className="text-destructive">{gratitudeError}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-primary flex-1" onClick={() => {
            if (!gratitudeDraft.some((n) => n.trim())) { setGratitudeError(t.gratitudeRequired); return; }
            if (editingGratitude) saveJournal({ id: editingGratitude.id, date: gratitudeDate, kind: "gratitude", text: "", gratitude: gratitudeDraft.map((n) => n.trim().slice(0, 300)), moods: [] });
            else saveJournal({ date: gratitudeDate, kind: "gratitude", text: "", gratitude: gratitudeDraft.map((n) => n.trim().slice(0, 300)), moods: [] });
            setEditingGratitude(null); setGratitudeDraft([""]);
            setGratitudeError("");
            showStatus(t.statusSaved(t.typeGratitude));
          }}>{t.saveGratitudes}</button>
          <button type="button" className="btn-ghost" onClick={() => { setEditingGratitude(null); setGratitudeDraft([""]); setGratitudeError(""); }}>{t.deleteCancel}</button>
        </div>
      </section>

      <section aria-labelledby="feel" className="paper-card mt-4 p-5">
        <h2 id="feel" className="flex items-center gap-2 font-display text-2xl"><Smile className="size-5 text-[var(--moss-deep)]" aria-hidden="true" />{editingFeelings ? t.edit : t.feelingsCard}</h2>
        <div role="group" aria-label={t.jMoods} className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m} type="button" className="chip" aria-pressed={feelingsDraft.includes(m)} onClick={() => setFeelingsDraft(feelingsDraft.includes(m) ? feelingsDraft.filter((x) => x !== m) : [...feelingsDraft, m])}>
              {t.moods[m]}
            </button>
          ))}
        </div>
        <div className="mt-3">
            {feelingsDateOpen ? (
            <input type="date" className="input" value={feelingsDate} max={today()} onChange={(e) => setFeelingsDate(e.target.value)} autoFocus />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold"><time dateTime={feelingsDate}>{new Date(feelingsDate + "T12:00").toLocaleDateString(locale, { dateStyle: "full" })}</time></p>
                <button type="button" className="cursor-pointer text-sm text-ink-muted underline underline-offset-2 hover:text-ink" onClick={() => setFeelingsDateOpen(true)}>{t.jChangeDate}</button>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
                <AstroLine date={new Date(feelingsDate + "T12:00")} />
              </p>
            </>
          )}
        </div>
        {feelingsError && <p role="alert" className="text-destructive">{feelingsError}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-primary flex-1" onClick={() => {
            if (!feelingsDraft.length) { setFeelingsError(t.moodRequired); return; }
            if (editingFeelings) saveJournal({ id: editingFeelings.id, date: feelingsDate, kind: "feelings", text: "", gratitude: [], moods: feelingsDraft });
            else saveJournal({ date: feelingsDate, kind: "feelings", text: "", gratitude: [], moods: feelingsDraft });
            setEditingFeelings(null); setFeelingsDraft([]);
            setFeelingsError("");
            showStatus(t.statusSaved(t.typeFeeling));
          }}>{t.saveMood}</button>
          <button type="button" className="btn-ghost" onClick={() => { setEditingFeelings(null); setFeelingsDraft([]); setFeelingsError(""); }}>{t.deleteCancel}</button>
        </div>
      </section>

      <h2 className="mt-10 text-center font-display text-2xl">{t.mindRecent}</h2>
      {sorted.length === 0 ? <p className="mt-6 text-center">{t.jEmpty}</p> : (
        <ul className="mt-6 space-y-5">
          {sorted.slice(0, 3).map((j) => {
            const d = new Date(j.date + "T12:00");
            const isGratitude = j.kind === "gratitude";
            const isFeelings = j.kind === "feelings";
            return (
              <li key={j.id}>
                <article className="paper-card p-4">
                  <h3 className="font-display text-lg">{isGratitude ? t.gratitudeCard : isFeelings ? t.feelingsCard : (j.title || t.jNoTitle)}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    <time dateTime={j.date}>{d.toLocaleDateString(locale, { dateStyle: "full" })}</time>
                  </p>

                  {j.kind === "dream" ? (
                    <p className="mt-2 flex flex-wrap gap-1">
                      <span className="tag">{t.jDreamTag}</span>
                      {j.dreamTypes?.map((d) => <span key={d} className="chip chip-sm" style={{ background: dreamShade(DREAM_TYPES.indexOf(d)), color: "var(--paper-light)", borderColor: "transparent" }}>{t.dreamTypes[d]}</span>)}
                      {j.symbols?.filter((s) => s.trim()).map((s) => <span key={s} className="tag">{s}</span>)}
                    </p>
                  ) : isGratitude ? (
                    <ol className="mt-2 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
                  ) : (
                    j.moods.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1">
                        {j.moods.map((m) => <span key={m} className="chip chip-sm" style={{ background: MOOD_COLORS[m] ?? MOOD_NEUTRAL, borderColor: "transparent" }}>{t.moods[m] ?? m}</span>)}
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

                  <p className="mt-4 flex gap-4 text-sm text-ink-muted">
                    <button type="button" className="cursor-pointer underline underline-offset-2 hover:text-ink" onClick={() => {
                      if (isGratitude) { setEditingGratitude(j); setGratitudeDraft(j.gratitude); setGratitudeDate(j.date); }
                      else if (isFeelings) { setEditingFeelings(j); setFeelingsDraft(j.moods); setFeelingsDate(j.date); }
                      else setEditing(j);
                    }}>{t.edit}</button>
                    <button type="button" className="cursor-pointer underline underline-offset-2 hover:text-ink" onClick={() => setConfirmId(j.id)}>{t.del}</button>
                  </p>

                  {confirmId === j.id && (
                    <div role="alertdialog" aria-label={t.deleteConfirm} className="confirm-warning mt-3">
                      <p>{t.deleteConfirm}</p>
                      <div className="mt-3 flex gap-3">
                        <button type="button" autoFocus className="btn-ghost flex-1" onClick={() => setConfirmId(null)}>{t.deleteCancel}</button>
                        <button type="button" className="btn-primary flex-1" onClick={() => { deleteJournal(j.id); setConfirmId(null); showStatus(t.statusDeleted(j.kind === "dream" ? t.typeDream : j.kind === "gratitude" ? t.typeGratitude : j.kind === "feelings" ? t.typeFeeling : t.typeReflection)); }}>{t.deleteYes}</button>
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
