import { Moon, Plus, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { astroFor, SIGN_GLYPH, useZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import { DREAM_TYPES, MOODS, saveJournal, type DreamType, type JournalEntry, type JournalKind, type Mood } from "@/lib/journal";

const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = img.width * scale; c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.75);
}

type Mode = "idle" | "date" | "type" | "form";
const MAX_SYMBOLS = 12;

/** The mind-diary entry flow: a create button, then date → daily/dream choice → the matching form. */
export function JournalComposer({ editing, onClear, onStatus }: { editing: JournalEntry | null; onClear: () => void; onStatus: (msg: string) => void }) {
  const { t, locale } = useI18n();
  const zodiac = useZodiac();
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [kind, setKind] = useState<JournalKind>("daily");
  const [editId, setEditId] = useState<string | undefined>();
  const [date, setDate] = useState(today());
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [nice, setNice] = useState(["", "", ""]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [image, setImage] = useState<string | undefined>();
  const [symbols, setSymbols] = useState<string[]>([""]);
  const [dreamType, setDreamType] = useState<DreamType | undefined>();
  const [error, setError] = useState("");
  const entryAstro = astroFor(new Date(date + "T12:00"), zodiac);

  const load = (j: JournalEntry) => {
    setEditId(j.id); setDate(j.date); setTitle(j.title ?? ""); setText(j.text);
    setNice([0, 1, 2].map((i) => j.gratitude[i] ?? "")); setMoods(j.moods); setImage(j.image);
    setKind(j.kind === "dream" ? "dream" : "daily");
    setSymbols(j.symbols?.length ? [...j.symbols] : [""]);
    setDreamType(j.dreamType); setError("");
  };
  useEffect(() => { if (editing) { load(editing); setMode("form"); } }, [editing]);
  /** Scroll the card into view when the flow opens or a different entry is edited (deep links from Insights). */
  const prevMode = useRef<Mode>("idle");
  useEffect(() => {
    const opened = prevMode.current === "idle" && mode !== "idle";
    prevMode.current = mode;
    if (opened || editing) rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [mode, editing]);

  const reset = () => {
    setMode("idle"); setKind("daily"); setEditId(undefined); setDate(today()); setTitle(""); setText("");
    setNice(["", "", ""]); setMoods([]); setImage(undefined); setSymbols([""]); setDreamType(undefined); setError("");
  };
  const cancel = () => { reset(); onClear(); };
  const chooseKind = (k: JournalKind) => { setKind(k); setMode("form"); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === "dream") {
      if (!text.trim() && !title.trim() && !symbols.some((s) => s.trim())) { setError(t.jDreamRequired); return; }
      if (!dreamType) { setError(t.jDreamTypeRequired); return; }
      saveJournal({ id: editId, date, kind, title: title.trim().slice(0, 120), text: text.trim().slice(0, 5000), gratitude: [], moods: [], dreamType, symbols: symbols.map((s) => s.trim().slice(0, 80)).filter(Boolean) });
      onStatus(t.jDreamSaved);
    } else {
      if (!text.trim() && !title.trim() && !nice.some((n) => n.trim())) { setError(t.jRequired); return; }
      saveJournal({ id: editId, date, kind, title: title.trim().slice(0, 120), text: text.trim().slice(0, 5000), gratitude: nice.map((n) => n.trim().slice(0, 300)), moods, image });
      onStatus(t.jSaved);
    }
    reset(); onClear();
  };

  const astroLine = (
    <p className="flex flex-wrap items-center gap-1 text-sm text-ink-muted" aria-live="polite">
      <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[entryAstro.sunSign]}</span>
      <span>{t.sun}: {t.signs[entryAstro.sunSign]}</span>
      <span className="mx-1">·</span>
      <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[entryAstro.moonSign]}</span>
      <span>{t.moon}: {t.signs[entryAstro.moonSign]}</span>
      <span className="mx-1">·</span>
      <span>{t.phases[entryAstro.phase]}</span>
    </p>
  );

  return (
    <div ref={rootRef} className="mt-6 scroll-mt-4">
      {mode === "idle" && (
        <button type="button" onClick={() => setMode("type")} className="paper-card flex w-full items-center justify-center gap-3 px-5 py-6 text-lg font-semibold">
          <span className="btn-primary !min-h-11 !min-w-11 !rounded-full !px-0 !py-0" aria-hidden="true"><Plus className="h-6 w-6" /></span>
          {t.jCreate}
        </button>
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

      {mode === "type" && (
        <div className="paper-card flex flex-col gap-5 p-5">
          <h2 className="text-center font-display text-2xl">{t.jChooseKind}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="flex flex-1 items-center gap-3 rounded-3xl border-2 border-input bg-paper-light p-4 text-left hover:border-[var(--btn-orange)]" onClick={() => chooseKind("daily")}>
              <Sun className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="flex flex-col"><span className="font-display text-lg">{t.jKindDaily}</span><span className="text-sm text-ink-muted">{t.jKindDailyHint}</span></span>
            </button>
            <button type="button" className="flex flex-1 items-center gap-3 rounded-3xl border-2 border-input bg-paper-light p-4 text-left hover:border-[var(--btn-orange)]" onClick={() => chooseKind("dream")}>
              <Moon className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="flex flex-col"><span className="font-display text-lg">{t.jKindDream}</span><span className="text-sm text-ink-muted">{t.jKindDreamHint}</span></span>
            </button>
          </div>
          <button type="button" className="btn-ghost self-start" onClick={() => setMode("idle")}>{t.jBack}</button>
        </div>
      )}

      {mode === "form" && (
        <form onSubmit={submit} className="paper-card flex flex-col gap-5 p-5" aria-label={editId ? (kind === "dream" ? t.jDreamUpdate : t.jUpdate) : (kind === "dream" ? t.jDreamSave : t.jNew)}>
          <div className="field">
            <span>{t.jDate}</span>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold"><time dateTime={date}>{new Date(date + "T12:00").toLocaleDateString(locale, { dateStyle: "full" })}</time></p>
              <button type="button" className="btn-ghost !min-h-9 !px-3 !py-0.5 !text-sm" onClick={() => setMode("date")}>{t.jChangeDate}</button>
            </div>
            {astroLine}
          </div>

          {kind === "daily" ? (
            <>
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
            </>
          ) : (
            <>
              <label className="field"><span>{t.jTitleField}</span>
                <input className="input" value={title} maxLength={120} placeholder={t.jTitlePh} onChange={(e) => { setTitle(e.target.value); setError(""); }} />
              </label>
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
                  {DREAM_TYPES.map((d) => (
                    <label key={d} className="chip"><input type="radio" name="dream-type" className="sr-only" checked={dreamType === d} onChange={() => { setDreamType(d); setError(""); }} />{t.dreamTypes[d]}</label>
                  ))}
                </div>
              </fieldset>
              {error && <span role="alert" className="text-destructive">{error}</span>}
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary flex-1">{editId ? (kind === "dream" ? t.jDreamUpdate : t.jUpdate) : (kind === "dream" ? t.jDreamSave : t.jSave)}</button>
            <button type="button" className="btn-ghost" onClick={cancel}>{t.deleteCancel}</button>
          </div>
        </form>
      )}
    </div>
  );
}
