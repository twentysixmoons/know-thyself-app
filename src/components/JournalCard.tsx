import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { AstroLine } from "@/components/AstroLine";
import { deleteJournal, MOOD_COLORS, MOOD_NEUTRAL, type JournalEntry } from "@/lib/journal";

/** Mind-diary card. Reflections and dreams are editable (deep links to the
 *  owning tab); gratitude and feelings entries are standalone and can only be
 *  deleted. All match the Mind page card style. */
export function JournalCard({ j, onStatus, editTo = "/diary" }: { j: JournalEntry; onStatus?: (msg: string) => void; editTo?: "/diary" | "/spirit" }) {
  const { t, locale } = useI18n();
  const d = new Date(j.date + "T12:00");
  const dream = j.kind === "dream";
  const isGratitude = j.kind === "gratitude";
  const isFeelings = j.kind === "feelings";
  const canEdit = !isGratitude && !isFeelings;
  const [confirming, setConfirming] = useState(false);
  return (
    <article className="paper-card p-4">
      <h3 className="font-display text-lg">{isGratitude ? t.gratitudeCard : isFeelings ? t.jMoods : (j.title || t.jNoTitle)}</h3>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        <time dateTime={j.date}>{d.toLocaleDateString(locale, { dateStyle: "medium" })}</time>
        <AstroLine date={d} />
        {dream && <span className="tag">{t.jDreamTag}</span>}
      </p>

      {isGratitude ? (
        <ol className="mt-2 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
      ) : isFeelings ? (
        j.moods.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1">
            {j.moods.map((m) => <span key={m} className="tag" style={{ background: MOOD_COLORS[m] ?? MOOD_NEUTRAL }}>{t.moods[m] ?? m}</span>)}
          </p>
        )
      ) : dream ? (
        (j.dreamTypes?.length || j.symbols?.some((s) => s.trim())) && (
          <p className="mt-2 flex flex-wrap gap-1">
            {j.dreamTypes?.map((d) => <span key={d} className="tag">{t.dreamTypes[d]}</span>)}
            {j.symbols?.filter((s) => s.trim()).map((s) => <span key={s} className="tag">{s}</span>)}
          </p>
        )
      ) : (
        j.moods.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1">
            {j.moods.map((m) => <span key={m} className="tag" style={{ background: MOOD_COLORS[m] ?? MOOD_NEUTRAL }}>{t.moods[m] ?? m}</span>)}
          </p>
        )
      )}

      {j.text && <p className="mt-3 line-clamp-4 whitespace-pre-line">{j.text}</p>}
      {!dream && !isGratitude && j.gratitude.some((g) => g.trim()) && (
        <div className="mt-3">
          <p className="text-sm text-ink-muted">{t.jGratefulLead}</p>
          <ol className="mt-1 list-decimal space-y-1 pl-6">{j.gratitude.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ol>
        </div>
      )}
      {!dream && !isGratitude && j.image && <img src={j.image} alt={t.photo} className="mt-3 max-h-48 w-full rounded-md object-cover" />}

      <div className="mt-4 flex gap-2">
        {<Link to={editTo} hash={j.id} className="btn-subtle">{t.edit}</Link>}
        <button type="button" className="btn-subtle" onClick={() => setConfirming(true)}>{t.del}</button>
      </div>

      {confirming && (
        <div role="alertdialog" aria-label={t.deleteConfirm} className="confirm-warning mt-3">
          <p>{t.deleteConfirm}</p>
          <div className="mt-3 flex gap-3">
            <button type="button" autoFocus className="btn-ghost flex-1" onClick={() => setConfirming(false)}>{t.deleteCancel}</button>
            <button type="button" className="btn-primary flex-1" onClick={() => { deleteJournal(j.id); onStatus?.(t.statusDeleted(j.kind === "dream" ? t.typeDream : j.kind === "gratitude" ? t.typeGratitude : j.kind === "feelings" ? t.typeFeeling : t.typeReflection)); }}>{t.deleteYes}</button>
          </div>
        </div>
      )}
    </article>
  );
}
