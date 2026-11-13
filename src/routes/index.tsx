import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { EightStar, SettingsMenu } from "@/components/AppHeader";

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
        <article className="diary-cover">
          <span className="absolute right-4 top-4 rounded-full border border-paper/40 px-2.5 py-0.5 text-xs font-semibold tracking-widest uppercase text-paper/80">{t.landingBeta}</span>
          <div className="relative flex flex-col items-center text-center">
            <EightStar />
            <h1 className="mt-4 font-display text-4xl">{t.appName}</h1>
            <p className="mt-2 text-lg opacity-90">{t.tagline}</p>
            <hr className="my-6 w-16 border-0 border-t border-paper/30" />
            <ul className="w-full space-y-3 text-left text-sm leading-relaxed text-paper/90">
              <li>
                <strong className="block text-paper">{t.landingFeature1Title}</strong>
                <span className="text-paper/80">{t.landingFeature1Text}</span>
              </li>
              <li>
                <strong className="block text-paper">{t.landingFeature2Title}</strong>
                <span className="text-paper/80">{t.landingFeature2Text}</span>
              </li>
              <li>
                <strong className="block text-paper">{t.landingFeature3Title}</strong>
                <span className="text-paper/80">{t.landingFeature3Text}</span>
              </li>
            </ul>
            <p className="mt-6 max-w-[20rem] text-center text-xs text-paper/65">{t.landingBetaNote}</p>
            <Link to="/body" className="btn-primary mt-3">{t.landingOpen}</Link>
          </div>
        </article>
      </div>
    </div>
  );
}
