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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-12">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 md:flex-row md:items-start md:justify-center">
        <article className="diary-cover sky-band isolate shrink-0 overflow-hidden" onPointerMove={skyMove}>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <svg viewBox="0 0 200 460" focusable="false" className="h-[460px] w-[200px] shrink-0 fill-current opacity-15 blur-[2.5px]">
              <path d={BODY_SILHOUETTE} transform={BODY_TRANSFORM} />
            </svg>
          </span>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-b from-ink/55 via-ink/30 to-ink/60" />
          <div className="absolute right-2 top-2">
            <SettingsMenu tone="onDark" />
          </div>
          <div className="relative z-10 flex flex-col items-center py-10 text-center">
            <EightStar />
            <h1 className="mt-4 font-display text-4xl">{t.appName}</h1>
            <p className="mt-2 text-lg opacity-85">{t.tagline}</p>
          </div>
        </article>

        <div className="paper-card flex max-w-md flex-col items-start self-center p-6 text-left md:mt-8 md:self-start">
          <ul className="w-full space-y-3 text-sm leading-relaxed text-ink/85">
            <li>
              <strong className="block text-ink">{t.landingFeature1Title}</strong>
              <span className="text-ink/75">{t.landingFeature1Text}</span>
            </li>
            <li>
              <strong className="block text-ink">{t.landingFeature2Title}</strong>
              <span className="text-ink/75">{t.landingFeature2Text}</span>
            </li>
            <li>
              <strong className="block text-ink">{t.landingFeature3Title}</strong>
              <span className="text-ink/75">{t.landingFeature3Text}</span>
            </li>
          </ul>
          <p className="mt-5 max-w-[20rem] text-xs text-ink/60">{t.landingBetaNote}</p>
          <Link to="/body" className="btn-primary mt-4 self-start">{t.landingOpen}</Link>
        </div>
      </div>
    </div>
  );
}
