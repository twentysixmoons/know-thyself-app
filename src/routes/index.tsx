import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { EightStar, SettingsMenu, skyMove } from "@/components/AppHeader";
import { BODY_SILHOUETTE, BODY_TRANSFORM } from "@/lib/body-outline";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Know Thyself — a private, local-first diary" },
      { name: "description", content: "A body, mind & spirit diary that lives on your device. No account, no cloud, nothing sent anywhere. Currently in beta." },
      { property: "og:title", content: "Know Thyself — a private, local-first diary" },
      { property: "og:description", content: "A diary that keeps itself: everything stays on your device. No account, no cloud. Currently in beta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-12">
      <div className="mx-auto flex w-full max-w-md justify-end pt-[calc(env(safe-area-inset-top)+1rem)]">
        <SettingsMenu tone="onLight" />
      </div>
      <div className="flex flex-1 items-center justify-center py-8">
        <article className="diary-cover sky-band isolate overflow-hidden" onPointerMove={skyMove}>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <svg viewBox="0 0 200 460" focusable="false" className="h-[440px] w-[191px] shrink-0 fill-current opacity-15 blur-[2.5px]">
              <path d={BODY_SILHOUETTE} transform={BODY_TRANSFORM} />
            </svg>
          </span>
          <span className="absolute right-4 top-4 rounded-full border border-paper/40 px-2.5 py-0.5 text-xs font-semibold tracking-widest uppercase text-paper/70">{t.landingBeta}</span>
          <div className="relative flex flex-col items-center text-center">
            <EightStar />
            <h1 className="mt-4 font-display text-4xl">{t.appName}</h1>
            <p className="mt-2 text-lg opacity-85">{t.tagline}</p>
            <hr className="my-5 w-16 border-0 border-t border-paper/30" />
            <h2 className="sr-only">{t.landingPromiseTitle}</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-paper/85">
              <li>{t.landingPromise1}</li>
              <li>{t.landingPromise2}</li>
              <li>{t.landingPromise3}</li>
            </ul>
            <p className="mt-5 max-w-[18rem] text-center text-xs text-paper/55">{t.landingBetaNote}</p>
            <Link to="/body" className="btn-primary mt-3">{t.landingOpen}</Link>
          </div>
        </article>
      </div>
    </div>
  );
}
