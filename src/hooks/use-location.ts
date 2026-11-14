import { useCallback, useEffect, useRef, useState } from "react";

export type LocationStatus = "idle" | "loading" | "ready" | "denied" | "unavailable" | "error";

/** Coordinates stay in memory and are rounded before resolving the place name. */
const PLACE_KEY = "knowthyself.place";

/** Fired on window whenever the chosen place changes, so pages can refresh
 *  date, time, and chart data against the new location. */
export const LOCATION_EVENT = "knowthyself:location-changed";

export function useLocation(locale: string) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [place, setPlace] = useState("");
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);

  // The chosen place name is remembered on this device only (never synced or attached to notes).
  useEffect(() => {
    const saved = localStorage.getItem(PLACE_KEY);
    if (saved) { setPlace(saved); setStatus("ready"); }
  }, []);

  useEffect(() => () => {
    generation.current += 1;
    controller.current?.abort();
  }, []);

  // Manual entry needs no geolocation: city, state, and country straight from
  // the user, stored the same privacy-safe way (name only, never coordinates).
  const saveManual = useCallback((city: string, region: string, country: string) => {
    const name = [city.trim(), region.trim(), country.trim()].filter(Boolean).join(", ");
    if (!name) return false;
    setPlace(name);
    localStorage.setItem(PLACE_KEY, name);
    setStatus("ready");
    window.dispatchEvent(new Event(LOCATION_EVENT));
    return true;
  }, []);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    const current = ++generation.current;
    controller.current?.abort();
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      if (current !== generation.current) return;
      const abort = new AbortController();
      controller.current = abort;
      try {
        const query = new URLSearchParams({
          lat: coords.latitude.toFixed(3),
          lon: coords.longitude.toFixed(3),
          format: "jsonv2",
          zoom: "10",
          "accept-language": locale.startsWith("es") ? "es" : "en",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
          signal: abort.signal,
          credentials: "omit",
          referrerPolicy: "strict-origin-when-cross-origin",
        });
        if (!response.ok) throw new Error("Location lookup failed");
        const data: { address?: { city?: string; town?: string; village?: string; municipality?: string; state?: string; region?: string; country?: string } } = await response.json();
        const address = data.address;
        const city = address?.city || address?.town || address?.village || address?.municipality;
        if (!city || !address?.country) throw new Error("Place unavailable");
        if (current !== generation.current) return;
        const name = [city, address.state || address.region, address.country].filter(Boolean).join(", ");
        setPlace(name);
        localStorage.setItem(PLACE_KEY, name);
        setStatus("ready");
        window.dispatchEvent(new Event(LOCATION_EVENT));
      } catch {
        if (current === generation.current && !abort.signal.aborted) {
          // A failed refresh shouldn't hide a place the user already chose.
          const saved = localStorage.getItem(PLACE_KEY);
          if (saved) { setPlace(saved); setStatus("ready"); return; }
          setStatus("error");
        }
      }
    }, (error) => {
      if (current === generation.current) setStatus(error.code === 1 ? "denied" : "unavailable");
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  }, [locale]);

  return { status, place, request, saveManual };
}
