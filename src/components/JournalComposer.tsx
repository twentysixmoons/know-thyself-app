import { Cloud, Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { astroFor, useZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import { AstroLine } from "@/components/AstroLine";
import { DREAM_TYPES, deleteJournal, dreamShade, saveJournal, type DreamType, type JournalEntry, type JournalKind } from "@/lib/journal";

const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = img.width * scale; c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.75);
}

type Mode = "idle" | "date" | "form";
const MAX_SYMBOLS = 12;

/** The diary entry flow: a create button, then the matching form (a date step
 *  is reachable from the form). The kind is fixed per page — daily on Mind,
 *  dreams on Spirit. */
export function JournalComposer({ moodKind = "daily", editing, onClear, onStatus }: { moodKind?: JournalKind; editing: JournalEntry | null; onClear: () => void; onStatus: (msg: string) => void }) {
  const { t, locale } = useI18n();
  const zodiac = useZodiac();
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [kind, setKind] = useState<JournalKind>(moodKind);
  const [editId, setEditId] = useState<string | undefined>();
  const [date, setDate] = useState(today());
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [symbols, setSymbols] = useState<string[]>([""]);
  const [dreamTypes, setDreamTypes] = useState<DreamType[]>([]);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const entryAstro = astroFor(new Date(date + "T12:00"), zodiac);

  const load = (j: JournalEntry) => {
    setEditId(j.id); setDate(j.date); setTitle(j.title ?? ""); setText(j.text);
    setImage(j.image);
    setKind(j.kind === "dream" ? "dream" : moodKind);
    setSymbols(j.symbols?.length ? [...j.symbols] : [""]);
    setDreamTypes(j.dreamTypes ?? []); setError(""); setConfirmDel(false);
  };
  useEffect(() => { if (editing) { load(editing); setMode("form"); } }, [editing]);
  /** Bring the card into view when the flow opens or a different entry is edited
   *  (deep links from Insights). Instant and only when out of view — a smooth
   *  scroll here fights the nav bar's compact transition and makes it flicker. */
  const prevMode = useRef<Mode>("idle");
  useEffect(() => {
    const opened = prevMode.current === "idle" && mode !== "idle";
    prevMode.current = mode;
    const el = rootRef.current;
    if (el && (opened || editing)) {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: "start" });
    }
  }, [mode, editing]);

  const reset = () => {
    setMode("idle"); setKind(moodKind); setEditId(undefined); setDate(today()); setTitle(""); setText("");
    setImage(undefined); setSymbols([""]); setDreamTypes([]); setError(""); setConfirmDel(false);
  };
  const cancel = () => { reset(); onClear(); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === "dream") {
      if (!text.trim() && !title.trim() && !symbols.some((s) => s.trim())) { setError(t.jDreamRequired); return; }
      if (!dreamTypes.length) { setError(t.jDreamTypeRequired); return; }
      saveJournal({ id: editId, date, kind, title: title.trim().slice(0, 120), text: text.trim().slice(0, 5000), gratitude: [], moods: [], dreamTypes, symbols: symbols.map((s) => s.trim().slice(0, 80)).filter(Boolean) });
      onStatus(t.statusSaved(t.typeDream));
      reset(); onClear();
      return;
    }
    // Gratitude and feelings are their own daily cards — entries carry only
    // the writing, headline, photo and date. Legacy gratitude/moods on old
    // entries stay untouched unless the user edits those fields.
    if (editId) {
      saveJournal({
        id: editId, date, kind, title: title.trim().slice(0, 120), text: text.trim().slice(0, 5000),
        gratitude: (editing?.gratitude ?? []).map((n) => n.slice(0, 300)),
        moods: editing?.moods ?? [], image,
      });
      onStatus(t.statusSaved(t.typeReflection));
      reset(); onClear();
      return;
    }
    if (!text.trim() && !title.trim()) { setError(t.jRequired); return; }
    saveJournal({ date, kind, title: title.trim().slice(0, 120), text: text.trim().slice(0, 5000), gratitude: [], moods: [], image });
    onStatus(t.statusSaved(t.typeReflection));
    reset(); onClear();
  };

  const actionsBlock = (
    <>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary flex-1">{editId ? (kind === "dream" ? t.jDreamUpdate : t.jUpdate) : (kind === "dream" ? t.jDreamSave : t.jSave)}</button>
        <button type="button" className="btn-ghost" onClick={cancel}>{t.deleteCancel}</button>
        {editId && <button type="button" className="btn-ghost" onClick={() => setConfirmDel(true)}>{t.del}</button>}
      </div>
      {editId && confirmDel && (
        <div role="alertdialog" aria-label={t.deleteConfirm} className="confirm-warning">
          <p>{t.deleteConfirm}</p>
          <div className="mt-3 flex gap-3">
            <button type="button" autoFocus className="btn-ghost flex-1" onClick={() => setConfirmDel(false)}>{t.deleteCancel}</button>
            <button type="button" className="btn-primary flex-1" onClick={() => { deleteJournal(editId); setConfirmDel(false); onStatus(t.statusDeleted(kind === "dream" ? t.typeDream : t.typeReflection)); reset(); onClear(); }}>{t.deleteYes}</button>
          </div>
        </div>
      )}
    </>
  );

  const astroLine = (
    <p className="flex flex-wrap items-center gap-1 text-sm text-ink-muted" aria-live="polite">
      <AstroLine date={new Date(date + "T12:00")} />
    </p>
  );

  return (
    <div ref={rootRef} className="mt-6 scroll-mt-4">
      {mode === "idle" && (
        <button type="button" onClick={() => setMode("form")} className="paper-card flex w-full items-center justify-center gap-3 px-5 py-6 text-lg font-semibold">
          <span className="btn-primary !min-h-11 !min-w-11 !rounded-full !px-0 !py-0" aria-hidden="true">
            {moodKind === "dream" ? <Cloud className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
          </span>
          {moodKind === "dream" ? t.jAddDream : t.jCreate}        </button>
      )}

      {mode === "date" && (
        <div className="paper-card flex flex-col gap-5 p-5">
          <label className="field"><span>{t.jDate}</span>
            <input type="date" className="input" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            {astroLine}
          </label>
          <button type="button" className="btn-primary flex-1" onClick={() => setMode("form")}>{t.jContinue}</button>
        </div>
      )}

      {mode === "form" && (
        <form onSubmit={submit} className="flex flex-col gap-4" aria-label={editId ? (kind === "dream" ? t.jDreamUpdate : t.jUpdate) : (kind === "dream" ? t.jDreamSave : t.jNew)}>
          {kind === "daily" ? (
            <>
              <div className="paper-card flex flex-col gap-5 p-5">
                <label className="field"><span>{t.jWrite}</span>
                  <textarea className="input min-h-40" rows={6} maxLength={5000} value={text} placeholder={t.jWritePh}
                    onChange={(e) => { setText(e.target.value); setError(""); }} aria-invalid={!!error} />
                  {error && <span role="alert" className="text-destructive">{error}</span>}
                </label>
                <label className="field"><span>{t.jTitleField}</span>
                  <input className="input" value={title} maxLength={120} placeholder={t.jTitlePh} onChange={(e) => { setTitle(e.target.value); setError(""); }} />
                </label>
                <div className="field">
                  <label htmlFor="j-img">{t.photo}</label>
                  <input id="j-img" type="file" accept="image/*" className="input py-3" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await shrink(f)); e.target.value = ""; }} />
                  {image && <div className="mt-2 flex items-end gap-3"><img src={image} alt={t.photo} className="h-28 rounded-md object-cover" /><button type="button" className="btn-ghost" onClick={() => setImage(undefined)}>{t.removePhoto}</button></div>}
                </div>
                <div className="field">

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold"><time dateTime={date}>{new Date(date + "T12:00").toLocaleDateString(locale, { dateStyle: "full" })}</time></p>
                    <button type="button" className="cursor-pointer text-sm text-ink-muted underline underline-offset-2 hover:text-ink" onClick={() => setMode("date")}>{t.jChangeDate}</button>
                  </div>
                  {astroLine}
                </div>
                {actionsBlock}
              </div>
            </>
          ) : (
            <div className="paper-card flex flex-col gap-5 p-5">
              <label className="field"><span>{t.jDreamWrite}</span>
                <textarea className="input min-h-40" rows={6} maxLength={5000} value={text} placeholder={t.jDreamWritePh}
                  onChange={(e) => { setText(e.target.value); setError(""); }} />
              </label>
              <fieldset className="field">
                <legend>{t.jSymbols}</legend>
                {symbols.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input" value={s} maxLength={80} aria-label={t.jSymbolLabel(i + 1)} placeholder={t.jSymbolPh}
                      onChange={(e) => { setSymbols(symbols.map((x, k) => (k === i ? e.target.value : x))); setError(""); }} />
                    <button type="button" className="btn-ghost !min-h-11 !min-w-11 !px-2" aria-label={t.jRemoveSymbol}
                      onClick={() => setSymbols(symbols.length > 1 ? symbols.filter((_, k) => k !== i) : [""])}><X className="h-5 w-5" aria-hidden="true" /></button>
                  </div>
                ))}
                {symbols.length < MAX_SYMBOLS && (
                  <button type="button" className="btn-ghost self-start !min-h-11" onClick={() => { setSymbols([...symbols, ""]); setError(""); }}>
                    <Plus className="h-5 w-5" aria-hidden="true" />{t.jAddSymbol}
                  </button>
                )}
              </fieldset>
              <fieldset className="field">
                <legend>{t.jDreamKind}</legend>
                <div className="flex flex-wrap gap-2">
                  {DREAM_TYPES.map((d, i) => (
                    <label key={d} className="chip chip-lg" style={dreamTypes.includes(d)
                      ? { background: dreamShade(i), color: "var(--paper-light)", borderColor: dreamShade(i), boxShadow: `0 0 14px 2px color-mix(in oklab, ${dreamShade(i)} 45%, transparent)` }
                      : { background: "transparent", color: dreamShade(i), borderColor: dreamShade(i) }}><input type="checkbox" className="sr-only" checked={dreamTypes.includes(d)} onChange={(e) => setDreamTypes(e.target.checked ? [...dreamTypes, d] : dreamTypes.filter((x) => x !== d))} />{t.dreamTypes[d]}</label>
                  ))}
                </div>
              </fieldset>
              <label className="field"><span>{t.jDreamTitle}</span>
                <input className="input" value={title} maxLength={120} placeholder={t.jTitlePh} onChange={(e) => { setTitle(e.target.value); setError(""); }} />
              </label>
              <div className="field">

                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold"><time dateTime={date}>{new Date(date + "T12:00").toLocaleDateString(locale, { dateStyle: "full" })}</time></p>
                  <button type="button" className="cursor-pointer text-sm text-ink-muted underline underline-offset-2 hover:text-ink" onClick={() => setMode("date")}>{t.jChangeDate}</button>
                </div>
                {astroLine}
              </div>
              {error && <span role="alert" className="text-destructive">{error}</span>}
              {actionsBlock}
            </div>
          )}

          {editId && confirmDel && (
            <div role="alertdialog" aria-label={t.deleteConfirm} className="confirm-warning">
              <p>{t.deleteConfirm}</p>
              <div className="mt-3 flex gap-3">
                <button type="button" autoFocus className="btn-ghost flex-1" onClick={() => setConfirmDel(false)}>{t.deleteCancel}</button>
                <button type="button" className="btn-primary flex-1" onClick={() => { deleteJournal(editId); setConfirmDel(false); onStatus(t.statusDeleted(kind === "dream" ? t.typeDream : t.typeReflection)); reset(); onClear(); }}>{t.deleteYes}</button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
