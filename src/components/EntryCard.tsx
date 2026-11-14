import { useState } from "react";
import { deleteEntry, type Entry } from "@/lib/entries";
import { useI18n } from "@/lib/i18n";
import { AstroLine } from "@/components/AstroLine";

/** Body-diary card matching the Mind page: tag chips, btn-subtle Edit/Delete
 *  with the same inline confirm. */
export function EntryCard({ e, onEdit, onStatus }: { e: Entry; onEdit?: () => void; onStatus?: (msg: string) => void }) {
  const { t, locale } = useI18n();
  const d = new Date(e.date + "T12:00");
  const [confirming, setConfirming] = useState(false);
  return (
    <article className="paper-card flex gap-4 p-4">
      {e.image && <img src={e.image} alt={`${t.photo}: ${t.regions[e.region]}`} className="h-20 w-20 shrink-0 rounded-md object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
          <time dateTime={e.date}>{d.toLocaleDateString(locale, { dateStyle: "medium" })}</time>
          <AstroLine date={d} />
        </p>
        <h3 className="font-display text-2xl capitalize">{t.regions[e.region]} <span className="text-base font-sans text-ink-muted">· {t[e.feeling ?? "pain"]} · {t.strength} {e.intensity}/5 <span aria-hidden="true" className="ml-1 inline-flex gap-0.5 align-middle">{[1,2,3,4,5].map((n) => <span key={n} className="intensity-dot" data-on={n <= e.intensity} />)}</span></span></h3>
        <p className="mt-1">{e.notes}</p>
        {e.factors.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{e.factors.map((f) => <span key={f} className="tag">{t.factorNames[f]}</span>)}</p>}
        <div className="mt-4 flex gap-2">
          {onEdit && <button type="button" onClick={onEdit} className="btn-subtle">{t.edit}</button>}
          <button type="button" className="btn-subtle" onClick={() => setConfirming(true)}>{t.del}</button>
        </div>
        {confirming && (
          <div role="alertdialog" aria-label={t.deleteConfirm} className="confirm-warning mt-3">
            <p>{t.deleteConfirm}</p>
            <div className="mt-3 flex gap-3">
              <button type="button" autoFocus className="btn-ghost flex-1" onClick={() => setConfirming(false)}>{t.deleteCancel}</button>
              <button type="button" className="btn-primary flex-1" onClick={() => { deleteEntry(e.id); onStatus?.(t.deleted); }}>{t.deleteYes}</button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
