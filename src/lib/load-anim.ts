// Load-in animation driver for the Neale Van Fleet system in styles.css.
// Runs once after hydration (content is never hidden without JS), tags
// top-level page blocks with .animate plus an effect class, and staggers
// them by document order. Re-runs on route changes so each page animates in.
const SELECTOR = "header .nav-bar-pad, main h1, main h2, main p, main form, main section, main article, main li, main svg, main button, main a, .paper-card";

function effectFor(el: Element): string {
  if (el.matches("main h1, main h2")) return "animate-blur";
  if (el.matches("main svg")) return "animate-pop";
  if (el.matches("main article, .paper-card")) return "animate-slide";
  if (el.matches("main button, main a")) return "animate-fade";
  return "animate-slide";
}

export function initLoadAnim(): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const scan = () => {
    let i = 0;
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      // Skip anything already tagged, elements that own their own animation
      // (the cover logo's blur, the drifting star), and menu internals.
      if (el.classList.contains("animate") || el.classList.contains("blur-in") || el.classList.contains("star-float")
        || el.closest("dialog, [role=menu]") || el.parentElement?.closest(".animate")) return;
      el.classList.add("animate", effectFor(el));
      el.style.animationDelay = `${(0.3 + Math.min(i++ * 0.08, 0.8)).toFixed(2)}s`;
    });
  };
  scan();
  const mo = new MutationObserver(() => scan());
  mo.observe(document.body, { childList: true, subtree: true });
  return () => mo.disconnect();
}
