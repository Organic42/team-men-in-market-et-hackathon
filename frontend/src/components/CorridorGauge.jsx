import { useEffect, useMemo, useState } from "react";
import { useCountUp, deriveSeries, deriveDelta, levelColor, fmtTime } from "../hooks/useCountUp";
import Sparkline from "./Sparkline";
import DeltaChip from "./DeltaChip";

export default function CorridorGauge({ name, score, level, trend, updated }) {
  const color = levelColor(level);
  const size = 168, stroke = 12, radius = (size - stroke) / 2;
  const circ = Math.PI * radius;
  const [filled, setFilled] = useState(0);
  useEffect(() => { const t = setTimeout(() => setFilled((score / 100) * circ), 80); return () => clearTimeout(t); }, [score, circ]);
  const shown = useCountUp(score);
  const series = useMemo(() => deriveSeries(score, trend), [score, trend]);
  const delta  = useMemo(() => deriveDelta(score, trend), [score, trend]);
  const trendTxt = trend === "escalating" ? "ESCALATING" : trend === "de-escalating" ? "DE-ESCALATING" : "STABLE";

  return (
    <div className="panel hover" style={{ textAlign: "center" }}>
      <div className="panel-title between" style={{ display: "flex" }}>
        <span>{name}</span>
        <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>
      </div>
      <div className="hstack between" style={{ marginBottom: 4 }}>
        <span className="text-dim" style={{ fontSize: 10, letterSpacing: 1 }}>7-SESSION TREND</span>
        <DeltaChip value={delta} />
      </div>
      <Sparkline data={series} color={color} width={230} height={34} />
      <svg width={size} height={size / 2 + 30} style={{ display: "block", margin: "6px auto 0" }}>
        <path d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          stroke="var(--border)" strokeWidth={stroke} fill="none" strokeLinecap="round" />
        <path d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: "stroke-dasharray 1s var(--ease)",
            filter: level === "RED" ? `drop-shadow(0 0 6px ${color})` : "none" }} />
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle"
          style={{ fill: color, fontFamily: "var(--font-numeric)", fontSize: 38, fontWeight: 800 }}>{shown}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
          style={{ fill: "var(--fg-dim)", fontFamily: "var(--font-numeric)", fontSize: 10, letterSpacing: 1.5 }}>/ 100</text>
      </svg>
      <div className="hstack between" style={{ marginTop: 2 }}>
        <span style={{ color, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>{trendTxt}</span>
        {updated && <span className="asof" style={{ fontSize: 10 }}>{fmtTime(updated)}</span>}
      </div>
    </div>
  );
}
