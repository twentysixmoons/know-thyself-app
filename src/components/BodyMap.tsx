import { useRef, useState } from "react";
import { BODY_OUTLINE, BODY_SILHOUETTE, BODY_TRANSFORM } from "@/lib/body-outline";
import { REGIONS, CHAKRA, CHAKRAS, nearestRegion, type RegionId } from "@/lib/regions";
import { useI18n } from "@/lib/i18n";

export function BodyMap({ scores, onPick }: { scores: Partial<Record<RegionId, number>>; onPick: (r: RegionId[]) => void }) {
  const { t } = useI18n();
  const ref = useRef<SVGSVGElement>(null);
  const hitRef = useRef<SVGPathElement>(null);
  const activePointer = useRef<number | null>(null);
  const selected = useRef<RegionId[]>([]);
  const [sel, setSel] = useState<RegionId[]>([]);
  const add = (r: RegionId | null) => {
    if (!r || selected.current.includes(r)) return;
    selected.current = [...selected.current, r];
    setSel(selected.current);
  };
  const clear = () => { activePointer.current = null; selected.current = []; setSel([]); };
  const at = (e: React.PointerEvent): RegionId | null => {
    const svg = ref.current; const hit = hitRef.current; if (!svg || !hit) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const hitMatrix = hit.getScreenCTM(); if (!hitMatrix || !hit.isPointInFill(pt.matrixTransform(hitMatrix.inverse()))) return null;
    const matrix = svg.getScreenCTM(); if (!matrix) return null;
    const p = pt.matrixTransform(matrix.inverse());
    return nearestRegion(p.x, p.y);
  };
  return (
    <svg ref={ref} viewBox="0 0 200 460" overflow="visible" onPointerDown={(e) => {
        const r = at(e); if (!r) return;
        clear(); activePointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); add(r);
      }}
      onPointerMove={(e) => { if (activePointer.current === e.pointerId) add(at(e)); }}
      onPointerUp={(e) => { if (activePointer.current !== e.pointerId) return; add(at(e)); const picked = [...selected.current]; clear(); if (picked.length) onPick(picked); }}
      onPointerCancel={clear}
      onLostPointerCapture={clear}
      className="body-map-canvas"
      role="img" aria-label={t.tapHint}>
      <defs>
        {CHAKRAS.map((c) => (
          <radialGradient key={c} id={`aura-${c}`}>
            <stop offset="0%" className={`aura-stop-${c}`} stopOpacity="0.9" />
            <stop offset="55%" className={`aura-stop-${c}`} stopOpacity="0.35" />
            <stop offset="100%" className={`aura-stop-${c}`} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <defs>
        <filter id="body-glow" x="-80%" y="-40%" width="260%" height="180%"><feGaussianBlur stdDeviation="16" /></filter>
      </defs>
      {/* soft glow behind the body */}
      <g filter="url(#body-glow)" className="body-glow" pointerEvents="none"><path d={BODY_SILHOUETTE} transform={BODY_TRANSFORM} /></g>
      <g className="body-figure" transform={BODY_TRANSFORM} pointerEvents="none">
        <path d={BODY_SILHOUETTE} className="body-fill" />
      </g>
      <path d={BODY_OUTLINE} transform={BODY_TRANSFORM} className="body-traced-outline" pointerEvents="none" />
      <g pointerEvents="none" style={{ mixBlendMode: "multiply" }}>
        {REGIONS.map((r) => {
          const s = scores[r.id]; if (!s) return null;
          const c = CHAKRA[r.id];
          const k = Math.min(1, 0.35 + s * 0.4);
          return <circle key={r.id} cx={r.x} cy={r.y} r={r.r * (1 + Math.min(s, 2) * 0.35)} fill={`url(#aura-${c})`} opacity={k} className={s > 1.4 ? "aura-pulse" : ""} />;
        })}
      </g>
      {REGIONS.filter((r) => sel.includes(r.id)).map((hr) => <circle key={hr.id} cx={hr.x} cy={hr.y} r={hr.r} className="region-hover" pointerEvents="none" />)}
      <path ref={hitRef} d={BODY_SILHOUETTE} transform={BODY_TRANSFORM} className="body-hit-area" />
    </svg>
  );
}
