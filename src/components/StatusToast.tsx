import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { dismissStatus, useStatusToast } from "@/lib/status";
import { useI18n } from "@/lib/i18n";

/** A frosted-glass confirmation pop-up, centered in the viewport. Tapping
 *  anywhere outside it (or its ✕) dismisses it; it also auto-dismisses after
 *  a few seconds. */
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
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div ref={ref} role="status" aria-live="polite"
        className="toast-glass relative rounded-2xl border border-paper/40 px-6 py-5 text-center shadow-xl"
        style={{ width: "min(22rem, calc(100vw - 2rem))" }}>
        <p className="text-base text-ink">{toast.msg}</p>
        <button type="button" aria-label={t.cancel} onClick={dismissStatus}
          className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/10 hover:text-ink">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
