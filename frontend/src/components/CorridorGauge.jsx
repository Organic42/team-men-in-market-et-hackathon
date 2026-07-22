import { useEffect, useMemo, useState } from "react";
import { useCountUp, deriveSeries, deriveDelta, levelColor, fmtTime } from "../hooks/useCountUp";
import Sparkline from "./Sparkline";
import DeltaChip from "./DeltaChip";

// Clean enterprise metric card (Palantir / Stripe style) — no dial, no glow
export default function CorridorGauge({ name, score, level, trend, updated }) {
  const color = levelColor(level);
  const [filled, setFilled] = useState(0);
  useEffect(() => { const t = setTimeout(() => setFilled(score), 80); return () => clearTimeout(t); }, [score]);
  const shown = useCountUp(score);
  const series = useMemo(() => deriveSeries(score, trend), [score, trend]);
  const delta  = useMemo(() => deriveDelta(score, trend), [score, trend]);
  const trendTxt = trend === "escalating" ? "ESCALATING" : trend === "de-escalating" ? "DE-ESCALATING" : "STABLE";

  return (
    <div className="panel hover">
      <div className="panel-title between" style={{ display: "flex" }}>
        <span>{name}</span>
        <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>
      </div>

      <div className="hstack" style={{ gap: 12, alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, lineHeight: 1, color: "var(--fg)" }}>
          {shown}
        </span>
        <span className="text-dim" style={{ fontSize: 11, letterSpacing: 1 }}>/ 100</span>
        <DeltaChip value={delta} />
      </div>

      <div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden", margin: "12px 0 14px" }}>
        <div style={{
          height: "100%", width: `${filled}%`, background: color, borderRadius: 3,
          transition: "width 1s var(--ease)",
        }} />
      </div>

      <div className="hstack between" style={{ marginBottom: 4 }}>
        <span className="text-dim" style={{ fontSize: 10, letterSpacing: 1 }}>7-SESSION TREND</span>
        <span style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{trendTxt}</span>
      </div>
      <Sparkline data={series} color={color} width={230} height={34} />

      {updated && (
        <div className="hstack" style={{ justifyContent: "flex-end", marginTop: 6 }}>
          <span className="asof" style={{ fontSize: 10 }}>{fmtTime(updated)}</span>
        </div>
      )}
    </div>
  );
}
