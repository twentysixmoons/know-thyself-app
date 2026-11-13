import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLocation } from "@/hooks/use-location";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Browser location", () => {
  it("does not request GPS until the visitor opts in", () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    renderHook(() => useLocation("en-US"));
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("shows city, state and country from browser GPS without sending exact coordinates", async () => {
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 19.432608, longitude: -99.133209 } } as GeolocationPosition) } });
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ address: { city: "Mexico City", state: "Ciudad de México", country: "Mexico" } }) });
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() => useLocation("en-US"));
    act(() => result.current.request());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.place).toBe("Mexico City, Ciudad de México, Mexico");
    const firstCall = fetcher.mock.calls[0];
    if (!firstCall) throw new Error("Missing location request");
    const url = new URL(firstCall[0]);
    expect(url.searchParams.get("lat")).toBe("19.433");
    expect(url.searchParams.get("lon")).toBe("-99.133");
  });

  it("never sends a lookup when GPS permission is denied", () => {
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: (_success: unknown, error: PositionErrorCallback) => error({ code: 1 } as GeolocationPositionError) } });
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() => useLocation("es-MX"));
    act(() => result.current.request());
    expect(result.current.status).toBe("denied");
    expect(fetcher).not.toHaveBeenCalled();
  });
});