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
    <div className="text-center text-sm text-paper opacity-90">
      <div className="min-h-5 font-bold">{now ? now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "\u00a0"}</div>
      <div className="mt-0.5 min-h-5">
        {now && <time dateTime={now.toISOString()} aria-label={t.currentTime} className="tabular-nums">{now.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}</time>}
      </div>
    </div>
  );
}

export function HeaderLocation() {
  const { t, locale } = useI18n();
  const { status, place, request } = useLocation(locale);
  const message = status === "denied" ? t.locationDenied
    : status === "unavailable" ? t.locationUnavailable
    : status === "error" ? t.locationError : null;
  const label = status === "ready" ? place : status === "loading" ? t.locationLoading : t.locationUse;
  return (
    <div className="flex min-h-11 flex-col items-center justify-center text-center text-xs text-paper">
      <button type="button" onClick={request} disabled={status === "loading"} title={t.locationPrivacy}
        aria-label={status === "ready" ? `${place}. ${t.locationRefresh}` : undefined}
        className="min-h-11 px-1 text-paper underline underline-offset-4 hover:opacity-80 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-paper">
        {label}
      </button>
      <span role="status" className="opacity-85">{message}</span>
    </div>
  );
}
