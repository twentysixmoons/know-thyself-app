import { Link } from "@tanstack/react-router";
import { astroFor } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import type { JournalEntry } from "@/lib/journal";

/** Read-only mind-diary card; editing happens on the Diary page. */
export function JournalCard({ j }: { j: JournalEntry }) {
  const { t, locale } = useI18n();
  const d = new Date(j.date + "T12:00");
  const nice = j.gratitude.filter((g) => g.trim());
  return (
    <article className="paper-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-muted"><time dateTime={j.date}>{d.toLocaleDateString(locale, { dateStyle: "medium" })}</time> · {t.phases[astroFor(d).phase]}</p>
        <Link to="/diary" hash={j.id} className="btn-ghost !min-h-8 !px-3 !py-0.5 !text-sm">{t.edit}</Link>
      </div>
      <h3 className="mt-2 font-display text-2xl">{j.title || t.jNoTitle}</h3>
      {nice.length > 0 && <ol className="mt-3 list-decimal space-y-1 pl-6">{nice.map((g, i) => <li key={i}>{g}</li>)}</ol>}
      {j.text && <p className="mt-3 line-clamp-4 whitespace-pre-line">{j.text}</p>}
      {j.moods.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{j.moods.map((m) => <span key={m} className="tag">{t.moods[m]}</span>)}</p>}
      {j.image && <img src={j.image} alt={t.photo} className="mt-3 max-h-48 w-full rounded-md object-cover" />}
    </article>
  );
}
