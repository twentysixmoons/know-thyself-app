import { useEffect, useId, useRef, useState } from "react";
import { CloudRain, Sun } from "lucide-react";
import { FACTOR_GROUPS, saveEntry, deleteEntry, type Entry, type Factor, type Feeling } from "@/lib/entries";
import { REGIONS, type RegionId } from "@/lib/regions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const STEPS = 5;

async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const scale = Math.min(1, 640 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = img.width * scale; c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0); URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.72);
}

/** Body-entry wizard: where & when → pain or pleasure → intensity → what you
 *  feel → anything else. One focused step per screen instead of one long form. */
export function EntryDialog({ region, regions, editing, history, onClose, onSaved }: {
  region: RegionId | null; regions?: RegionId[]; editing?: Entry | null; history: Entry[]; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(today());
  const [intensity, setIntensity] = useState(3);
  const [feeling, setFeeling] = useState<Feeling>("pain");
  const [anchor, setAnchor] = useState<RegionId[]>([]);
  const [notes, setNotes] = useState("");
  const [factors, setFactors] = useState<Factor[]>([]);
  const [image, setImage] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [parts, setParts] = useState<RegionId[]>(["head"]);
  const toggle = (r: RegionId, on: boolean) => setParts((p) => on ? (p.includes(r) ? p : [...p, r]) : p.filter((x) => x !== r));
  const setMany = (rs: RegionId[]) => setParts((p) => { const all = rs.every((r) => p.includes(r)); return all ? p.filter((x) => !rs.includes(x)) : [...p, ...rs.filter((r) => !p.includes(r))]; });
  const open = region !== null;

  useEffect(() => {
    const d = ref.current; if (!d) return;
    setConfirmDelete(false);
    if (open) {
      setStep(0);
      setDate(editing?.date ?? today()); setIntensity(editing?.intensity ?? 3); setFeeling(editing?.feeling ?? "pain");
      setNotes(editing?.notes ?? ""); setFactors(editing?.factors ?? []); setImage(editing?.image); setError("");
      if (region) { const init = editing ? [editing.region] : regions?.length ? regions : [region]; setParts(init); setAnchor(init); }
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [open, editing]);

  if (!region) return <dialog ref={ref} className="hidden" />;
  const area = parts.map((p) => t.regions[p]).join(", ");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) { setError(t.required); go(3); return; }
    if (!parts.length) { setError(t.bodyPart); go(0); return; }
    parts.forEach((p, i) => saveEntry({ id: i === 0 ? editing?.id : undefined, date, region: p, intensity, kind: "body", notes: notes.trim().slice(0, 2000), factors, image, feeling }));
    onSaved(t.statusSaved(parts.length > 1 ? `${t.typeBodyEntry}s` : t.typeBodyEntry)); onClose();
  };
  const go = (n: number) => {
    setError("");
    if (n > 0 && !parts.length) { setError(t.bodyPart); setStep(0); return; }
    if (n > 3 && !notes.trim()) { setError(t.required); setStep(3); return; }
    setStep(n);
  };
  const anchorPts = REGIONS.filter((r) => anchor.includes(r.id));
  const dist = (r: (typeof REGIONS)[number]) => anchor.includes(r.id) ? -1 : Math.min(...anchorPts.map((a) => (a.x - r.x) ** 2 + (a.y - r.y) ** 2), Infinity);
  // "general" is always the first chip; the two backs sit next to each other.
  const rest = [...REGIONS].sort((a, b) => dist(a) - dist(b)).filter((r) => r.id !== "general");
  const ub = rest.findIndex((r) => r.id === "upperBack");
  const lb = rest.findIndex((r) => r.id === "lowerBack");
  if (ub !== -1 && lb !== -1) { const item = rest.splice(ub, 1)[0]!; rest.splice(ub < lb ? lb - 1 : lb, 0, item); }
  const ordered = [REGIONS.find((r) => r.id === "general")!, ...rest];
  const past = history.filter((h) => parts.includes(h.region) && h.id !== editing?.id).slice(0, 3);

  const nav = () => (
    <div className="flex flex-wrap gap-3">
      {step > 0 && <button type="button" className="btn-ghost" onClick={() => go(step - 1)}>{t.jBack}</button>}
      {step < STEPS - 1
        ? <button type="button" className="btn-primary flex-1" onClick={() => go(step + 1)}>{t.next}</button>
        : <button type="submit" className="btn-primary flex-1">{editing ? t.update : t.save}</button>}
      <button type="button" className="btn-ghost" onClick={onClose}>{t.deleteCancel}</button>
      {editing && step === STEPS - 1 && <Button type="button" variant="outline" className="btn-ghost" onClick={() => setConfirmDelete(true)}>{t.del}</Button>}
    </div>
  );

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={`${id}-t`} className="entry-dialog">
      {confirmDelete ? (
        <section role="alertdialog" aria-modal="true" aria-labelledby={`${id}-delete`} className="flex flex-col gap-6 p-5 sm:p-7">
          <h2 id={`${id}-delete`} className="font-display text-2xl">{t.deleteConfirm}</h2>
          <div className="flex flex-wrap gap-3">
            <Button autoFocus variant="outline" className="btn-ghost" onClick={() => setConfirmDelete(false)}>{t.deleteCancel}</Button>
            <Button className="btn-primary" onClick={() => {
              if (!editing) return;
              deleteEntry(editing.id); onSaved(t.statusDeleted(t.typeBodyEntry)); onClose();
            }}>{t.deleteYes}</Button>
          </div>
        </section>
      ) : <form onSubmit={submit} className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 id={`${id}-t`} className="font-display text-xl"><span aria-hidden="true">{t.dialogTitle}…</span><span className="sr-only">{t.dialogTitle} {area}</span></h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-ink-muted transition hover:bg-muted hover:text-foreground" aria-label={t.cancel}>✕</button>
        </div>
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => <span key={i} className="h-1.5 w-6 rounded-full transition-colors" style={{ background: i <= step ? "var(--btn-orange)" : "oklch(0.55 0.02 280 / 25%)" }} />)}
        </div>

        {step === 0 && (
          <>
            <label className="field">
              <span>{t.date}</span>
              <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} required className="input" />
            </label>
            <fieldset className="field">
              <legend>{t.bodyPart}</legend>
              <div className="flex flex-wrap gap-2">
                {(["L", "R"] as const).map((s) => { const arm = [`arm${s}`, `elbow${s}`, `forearm${s}`, `hand${s}`] as RegionId[]; return (
                  <Button key={s} type="button" variant="outline" className="chip chip-body" aria-pressed={arm.every((r) => parts.includes(r))} onClick={() => setMany(arm)}>{s === "L" ? t.wholeArmL : t.wholeArmR}</Button>
                ); })}
              </div>
              <div className="flex flex-wrap gap-2 p-1">
                {ordered.map((r) => (
                  <label key={r.id} className="chip chip-body capitalize"><input type="checkbox" className="sr-only" checked={parts.includes(r.id)} onChange={(e) => toggle(r.id, e.target.checked)} />{t.regions[r.id]}</label>
                ))}
              </div>
            </fieldset>
            {nav()}
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-center font-display text-2xl">{t.feelQ}</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" aria-pressed={feeling === "pain"} onClick={() => setFeeling("pain")}
                className="flex flex-1 items-center gap-3 card-shape border-2 border-input bg-paper-light p-4 text-left hover:border-[var(--btn-orange)]" data-on={feeling === "pain"}>
                <CloudRain className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span className="flex flex-col"><span className="font-display text-lg">{t.pain}</span><span className="text-sm text-ink-muted">{t.painHint}</span></span>
              </button>
              <button type="button" aria-pressed={feeling === "pleasure"} onClick={() => setFeeling("pleasure")}
                className="flex flex-1 items-center gap-3 card-shape border-2 border-input bg-paper-light p-4 text-left hover:border-[var(--btn-orange)]" data-on={feeling === "pleasure"}>
                <Sun className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span className="flex flex-col"><span className="font-display text-lg">{t.pleasure}</span><span className="text-sm text-ink-muted">{t.pleasureHint}</span></span>
              </button>
            </div>
            {nav()}
          </>
        )}

        {step === 2 && (
          <>
            <div className="field">
              <span>{feeling === "pleasure" ? t.pleasureIntensity : t.painIntensity}</span>
              <div className="intensity-choice" role="radiogroup" aria-label={feeling === "pleasure" ? t.pleasureIntensity : t.painIntensity} aria-describedby={`${id}-ih`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={intensity === n} data-on={n <= intensity} className="intensity-bubble"
                    onClick={() => setIntensity(n)}
                    onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setIntensity(Math.min(5, intensity + 1)); } if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setIntensity(Math.max(1, intensity - 1)); } }}>{n}</button>
                ))}
              </div>
              <small id={`${id}-ih`} className="text-ink-muted">{feeling === "pleasure" ? t.pleasureScaleHint : t.intensityHint}</small>
            </div>
            {nav()}
          </>
        )}

        {step === 3 && (
          <>
            <label className="field">
              <span>{t.notes}</span>
              <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setError(""); }} rows={4} maxLength={2000} placeholder={t.notesPh}
                className="input min-h-32" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
              {error && <span id={`${id}-err`} role="alert" className="text-destructive">{error}</span>}
            </label>
            {nav()}
          </>
        )}

        {step === 4 && (
          <>
            <fieldset className="field">
              <legend>{t.factors}</legend>
              {FACTOR_GROUPS.map((group, gi) => (
                <div key={gi} className={gi > 0 ? "mt-2 flex flex-wrap gap-2 border-t border-ink/10 pt-2" : "flex flex-wrap gap-2"}>
                  {group.map((f) => (
                    <label key={f} className="chip">
                      <input type="checkbox" className="sr-only" checked={factors.includes(f)} onChange={(e) => setFactors(e.target.checked ? [...factors, f] : factors.filter((x) => x !== f))} />
                      {t.factorNames[f]}
                    </label>
                  ))}
                </div>
              ))}
            </fieldset>
            <div className="field">
              <label htmlFor={`${id}-img`}>{t.photo}</label>
              <input id={`${id}-img`} type="file" accept="image/*" className="input py-3"
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await shrink(f)); }} />
              {image && (
                <div className="mt-2 flex items-end gap-3">
                  <img src={image} alt={`${t.photo}: ${area}`} className="h-28 rounded-md border border-ink/30 object-cover" />
                  <button type="button" className="btn-ghost" onClick={() => setImage(undefined)}>{t.removePhoto}</button>
                </div>
              )}
            </div>
            {error && <span role="alert" className="text-destructive">{error}</span>}
            {nav()}
            {past.length > 0 && (
              <section aria-label={t.areaHistory} className="border-t border-ink/20 pt-4">
                <h3 className="font-display text-xl">{t.areaHistory}</h3>
                <ul className="mt-2 space-y-2">
                  {past.map((p) => (
                    <li key={p.id} className="text-base"><strong>{new Date(p.date + "T12:00").toLocaleDateString(locale, { dateStyle: "medium" })}</strong> · {p.intensity}/5 — {p.notes}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </form>}
    </dialog>
  );
}
