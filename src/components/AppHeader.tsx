import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useZodiac, setZodiac } from "@/lib/astro";
import { useI18n } from "@/lib/i18n";
import { exportEntries, importEntries } from "@/lib/entries";
import { journalSnapshot, restoreJournal } from "@/lib/journal";
import { Languages, Settings, Download, Save, Music, Sparkles, Upload, Notebook, BookOpen, Pencil, PersonStanding, Brain, MoonStar } from "lucide-react";
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

export function SunGlyph({ eclipse = false, size = 54 }: { eclipse?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" overflow="visible" className="sun-glow">
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

const triggerCls = (tone: "onDark" | "onLight", extra = "") => `header-gear ${tone === "onDark"
  ? "size-10 rounded-full p-0 text-paper hover:bg-paper/10 hover:text-paper focus-visible:ring-paper"
  : "size-10 rounded-full p-0 text-ink hover:bg-ink/10 hover:text-ink focus-visible:ring-ink"} ${extra}`;

/** Chakra singing bowls, pulled out of settings: a music-note icon that opens
 *  play/stop and the volume slider. */
export function SoundMenu({ tone = "onDark" }: { tone?: "onDark" | "onLight" }) {
  const { t } = useI18n();
  const sound = useSound();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={t.soundTitle} title={t.soundTitle} aria-pressed={sound.on}
          className={triggerCls(tone, sound.on ? "text-[var(--sun)]" : "")}>
          <Music className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 bg-paper-light text-ink shadow-xl">
        <button type="button" role="switch" aria-checked={sound.on} onClick={() => setSoundOn(!sound.on)} className="btn-ghost w-full !min-h-8 !text-xs">{sound.on ? t.soundOff : t.soundOn}</button>
        <label className="mt-2 flex items-center gap-2 px-2 pb-1 text-xs">{t.soundVolume}
          <input type="range" min={0} max={1} step={0.05} value={sound.volume} onChange={(e) => setSoundVolume(Number(e.target.value))} className="w-full accent-[var(--btn-orange)]" />
        </label>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Backups, pulled out of settings: a save-disk icon opening download / load. */
export function BackupMenu({ tone = "onDark" }: { tone?: "onDark" | "onLight" }) {
  const { t } = useI18n();
  const restoreRef = useRef<HTMLInputElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={t.backup} title={t.backup}
          className={triggerCls(tone)}>
          <Save className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 bg-paper-light text-ink shadow-xl">
        <DropdownMenuItem onSelect={() => exportEntries(journalSnapshot())} className="min-h-8 py-1 text-xs"><Download aria-hidden="true" />{t.backup}</DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); restoreRef.current?.click(); }} className="min-h-8 py-1 text-xs"><Upload aria-hidden="true" />{t.restoreBtn}</DropdownMenuItem>
        <input ref={restoreRef} type="file" accept="application/json" className="hidden" onChange={async (ev) => { const f = ev.target.files?.[0]; if (!f) return; try { alert(t.restored(await importEntries(f, restoreJournal))); } catch { alert(t.restoreFail); } ev.target.value = ""; }} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SettingsMenu({ tone = "onDark" }: { tone?: "onDark" | "onLight" }) {
  const { t, lang, setLang } = useI18n();
  const zodiac = useZodiac();
  const [sky, setSky, custom, setCustom] = useSky();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={t.settings} title={t.settings}
          className={triggerCls(tone)}>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The "New entry" chooser: a bottom-sheet style menu where the user picks
 *  body, mind, or spirit. Each option deep-links with ?new=1, which opens the
 *  matching composer on the destination page. */
function NewEntrySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  if (!open) return null;
  const opts = [
    { to: "/body", icon: <PersonStanding className="size-5" aria-hidden="true" />, label: t.newBody },
    { to: "/diary", icon: <Brain className="size-5" aria-hidden="true" />, label: t.newMind },
    { to: "/spirit", icon: <MoonStar className="size-5" aria-hidden="true" />, label: t.jAddDream },
  ] as const;
  return (
    <div className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.navNewEntry}>
      <div className="paper-card absolute inset-x-3 bottom-3 mx-auto max-w-md p-3 shadow-2xl sm:bottom-8" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-sm text-ink-muted">{t.chooseDiary}</p>
        <div className="mt-2 flex flex-col gap-1">
          {opts.map((o) => (
            <Link key={o.to} to={o.to} search={{ new: 1 }} onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-ink transition hover:bg-muted">
              {o.icon}
              <span className="text-base">{o.label}</span>
            </Link>
          ))}
        </div>
        <button type="button" className="btn-ghost mt-2 w-full" onClick={onClose}>{t.cancel}</button>
      </div>
    </div>
  );
}

