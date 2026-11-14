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
    <div className="sky-band relative isolate flex min-h-[100dvh] flex-col items-center px-6 py-14 text-center text-paper" onPointerMove={skyMove}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink/45 via-ink/20 to-ink/55" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <svg viewBox="0 0 200 460" focusable="false" className="h-[440px] w-[191px] shrink-0 fill-current opacity-15 blur-[2.5px]">
          <path d={BODY_SILHOUETTE} transform={BODY_TRANSFORM} />
        </svg>
      </span>
      <div className="absolute right-4 top-4 z-20">
        <SettingsMenu tone="onDark" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <EightStar size={72} />
        <h1 className="mt-6 font-display text-5xl sm:text-6xl">{t.appName}</h1>
        <p className="mt-3 text-xl opacity-90">{t.tagline}</p>
        <Link to="/body" className="btn-primary mt-8 text-lg">{t.landingOpen}</Link>
      </div>

      <div className="paper-card relative z-10 mt-12 flex w-full max-w-md flex-col items-start p-6 text-left">
        <ul className="w-full space-y-3 text-sm leading-relaxed text-ink/85">
          <li>
            <strong className="block font-display text-ink">{t.landingFeature1Title}</strong>
            <span className="text-ink/75">{t.landingFeature1Text}</span>
          </li>
          <li>
            <strong className="block font-display text-ink">{t.landingFeature2Title}</strong>
            <span className="text-ink/75">{t.landingFeature2Text}</span>
          </li>
          <li>
            <strong className="block font-display text-ink">{t.landingFeature3Title}</strong>
            <span className="text-ink/75">{t.landingFeature3Text}</span>
          </li>
        </ul>
        <p className="mt-5 max-w-[20rem] text-xs text-ink/60">{t.landingBetaNote}</p>
      </div>
    </div>
  );
}
