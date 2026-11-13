import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { astroFor, nextMoonEvent, useZodiac } from "@/lib/astro";
import { MoonGlyph } from "@/components/AppHeader";

export const Route = createFileRoute("/spirit")({
  head: () => ({
    meta: [
      { title: "Spirit — Know Thyself" },
      { name: "description", content: "Sun, moon and phase guidance for your spirit." },
      { property: "og:title", content: "Spirit — Know Thyself" },
      { property: "og:description", content: "Sun, moon and phase guidance for your spirit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Spirit,
});

function Spirit() {
  const { t } = useI18n();
  const zodiac = useZodiac();
  const a = astroFor(new Date(), zodiac);
  const m = nextMoonEvent();
  const mDays = Math.round(m.days);

  return (
    <div className="mx-auto min-h-[120dvh] max-w-5xl px-5 py-8">
      <h1 className="text-center font-display text-5xl">{t.spiritTitle}</h1>
      <section aria-labelledby="mn" className="paper-card mt-8 p-5 text-center">
        <h2 id="mn" className="font-display text-3xl">{t.moonNames[a.phase]}</h2>
        <div className="mt-3 flex justify-center"><MoonGlyph illumination={a.illumination} waxing={a.waxing} size={56} /></div>
        <p className="mt-3 text-lg">{t.sugg[`moon_${a.phase}`]?.("")}</p>
        <p className="mt-2 text-ink-muted">{t.moonTarget[m.target]} {mDays === 0 ? t.moonTonight : t.moonInDays(mDays)}</p>
      </section>
    </div>
  );
}