export function AppHeader() {
  const { t } = useI18n();
  const [compact, setCompact] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  useEffect(() => {
    // Hysteresis: compact past 40px, back only under 12px, so a scroll right at
    // the threshold can't oscillate the header height (the mobile "glitch").
    // Short pages (the cover fits its viewport exactly) never compact at all —
    // rubber-band bounce there would otherwise pump the nav big↔small.
    const onScroll = () => {
      const el = document.scrollingElement;
      const scrollable = !!el && el.scrollHeight - el.clientHeight > 160;
      setCompact((c) => (scrollable ? (c ? window.scrollY > 12 : window.scrollY > 40) : false));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const newEntryPill = (
    <button type="button" className="nav-pill" aria-haspopup="dialog" aria-expanded={sheetOpen} onClick={() => setSheetOpen(true)}>
      ✏️ {t.navNewEntry}
    </button>
  );

  return (
    <>
      <header className={`sky-band sticky top-0 z-40 hidden sm:block ${compact ? "nav-compact" : ""}`} onPointerMove={skyMove}>
        <div className="nav-bar-pad relative mx-auto max-w-5xl px-3 sm:px-5">
          <div className="flex flex-nowrap items-center justify-center">
            <nav aria-label={t.mainNav} className="hidden sm:block">
              <div className="nav-track">
                <Link to="/" aria-label={t.navJournal} activeOptions={{ exact: true }}
                  className="nav-pill"
                  activeProps={{ "aria-current": "page", className: "nav-pill-active" }}>
                  <Notebook className="size-5" aria-hidden="true" />
                </Link>
                {newEntryPill}
                <Link to="/log" aria-label={t.navEntries}
                  className="nav-pill"
                  activeProps={{ "aria-current": "page", className: "nav-pill-active" }}>{t.navEntries}</Link>
                <Link to="/insights" aria-label={t.patternsTitle}
                  className="nav-pill nav-pill-star"
                  activeProps={{ "aria-current": "page", className: "nav-pill-active" }}>
                  <EightStar size={18} className="star-white" />
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <nav aria-label={t.mainNav} className="bottom-nav sm:hidden">
        <Link to="/" activeOptions={{ exact: true }} className="bottom-nav-item"
          activeProps={{ "aria-current": "page" }}>
          <Notebook className="size-5" aria-hidden="true" />
          <span>{t.navJournal}</span>
        </Link>
        <button type="button" className="bottom-nav-item" aria-haspopup="dialog" aria-expanded={sheetOpen} onClick={() => setSheetOpen(true)}>
          <Pencil className="size-5" aria-hidden="true" />
          <span>✏️ {t.navNewEntry}</span>
        </button>
        <Link to="/log" className="bottom-nav-item" activeProps={{ "aria-current": "page" }}>
          <BookOpen className="size-5" aria-hidden="true" />
          <span>{t.navEntries}</span>
        </Link>
        <Link to="/insights" className="bottom-nav-item" activeProps={{ "aria-current": "page" }}>
          <EightStar size={22} />
          <span>{t.patternsTitle}</span>
        </Link>
      </nav>
      <NewEntrySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
