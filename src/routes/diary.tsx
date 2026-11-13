import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MOODS, deleteJournal, saveJournal, useJournal, type JournalEntry, type Mood } from "@/lib/journal";
import { astroFor, SIGN_GLYPH, useZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";

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

const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = img.width * scale; c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.75);
}

function Diary() {
  const { t, locale } = useI18n();
  const list = useJournal();
  const [editId, setEditId] = useState<string | undefined>();
  const [date, setDate] = useState(today());
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [nice, setNice] = useState(["", "", ""]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [image, setImage] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const zodiac = useZodiac();
  const entryAstro = astroFor(new Date(date + "T12:00"), zodiac);

  const reset = () => { setEditId(undefined); setDate(today()); setTitle(""); setText(""); setNice(["", "", ""]); setMoods([]); setImage(undefined); setError(""); };
  const load = (j: JournalEntry) => { setEditId(j.id); setDate(j.date); setTitle(j.title ?? ""); setText(j.text); setNice([0, 1, 2].map((i) => j.gratitude[i] ?? "")); setMoods(j.moods); setImage(j.image); };
  const edit = (j: JournalEntry) => { load(j); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  /** Deep link: /diary#<entry id> (from the Patterns page) opens that entry in the form, scrolled into view. */
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    if (!hash) return;
    const j = list.find((x) => x.id === hash);
    if (!j) return;
    load(j);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, list]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !title.trim() && !nice.some((n) => n.trim())) { setError(t.jRequired); return; }
    saveJournal({ id: editId, date, title: title.trim().slice(0, 120), text: text.trim().slice(0, 5000), gratitude: nice.map((n) => n.trim().slice(0, 300)), moods, image });
    setStatus(t.jSaved); reset();
  };
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-center font-display text-4xl">{t.jTitle}</h1>
      <p className="mt-2 text-center text-lg text-ink-muted">{t.jIntro}</p>
      <p role="status" aria-live="polite" className={status ? "confirm-banner mt-4 text-center" : "sr-only"}>{status && <>✓ {status}</>}</p>

      <form ref={formRef} onSubmit={submit} className="paper-card mt-6 flex flex-col gap-5 p-5 scroll-mt-4" aria-label={editId ? t.jUpdate : t.jNew}>
        <label className="field"><span>{t.jDate}</span>
          <input type="date" className="input" value={date} max={today()} onChange={(e) => setDate(e.target.value)} required />
          <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted" aria-live="polite">
            <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[entryAstro.sunSign]}</span>
            <span>{t.sun}: {t.signs[entryAstro.sunSign]}</span>
            <span className="mx-1">·</span>
            <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[entryAstro.moonSign]}</span>
            <span>{t.moon}: {t.signs[entryAstro.moonSign]}</span>
            <span className="mx-1">·</span>
            <span>{t.phases[entryAstro.phase]}</span>
          </p>
        </label>
        <label className="field"><span>{t.jTitleField}</span>
          <input className="input" value={title} maxLength={120} placeholder={t.jTitlePh} onChange={(e) => { setTitle(e.target.value); setError(""); }} />
        </label>
        <label className="field"><span>{t.jWrite}</span>
          <textarea className="input min-h-40" rows={6} maxLength={5000} value={text} placeholder={t.jWritePh}
            onChange={(e) => { setText(e.target.value); setError(""); }} aria-invalid={!!error} />
          {error && <span role="alert" className="text-destructive">{error}</span>}
        </label>
        <fieldset className="field">
          <legend>{t.jNice}</legend>
          {nice.map((n, i) => (
            <input key={i} className="input" value={n} maxLength={300} aria-label={t.jNicePh(i + 1)} placeholder={`${i + 1}. ${t.jNicePh(i + 1)}`}
              onChange={(e) => { setNice(nice.map((x, k) => (k === i ? e.target.value : x))); setError(""); }} />
          ))}
        </fieldset>
        <fieldset className="field">
          <legend>{t.jMoods}</legend>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <label key={m} className="chip"><input type="checkbox" className="sr-only" checked={moods.includes(m)} onChange={(e) => setMoods(e.target.checked ? [...moods, m] : moods.filter((x) => x !== m))} />{t.moods[m]}</label>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="j-img">{t.photo}</label>
          <input id="j-img" type="file" accept="image/*" className="input py-3" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await shrink(f)); e.target.value = ""; }} />
          {image && <div className="mt-2 flex items-end gap-3"><img src={image} alt={t.photo} className="h-28 rounded-md object-cover" /><button type="button" className="btn-ghost" onClick={() => setImage(undefined)}>{t.removePhoto}</button></div>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary flex-1">{editId ? t.jUpdate : t.jSave}</button>
          {editId && <button type="button" className="btn-ghost" onClick={reset}>{t.deleteCancel}</button>}
        </div>
      </form>

      <h2 className="mt-10 text-center font-display text-2xl">{t.jPast}</h2>
      {sorted.length === 0 ? <p className="mt-6 text-center">{t.jEmpty}</p> : (
        <ul className="mt-6 space-y-5">
          {sorted.map((j) => (
            <li key={j.id}>
              <article className="paper-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink-muted"><time dateTime={j.date}>{new Date(j.date + "T12:00").toLocaleDateString(locale, { dateStyle: "full" })}</time> · {t.phases[astroFor(new Date(j.date + "T12:00")).phase]}</p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-ghost !min-h-8 !px-3 !py-0.5 !text-sm" onClick={() => edit(j)}>{t.edit}</button>
                    <button type="button" className="btn-ghost !min-h-8 !px-3 !py-0.5 !text-sm" onClick={() => setConfirmId(j.id)}>{t.del}</button>
                  </div>
                </div>
                {confirmId === j.id && (
                  <div role="alertdialog" aria-label={t.deleteConfirm} className="mt-3 flex flex-wrap items-center gap-3">
                    <span>{t.deleteConfirm}</span>
                    <button type="button" autoFocus className="btn-ghost" onClick={() => setConfirmId(null)}>{t.deleteCancel}</button>
                    <button type="button" className="btn-primary" onClick={() => { deleteJournal(j.id); setConfirmId(null); setStatus(t.jDeleted); }}>{t.deleteYes}</button>
                  </div>
                )}
                {j.title && <h3 className="mt-2 font-display text-lg">{j.title}</h3>}
                {j.moods.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{j.moods.map((m) => <span key={m} className="tag">{t.moods[m] ?? m}</span>)}</p>}
                {j.gratitude.some((g) => g.trim()) && (
                  <ol className="mt-3 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
                )}
                {j.text && <p className="mt-3 whitespace-pre-line">{j.text}</p>}
                {j.image && <img src={j.image} alt={t.photo} className="mt-3 max-h-80 w-full rounded-md object-cover" />}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
