import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { EightStar, skyMove } from "@/components/AppHeader";

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
  const { t, lang, setLang } = useI18n();
  return (
    <div className="sky-band flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-5 py-12" onPointerMove={skyMove}>
      <div className="flex w-full max-w-md items-center justify-end">
        <div role="group" aria-label={t.language} className="flex gap-1 rounded-full border border-white/15 p-1 text-sm">
          <button type="button" lang="en" aria-pressed={lang === "en"} onClick={() => setLang("en")} className={`rounded-full px-3 py-1 transition-colors ${lang === "en" ? "bg-white/20 text-paper" : "text-paper/70 hover:text-paper"}`}>English</button>
          <button type="button" lang="es-MX" aria-pressed={lang === "es"} onClick={() => setLang("es")} className={`rounded-full px-3 py-1 transition-colors ${lang === "es" ? "bg-white/20 text-paper" : "text-paper/70 hover:text-paper"}`}>Español</button>
        </div>
      </div>

      <article className="diary-cover">
        <span className="absolute right-4 top-4 rounded-full border border-moss-deep/50 px-2.5 py-0.5 text-xs font-semibold tracking-widest uppercase text-ink/60">{t.landingBeta}</span>
        <div className="flex flex-col items-center text-center">
          <EightStar />
          <h1 className="mt-4 font-display text-4xl">{t.appName}</h1>
          <p className="mt-2 text-lg">{t.tagline}</p>
          <hr className="my-5 w-16 border-0 border-t border-moss-deep/40" />
          <h2 className="sr-only">{t.landingPromiseTitle}</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-ink/80">
            <li>{t.landingPromise1}</li>
            <li>{t.landingPromise2}</li>
            <li>{t.landingPromise3}</li>
          </ul>
          <Link to="/body" className="btn-primary mt-7">{t.landingOpen}</Link>
        </div>
      </article>

      <p className="max-w-md text-center text-sm text-paper/60">{t.landingBetaNote}</p>
    </div>
  );
}
