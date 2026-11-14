import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useZodiac, setZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import { exportEntries } from "@/lib/entries";
import { journalSnapshot } from "@/lib/journal";
import { seedSampleData, clearAllData } from "@/lib/seed";
import { Languages, Settings, Download, Sparkles, Wand2, Notebook } from "lucide-react";
import { SkySwatches, useSky } from "@/components/SkyToggle";
import { setSoundOn, setSoundVolume, useSound } from "@/lib/soundbowls";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function MoonGlyph({ illumination, waxing, size = 48 }: { illumination: number; waxing: boolean; size?: number }) {
  const rx = Math.abs(1 - 2 * illumination) * 20;
  const d = `M24 4 A20 20 0 0 1 24 44 A${rx} 20 0 0 ${illumination < 0.5 ? 0 : 1} 24 4 Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="moon-glow" overflow="visible">
      <circle cx="24" cy="24" r="20" className="fill-ink-soft" />
      <path d={d} className="fill-paper" transform={waxing ? undefined : "translate(48 0) scale(-1 1)"} />
    </svg>
  );
}

function SunGlyph({ eclipse }: { eclipse: boolean }) {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" aria-hidden="true" overflow="visible" className="sun-glow">
      <circle cx="24" cy="24" r="18" className="sun-disc" />
      {eclipse && <circle cx="27" cy="22" r="19" className="fill-ink-soft" />}
    </svg>
  );
}

function EightStar({ size = 40, className }: { size?: number; className?: string }) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? (i % 4 === 0 ? 20 : 14) : 6;
    return `${(24 + r * Math.cos(a)).toFixed(2)},${(24 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="star-float">
      <polygon points={pts} className={className ? `star-shape ${className}` : "star-shape"} />
    </svg>
  );
}

export { EightStar, SunGlyph };

export function skyMove(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
}

export function SettingsMenu({ tone = "onDark" }: { tone?: "onDark" | "onLight" }) {
  const { t, lang, setLang } = useI18n();
  const zodiac = useZodiac();
  const [sky, setSky, custom, setCustom] = useSky();
  const sound = useSound();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={t.settings} title={t.settings}
          className={`header-gear ${tone === "onDark"
            ? "size-10 rounded-full p-0 text-paper hover:bg-paper/10 hover:text-paper focus-visible:ring-paper"
            : "size-10 rounded-full p-0 text-ink hover:bg-ink/10 hover:text-ink focus-visible:ring-ink"}`}>
          <Settings className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 bg-paper-light text-ink shadow-xl">
        <DropdownMenuLabel className="flex items-center gap-2 py-1 text-xs"><Languages className="size-4" aria-hidden="true" />{t.language}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={lang} onValueChange={(value) => { if (value === "en" || value === "es") setLang(value); }}>
          <DropdownMenuRadioItem value="en" lang="en" className="min-h-8 py-1 text-xs">{t.english}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="es" lang="es-MX" className="min-h-8 py-1 text-xs">{t.spanish}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 py-1 text-xs"><Sparkles className="size-4" aria-hidden="true" />{t.zodiacLabel}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={zodiac} onValueChange={(value) => { if (value === "sidereal" || value === "tropical") setZodiac(value); }}>
          <DropdownMenuRadioItem value="sidereal" className="min-h-8 py-1 text-xs">{t.zodiacSidereal}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="tropical" className="min-h-8 py-1 text-xs">{t.zodiacTropical}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <SkySwatches sky={sky} setSky={setSky} custom={custom} setCustom={setCustom} />
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="py-1 text-xs">{t.soundTitle}</DropdownMenuLabel>
        <div className="space-y-2 px-2 pb-1">
          <button type="button" role="switch" aria-checked={sound.on} onClick={() => setSoundOn(!sound.on)} className="btn-ghost w-full !min-h-8 !text-xs">{sound.on ? t.soundOff : t.soundOn}</button>
          <label className="flex items-center gap-2 text-xs">{t.soundVolume}
            <input type="range" min={0} max={1} step={0.05} value={sound.volume} onChange={(e) => setSoundVolume(Number(e.target.value))} className="w-full accent-[var(--btn-orange)]" />
          </label>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { seedSampleData(); alert(t.seedDataDone); }} className="min-h-8 py-1 text-xs"><Wand2 aria-hidden="true" />{t.seedData}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { clearAllData(); alert(t.clearDataDone); }} className="min-h-8 py-1 text-xs"><Wand2 aria-hidden="true" />{t.clearData}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => exportEntries(journalSnapshot())} className="min-h-8 py-1 text-xs"><Download aria-hidden="true" />{t.backup}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const { t } = useI18n();
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tabs: [string, React.ReactNode, string?][] = [
    ["/cover", <Notebook key="journal" className="size-5" aria-hidden="true" />, t.navJournal],
    ["/body", t.navMap],
    ["/diary", t.navDiary],
    ["/spirit", t.navSpirit],
    ["/insights", <EightStar key="insights" size={18} className="star-white" />],
  ];

  return (
    <header className={`sky-band sticky top-0 z-40 ${compact ? "nav-compact" : ""}`} onPointerMove={skyMove}>
      <div className="nav-bar-pad relative mx-auto max-w-5xl px-5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <nav aria-label={t.mainNav}>
            <div className="nav-track">
              {tabs.map(([to, label, srLabel]) => (
                <Link key={to} to={to} aria-label={srLabel} activeOptions={{ exact: true }}
                  className={to === "/insights" ? "nav-pill nav-pill-star" : "nav-pill"}
                  activeProps={{ "aria-current": "page", className: "nav-pill-active" }}>{label}</Link>
              ))}
            </div>
          </nav>
          <SettingsMenu tone="onDark" />
        </div>
      </div>
    </header>
  );
}
