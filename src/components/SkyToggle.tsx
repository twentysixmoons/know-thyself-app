import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

const KEY = "knowthyself.sky";
const START_KEY = "knowthyself.sky.custom.start";
const END_KEY = "knowthyself.sky.custom.end";
const OPTIONS = ["cosmic", "prism", "chakra", "custom"] as const;
type Sky = (typeof OPTIONS)[number];

const defaultCustom = { start: "#2a0f3a", end: "#0f2a3a" };

type SkyContextValue = {
  sky: Sky;
  setSky: (s: Sky) => void;
  custom: { start: string; end: string };
  setCustom: (c: { start: string; end: string }) => void;
};

const SkyContext = createContext<SkyContextValue | null>(null);

export function SkyProvider({ children }: { children: ReactNode }) {
  const [sky, setSky] = useState<Sky>("cosmic");
  const [custom, setCustom] = useState(defaultCustom);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v && (OPTIONS as readonly string[]).includes(v)) setSky(v as Sky);
      const s = localStorage.getItem(START_KEY);
      const e = localStorage.getItem(END_KEY);
      if (s && e) setCustom({ start: s, end: e });
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset["sky"] = sky;
    document.documentElement.style.setProperty("--sky-custom-start", custom.start);
    document.documentElement.style.setProperty("--sky-custom-end", custom.end);
    if (loaded) {
      try {
        localStorage.setItem(KEY, sky);
        localStorage.setItem(START_KEY, custom.start);
        localStorage.setItem(END_KEY, custom.end);
      } catch { /* ignore */ }
    }
  }, [sky, custom, loaded]);

  return (
    <SkyContext.Provider value={{ sky, setSky, custom, setCustom }}>
      {children}
    </SkyContext.Provider>
  );
}

export function useSky() {
  const ctx = useContext(SkyContext);
  if (!ctx) throw new Error("useSky must be used within SkyProvider");
  return [ctx.sky, ctx.setSky, ctx.custom, ctx.setCustom] as const;
}

export function SkySwatches({ sky, setSky, custom, setCustom }: { sky: Sky; setSky: (s: Sky) => void; custom: { start: string; end: string }; setCustom: (c: { start: string; end: string }) => void }) {
  const { t } = useI18n();
  const label: Record<Sky, string> = { cosmic: t.skyCosmic, prism: t.skyPrism, chakra: t.skyChakra, custom: t.skyCustom };
  return (
    <div className="px-2 py-1">
      <p id="sky-label" className="mb-1.5 text-xs font-semibold">{t.skyLabel}</p>
      <div role="radiogroup" aria-labelledby="sky-label" className="flex gap-2">
        {OPTIONS.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={sky === o} aria-label={label[o]} title={label[o]}
            onClick={() => setSky(o)} className={`sky-dot sky-dot-${o}`} />
        ))}
      </div>
      {sky === "custom" && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <input type="color" value={custom.start} onChange={(e) => setCustom({ ...custom, start: e.target.value })} className="size-7 cursor-pointer rounded border-0 p-0" aria-label={t.skyStart} />
            {t.skyStart}
          </label>
          <label className="flex items-center gap-1.5">
            <input type="color" value={custom.end} onChange={(e) => setCustom({ ...custom, end: e.target.value })} className="size-7 cursor-pointer rounded border-0 p-0" aria-label={t.skyEnd} />
            {t.skyEnd}
          </label>
        </div>
      )}
    </div>
  );
}
