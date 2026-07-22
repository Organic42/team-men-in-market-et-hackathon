import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 → target with cubic ease-out.
 * Uses setTimeout instead of requestAnimationFrame so background tabs still
 * animate (browsers throttle RAF to near-zero in inactive tabs, which broke
 * count-ups when the app was demoed in a non-focused window).
 * A generation counter guards against React StrictMode double-invocation
 * — an outdated effect can't stomp a live one.
 */
export function useCountUp(target, { duration = 1100, decimals = 0 } = {}) {
  const [v, setV] = useState(Number(target) || 0);
  const genRef = useRef(0);

  useEffect(() => {
    const to = Number(target) || 0;
    if (to === 0) { setV(0); return; }

    const gen = ++genRef.current;
    let timerId;
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const frame = 16; // ~60fps but via setTimeout so background tabs still animate

    // Reset so the count-up is visible each time target changes.
    setV(0);

    const tick = () => {
      if (gen !== genRef.current) return;
      const p = Math.min(1, (performance.now() - t0) / duration);
      setV(to * ease(p));
      if (p < 1) timerId = setTimeout(tick, frame);
    };
    timerId = setTimeout(tick, frame);

    return () => { clearTimeout(timerId); };
  }, [target, duration]);

  return Number(v).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Deterministic pseudo-history for sparklines from score+trend (client-side visual only). */
export function deriveSeries(score, trend, n = 16) {
  const dir = trend === "escalating" ? 1 : trend === "de-escalating" ? -1 : 0;
  const out = [];
  let seed = score * 7.13;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = score - dir * (1 - t) * (12 + score * 0.12);
    out.push({ i, v: Math.max(6, Math.min(100, base + (rnd() - 0.5) * 5)) });
  }
  out[n - 1].v = score;
  return out;
}
export function deriveDelta(score, trend) {
  const s = deriveSeries(score, trend);
  return +(s[s.length - 1].v - s[s.length - 3].v).toFixed(1);
}
export const levelColor = l =>
  l === "RED" ? "var(--red)" : l === "AMBER" ? "var(--amber)" : "var(--green)";
export const fmtTime = iso =>
  new Date(iso).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
