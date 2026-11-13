import { Link, useNavigate } from "@tanstack/react-router";
import { astroFor, SIGN_GLYPH, useZodiac, setZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import { HeaderDateTime, HeaderLocation } from "@/components/HeaderDateLocation";
import { BODY_SILHOUETTE, BODY_TRANSFORM } from "@/lib/body-outline";
import { exportEntries } from "@/lib/entries";
import { journalSnapshot } from "@/lib/journal";
import { seedSampleData, clearAllData } from "@/lib/seed";
import { Languages, Settings, Download, Sparkles, Book, Wand2 } from "lucide-react";
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

export { EightStar };

export function skyMove(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
}

export function SettingsMenu({ tone = "onDark", showClose = false }: { tone?: "onDark" | "onLight"; showClose?: boolean }) {
  const { t, lang, setLang } = useI18n();
  const zodiac = useZodiac();
  const [sky, setSky, custom, setCustom] = useSky();
  const sound = useSound();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={t.settings} title={t.settings}
          className={tone === "onDark"
            ? "size-10 rounded-full p-0 text-paper hover:bg-paper/10 hover:text-paper focus-visible:ring-paper"
            : "size-10 rounded-full p-0 text-ink hover:bg-ink/10 hover:text-ink focus-visible:ring-ink"}>
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
        {showClose && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/" })} className="min-h-8 py-1 text-xs"><Book aria-hidden="true" />{t.closeDiary}</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const { t } = useI18n();
  const zodiac = useZodiac();
  const now = new Date();
  const a = astroFor(now, zodiac);

  return (
    <header className="sky-band" onPointerMove={skyMove}>
      <div className="relative mx-auto max-w-5xl px-5 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-10">
        <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)]">
          <SettingsMenu tone="onDark" showClose />
        </div>
        <Link to="/body" className="blur-in relative isolate mx-auto mt-16 mb-12 flex w-fit flex-col items-center text-paper">
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <svg viewBox="0 0 200 460" focusable="false" className="h-[340px] w-[148px] shrink-0 fill-current opacity-15 blur-[2.5px]">
              <path d={BODY_SILHOUETTE} transform={BODY_TRANSFORM} />
            </svg>
          </span>
          <EightStar />
          <span className="mt-4 font-display text-3xl md:text-5xl">{t.appName}</span>
          <span className="mt-3 text-base opacity-85">{t.tagline}</span>
        </Link>
        <div className="mt-16"><HeaderDateTime /></div>
        <section aria-label={t.positionsTitle} className="my-7 grid w-full max-w-[340px] grid-cols-2 mx-auto items-end gap-10 text-center text-paper">
          <div className="flex flex-col items-center">
            <MoonGlyph illumination={a.illumination} waxing={a.waxing} size={48} />
            <p className="mt-2 text-sm"><span className="sr-only">{t.moon}: </span><span aria-hidden="true" className="zodiac-glyph block text-lg leading-none mb-1">{SIGN_GLYPH[a.moonSign]}</span>{t.signs[a.moonSign]}</p>
            <p className="whitespace-nowrap text-xs opacity-90">{t.phases[a.phase]}</p>
          </div>
          <div className="flex flex-col items-center">
            <SunGlyph eclipse={a.solarEclipse} />
            <p className="mt-2 text-sm"><span className="sr-only">{t.sun}: </span><span aria-hidden="true" className="zodiac-glyph block text-lg leading-none mb-1">{SIGN_GLYPH[a.sunSign]}</span>{t.signs[a.sunSign]}</p>
            <p className="text-xs opacity-90">{a.solarEclipse ? t.eclipse : t.sun}</p>
          </div>
        </section>
        <HeaderLocation />
        <nav aria-label={t.mainNav} className="mt-14 flex justify-center"><div className="nav-track">
          {([
            ["/body", t.navMap],
            ["/diary", t.navDiary],
            ["/spirit", t.navSpirit],
            ["/patterns", <EightStar key="insights" size={18} className="star-white" />],
          ] as [string, React.ReactNode][]).map(([to, label]) => (
            <Link key={to} to={to} activeOptions={{ exact: true }} resetScroll={false} className="nav-pill" activeProps={{ "aria-current": "page", className: "nav-pill-active" }}>{label}</Link>
          ))}
        </div></nav>
      </div>
    </header>
  );
}
