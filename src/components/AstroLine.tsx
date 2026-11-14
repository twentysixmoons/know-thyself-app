import { astroFor, SIGN_GLYPH, useZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";

/** The one astrology line used on every card:
 *  phase, moon symbol, moon sign moon · sun symbol, sun sign sun */
export function AstroLine({ date, className }: { date: Date; className?: string }) {
  const { t, locale } = useI18n();
  const zodiac = useZodiac();
  const a = astroFor(date, zodiac);
  const lower = (s: string) => s.toLocaleLowerCase(locale);
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      <span>{t.phases[a.phase]}</span>
      <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[a.moonSign]}</span>
      <span>{t.signs[a.moonSign]}</span>
      <span>{lower(t.moon)}</span>
      <span>·</span>
      <span aria-hidden="true" className="zodiac-glyph">{SIGN_GLYPH[a.sunSign]}</span>
      <span>{t.signs[a.sunSign]}</span>
      <span>{lower(t.sun)}</span>
    </span>
  );
}
