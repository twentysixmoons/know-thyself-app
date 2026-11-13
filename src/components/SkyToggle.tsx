import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const KEY = "knowthyself.sky";
const OPTIONS = ["cosmic", "prism", "chakra"] as const;
type Sky = (typeof OPTIONS)[number];

export function useSky() {
  const [sky, setSky] = useState<Sky>("cosmic");
  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (v && (OPTIONS as readonly string[]).includes(v)) setSky(v as Sky);
  }, []);
  useEffect(() => {
    document.documentElement.dataset["sky"] = sky;
    localStorage.setItem(KEY, sky);
  }, [sky]);
  return [sky, setSky] as const;
}

export function SkySwatches({ sky, setSky }: { sky: Sky; setSky: (s: Sky) => void }) {
  const { t } = useI18n();
  const label = { cosmic: t.skyCosmic, prism: t.skyPrism, chakra: t.skyChakra };
  return (
    <div className="px-2 py-1.5">
      <p id="sky-label" className="mb-2 text-sm font-semibold">{t.skyLabel}</p>
      <div role="radiogroup" aria-labelledby="sky-label" className="flex gap-3">
        {OPTIONS.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={sky === o} aria-label={label[o]} title={label[o]}
            onClick={() => setSky(o)} className={`sky-dot sky-dot-${o}`} />
        ))}
      </div>
    </div>
  );
}
