import { Link } from "@tanstack/react-router";
import { astroFor, SIGN_GLYPH, useZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import type { JournalEntry } from "@/lib/journal";

/** Read-only mind-diary card; editing happens on the Diary page. */
export function JournalCard({ j }: { j: JournalEntry }) {
  const { t, locale } = useI18n();
  const zodiac = useZodiac();
  const d = new Date(j.date + "T12:00");
  const astro = astroFor(d, zodiac);
  const dream = j.kind === "dream";
  return (
    <article className="paper-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl">{j.title || t.jNoTitle}</h3>
        <Link to="/diary" hash={j.id} className="btn-ghost !min-h-8 shrink-0 !px-3 !py-0.5 !text-sm">{t.edit}</Link>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        <time dateTime={j.date}>{d.toLocaleDateString(locale, { dateStyle: "medium" })}</time>
        <span>· {t.phases[astro.phase]}</span>
        <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[astro.moonSign]}</span>
        <span>{t.moon}: {t.signs[astro.moonSign]}</span>
        <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[astro.sunSign]}</span>
        <span>{t.sun}: {t.signs[astro.sunSign]}</span>
        {dream && <><span>·</span><span className="tag">{t.jDreamTag}</span></>}
      </p>
      {dream ? (
        <>
          {j.text && <p className="mt-3 line-clamp-4 whitespace-pre-line">{j.text}</p>}
          {(j.dreamType || j.symbols?.some((s) => s.trim())) && (
            <p className="mt-2 flex flex-wrap gap-1">
              {j.dreamType && <span className="tag">{t.dreamTypes[j.dreamType]}</span>}
              {j.symbols?.filter((s) => s.trim()).map((s) => <span key={s} className="tag">{s}</span>)}
            </p>
          )}
        </>
      ) : (
        <>
          {j.text && <p className="mt-3 line-clamp-4 whitespace-pre-line">{j.text}</p>}
          {j.gratitude.some((g) => g.trim()) && (
            <div className="mt-3">
              <p className="text-sm text-ink-muted">{t.jGratefulLead}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
            </div>
          )}
          {j.moods.length > 0 && <p className="mt-2 text-sm text-ink-muted">{j.moods.map((m) => t.moods[m] ?? m).join(" · ")}</p>}
          {j.image && <img src={j.image} alt={t.photo} className="mt-3 max-h-48 w-full rounded-md object-cover" />}
        </>
      )}
    </article>
  );
}
