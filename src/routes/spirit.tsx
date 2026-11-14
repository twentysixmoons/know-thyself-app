import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/spirit")({
  head: () => ({
    meta: [
      { title: "Spirit — Know Thyself" },
      { name: "description", content: "Space for spirit notes and reflections." },
      { property: "og:title", content: "Spirit — Know Thyself" },
      { property: "og:description", content: "Space for spirit notes and reflections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Spirit,
});

function Spirit() {
  const { t } = useI18n();
  return (
    <div className="mx-auto min-h-[120dvh] max-w-5xl px-5 py-8">
      <h1 className="text-center font-display text-5xl">{t.spiritTitle}</h1>
    </div>
  );
}
