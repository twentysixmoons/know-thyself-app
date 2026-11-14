import { useEffect, useState } from "react";
import { useLocation } from "@/hooks/use-location";
import { useI18n } from "@/lib/i18n";

export function HeaderDateTime() {
  const { t, locale } = useI18n();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-center text-paper opacity-90">
      <div className="min-h-7 font-bold text-base sm:text-lg">{now ? now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "\u00a0"}</div>
      <div className="mt-1 min-h-7 text-lg sm:text-xl">
        {now && <time dateTime={now.toISOString()} aria-label={t.currentTime} className="tabular-nums">{now.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}</time>}
      </div>
    </div>
  );
}

export function HeaderLocation() {
  const { t, locale } = useI18n();
  const { status, place, request, saveManual } = useLocation(locale);
  const [manual, setManual] = useState(false);
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const message = status === "denied" ? t.locationDenied
    : status === "unavailable" ? t.locationUnavailable
    : status === "error" ? t.locationError : null;
  const label = status === "ready" ? place : status === "loading" ? t.locationLoading : t.locationUse;
  // When the browser withholds geolocation, offer manual city/state/country entry.
  const showManual = manual || status === "denied" || status === "unavailable";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveManual(city, region, country)) {
      setCity(""); setRegion(""); setCountry("");
      setManual(false);
    }
  };

  return (
    <div className="flex min-h-11 flex-col items-center justify-center text-center text-xs text-paper">
      <button type="button" onClick={request} disabled={status === "loading"} title={t.locationPrivacy}
        aria-label={status === "ready" ? `${place}. ${t.locationRefresh}` : undefined}
        className="min-h-11 px-1 text-paper underline underline-offset-4 hover:opacity-80 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-paper">
        {label}
      </button>
      <span role="status" className="opacity-85">{message}</span>
      {showManual && (
        <button type="button" onClick={() => setManual(true)} className="mt-1 min-h-9 text-paper underline underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-paper">
          {t.locationManual}
        </button>
      )}
      {manual && (
        <form onSubmit={submit} className="mt-2 flex w-full max-w-[16rem] flex-col gap-1.5 rounded-lg border border-paper/25 bg-ink/30 p-2.5">
          <input aria-label={t.city} placeholder={t.city} required value={city} onChange={(e) => setCity(e.target.value)}
            className="min-h-9 rounded-md border border-paper/30 bg-paper/10 px-2 text-sm text-paper placeholder:text-paper/50 focus-visible:outline-2 focus-visible:outline-paper" />
          <input aria-label={t.stateRegion} placeholder={t.stateRegion} value={region} onChange={(e) => setRegion(e.target.value)}
            className="min-h-9 rounded-md border border-paper/30 bg-paper/10 px-2 text-sm text-paper placeholder:text-paper/50 focus-visible:outline-2 focus-visible:outline-paper" />
          <input aria-label={t.country} placeholder={t.country} required value={country} onChange={(e) => setCountry(e.target.value)}
            className="min-h-9 rounded-md border border-paper/30 bg-paper/10 px-2 text-sm text-paper placeholder:text-paper/50 focus-visible:outline-2 focus-visible:outline-paper" />
          <button type="submit" className="min-h-9 rounded-full bg-paper px-3 text-sm font-bold text-ink hover:bg-paper-light focus-visible:outline-2 focus-visible:outline-paper">
            {t.locationSave}
          </button>
        </form>
      )}
    </div>
  );
}
