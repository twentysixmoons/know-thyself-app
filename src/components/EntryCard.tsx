import type { Entry } from "@/lib/entries";
import { useI18n } from "@/lib/i18n";
import { astroFor } from "@/lib/astro";

export function EntryCard({ e, onEdit }: { e: Entry; onEdit?: () => void }) {
  const { t, locale } = useI18n();
  const a = astroFor(new Date(e.date + "T12:00"));
  return (
    <article className="paper-card flex gap-4 p-4">
      {e.image && <img src={e.image} alt={`${t.photo}: ${t.regions[e.region]}`} className="h-20 w-20 shrink-0 rounded-md object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-muted">
          <time dateTime={e.date}>{new Date(e.date + "T12:00").toLocaleDateString(locale, { dateStyle: "medium" })}</time> · {t.phases[a.phase]}
        </p>
        <h3 className="font-display text-2xl capitalize">{t.regions[e.region]} <span className="text-base font-sans text-ink-muted">· {t[e.kind]} · {t.strength} {e.intensity}/5 <span aria-hidden="true" className="ml-1 inline-flex gap-0.5 align-middle">{[1,2,3,4,5].map((n) => <span key={n} className="intensity-dot" data-on={n <= e.intensity} />)}</span></span></h3>
        <p className="mt-1">{e.notes}</p>
        {e.factors.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{e.factors.map((f) => <span key={f} className="tag">{t.factorNames[f]}</span>)}</p>}
      </div>
      {onEdit && <button type="button" onClick={onEdit} className="btn-ghost self-start !min-h-8 !min-w-0 !px-3 !py-0.5 !text-sm" aria-label={`${t.edit}: ${t.regions[e.region]}`}>{t.edit}</button>}
    </article>
  );
}
