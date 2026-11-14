import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { EightStar, MoonGlyph, SunGlyph, skyMove } from "@/components/AppHeader";
import { astroFor, SIGN_GLYPH, useZodiac } from "@/lib/astro";
import { HeaderDateTime, HeaderLocation } from "@/components/HeaderDateLocation";
import { BODY_SILHOUETTE, BODY_TRANSFORM } from "@/lib/body-outline";
import { LOCATION_EVENT } from "@/hooks/use-location";

export const Route = createFileRoute("/cover")({
  head: () => ({
    meta: [{ title: "Cover — Know Thyself" }],
  }),
  component: Cover,
});

/* The diary's front matter: everything the persistent header used to hold —
   logo, date & time, sun & moon positions, location — now lives on its own
   page, reached through the journal icon in the nav bar. */
function Cover() {
  const { t } = useI18n();
  const zodiac = useZodiac();
  // The sun & moon positions recompute whenever the place changes, so a new
  // location always pairs with a fresh date, time, and chart.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    window.addEventListener(LOCATION_EVENT, refresh);
    return () => window.removeEventListener(LOCATION_EVENT, refresh);
  }, []);
  const a = astroFor(now, zodiac);

  return (
    <div className="sky-band flex-1" onPointerMove={skyMove}>
      <div className="mx-auto max-w-5xl px-5 pt-24 pb-5">
        <Link to="/body" className="blur-in relative isolate mx-auto mb-8 flex w-fit flex-col items-center text-paper">
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <svg viewBox="0 0 200 460" focusable="false" className="h-[340px] w-[148px] shrink-0 fill-current opacity-15 blur-[2.5px]">
              <path d={BODY_SILHOUETTE} transform={BODY_TRANSFORM} />
            </svg>
          </span>
          <EightStar />
          <span className="mt-4 font-display text-3xl md:text-5xl">{t.appName}</span>
          <span className="mt-3 text-base opacity-85">{t.tagline}</span>
        </Link>
        <div className="mt-4"><HeaderDateTime /></div>
        <section aria-label={t.positionsTitle} className="my-4 grid w-full max-w-[340px] grid-cols-2 mx-auto items-end gap-10 text-center text-paper">
          <div className="flex flex-col items-center">
            <MoonGlyph illumination={a.illumination} waxing={a.waxing} size={48} />
            <p className="mt-2 text-sm"><span className="sr-only">{t.moon}: </span><span aria-hidden="true" className="zodiac-glyph block text-lg leading-none mb-1">{SIGN_GLYPH[a.moonSign]}</span>{t.signs[a.moonSign]}</p>
            <p className="whitespace-nowrap text-xs opacity-90">{t.phases[a.phase]}</p>
          </div>
          <div className="flex flex-col items-center">
            <SunGlyph eclipse={a.solarEclipse} />
            <p className="mt-2 text-sm"><span className="sr-only">{t.sun}: </span><span aria-hidden="true" className="zodiac-glyph block text-lg leading-none mb-1">{SIGN_GLYPH[a.sunSign]}</span>{t.signs[a.sunSign]}</p>
            <p className="text-xs opacity-90">{a.solarEclipse ? t.eclipse : t.sun}</p>
          </div>
        </section>
        <HeaderLocation />
      </div>
    </div>
  );
}
