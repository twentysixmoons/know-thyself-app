import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { dismissStatus, useStatusToast } from "@/lib/status";
import { useI18n } from "@/lib/i18n";

/** A confirmation pop-up anchored to the last click. Tapping anywhere outside
 *  it (or its ✕) dismisses it; it also auto-dismisses after a few seconds. */
export function StatusToast() {
  const toast = useStatusToast();
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return;
    // Tapping anywhere outside the pop-up dismisses it; taps on it don't.
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) dismissStatus();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    const timer = setTimeout(dismissStatus, 6000);
    return () => { document.removeEventListener("pointerdown", onPointerDown, true); clearTimeout(timer); };
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;
  // Anchor near the click, clamped to the viewport.
  const left = Math.min(Math.max(12, toast.x - 170), window.innerWidth - 344);
  const top = Math.min(Math.max(70, toast.y - 34), window.innerHeight - 100);
  return (
    <div ref={ref} role="status" aria-live="polite"
      className="confirm-banner fixed z-[70] flex items-center gap-3 !py-2.5 shadow-xl"
      style={{ left, top, width: "min(20rem, calc(100vw - 1.5rem))" }}>
      <Check className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{toast.msg}</span>
      <button type="button" aria-label={t.cancel} title={t.cancel} className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/10 hover:text-ink"
        onClick={dismissStatus}>
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
