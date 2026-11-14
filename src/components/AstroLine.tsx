import { astroFor, SIGN_GLYPH, useZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";

/** The one astrology line used on every card:
 *  Moon: phase, moon symbol, moon sign · Sun: sun symbol, sun sign */
export function AstroLine({ date, className }: { date: Date; className?: string }) {
  const { t } = useI18n();
  const zodiac = useZodiac();
  const a = astroFor(date, zodiac);
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      <span>{t.moon}: {t.phases[a.phase]}</span>
      <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[a.moonSign]}</span>
      <span>{t.signs[a.moonSign]}</span>
      <span>·</span>
      <span>{t.sun}:</span>
      <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[a.sunSign]}</span>
      <span>{t.signs[a.sunSign]}</span>
    </span>
  );
}
