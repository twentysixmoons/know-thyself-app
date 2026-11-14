import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { EightStar, SettingsMenu, skyMove } from "@/components/AppHeader";

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
    <div className="sky-band relative isolate flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16 text-center text-paper" onPointerMove={skyMove}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink/45 via-ink/20 to-ink/55" />
      <div className="absolute right-4 top-4 z-20">
        <SettingsMenu tone="onDark" />
      </div>
      <div className="flex flex-col items-center">
        <EightStar size={72} />
        <h1 className="mt-6 font-display text-5xl sm:text-6xl">{t.appName}</h1>
        <p className="mt-3 text-xl opacity-90">{t.tagline}</p>
        <p className="mt-1 text-sm opacity-75">{t.landingBeta}</p>
        <Link to="/body" className="btn-primary mt-8 text-lg">{t.landingOpen}</Link>
      </div>
    </div>
  );
}
