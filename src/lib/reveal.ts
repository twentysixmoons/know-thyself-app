// Slow fade-in on scroll. Applied after hydration only, so content is never hidden without JS.
const SELECTOR = "header .relative > *, main h1, main h2, main p, main form, main section, main article, main li, main svg, main button, main a, .paper-card";

export function initReveal(): () => void {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const io = new IntersectionObserver((items) => {
    for (const it of items) if (it.isIntersecting) { it.target.classList.add("is-visible"); io.unobserve(it.target); }
  }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
  const scan = () => {
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (el.classList.contains("reveal") || el.closest("dialog, [role=menu]") || el.parentElement?.closest(".reveal")) return;
      el.classList.add("reveal");
      io.observe(el);
    });
  };
  scan();
  const mo = new MutationObserver(() => scan());
  mo.observe(document.body, { childList: true, subtree: true });
  return () => { io.disconnect(); mo.disconnect(); };
}
