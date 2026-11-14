import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { deleteJournal, useJournal, type JournalEntry } from "@/lib/journal";
import { astroFor, SIGN_GLYPH, useZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import { JournalComposer } from "@/components/JournalComposer";

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
    if (found) setEditing(found);
  }, [hash, list]);

  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const zodiac = useZodiac();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-center font-display text-4xl">{t.jTitle}</h1>
      <p className="mt-2 text-center text-lg text-ink-muted">{t.jIntro}</p>
      <p role="status" aria-live="polite" className={status ? "confirm-banner mt-4 text-center" : "sr-only"}>{status && <>✓ {status}</>}</p>

      <JournalComposer editing={editing} onClear={() => setEditing(null)} onStatus={setStatus} />

      <h2 className="mt-10 text-center font-display text-2xl">{t.jPast}</h2>
      {sorted.length === 0 ? <p className="mt-6 text-center">{t.jEmpty}</p> : (
        <ul className="mt-6 space-y-5">
          {sorted.map((j) => {
            const d = new Date(j.date + "T12:00");
            const astro = astroFor(d, zodiac);
            return (
              <li key={j.id}>
                <article className="paper-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg">{j.title || t.jNoTitle}</h3>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" className="btn-ghost !min-h-8 !px-3 !py-0.5 !text-sm" onClick={() => setEditing(j)}>{t.edit}</button>
                      <button type="button" className="btn-ghost !min-h-8 !px-3 !py-0.5 !text-sm" onClick={() => setConfirmId(j.id)}>{t.del}</button>
                    </div>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
                    <time dateTime={j.date}>{d.toLocaleDateString(locale, { dateStyle: "full" })}</time>
                    <span>· {t.phases[astro.phase]}</span>
                    <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[astro.moonSign]}</span>
                    <span>{t.moon}: {t.signs[astro.moonSign]}</span>
                    <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[astro.sunSign]}</span>
                    <span>{t.sun}: {t.signs[astro.sunSign]}</span>
                    {j.kind === "dream" && <><span>·</span><span className="tag">{t.jDreamTag}</span></>}
                  </p>
                  {confirmId === j.id && (
                    <div role="alertdialog" aria-label={t.deleteConfirm} className="confirm-warning mt-3">
                      <p>{t.deleteConfirm}</p>
                      <div className="mt-3 flex gap-3">
                        <button type="button" autoFocus className="btn-ghost flex-1" onClick={() => setConfirmId(null)}>{t.deleteCancel}</button>
                        <button type="button" className="btn-primary flex-1" onClick={() => { deleteJournal(j.id); setConfirmId(null); setStatus(t.jDeleted); }}>{t.deleteYes}</button>
                      </div>
                    </div>
                  )}
                  {j.kind === "dream" ? (
                    <>
                      {j.text && <p className="mt-3 whitespace-pre-line">{j.text}</p>}
                      {(j.dreamType || j.symbols?.some((s) => s.trim())) && (
                        <p className="mt-2 flex flex-wrap gap-1">
                          {j.dreamType && <span className="tag">{t.dreamTypes[j.dreamType]}</span>}
                          {j.symbols?.filter((s) => s.trim()).map((s) => <span key={s} className="tag">{s}</span>)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {j.text && <p className="mt-3 whitespace-pre-line">{j.text}</p>}
                      {j.gratitude.some((g) => g.trim()) && (
                        <div className="mt-3">
                          <p className="text-sm text-ink-muted">{t.jGratefulLead}</p>
                          <ol className="mt-1 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
                        </div>
                      )}
                      {j.moods.length > 0 && <p className="mt-2 text-sm text-ink-muted">{j.moods.map((m) => t.moods[m] ?? m).join(" · ")}</p>}
                      {j.image && <img src={j.image} alt={t.photo} className="mt-3 max-h-80 w-full rounded-md object-cover" />}
                    </>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
