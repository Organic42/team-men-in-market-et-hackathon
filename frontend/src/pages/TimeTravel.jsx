import { useEffect, useMemo, useState } from "react";
import { getHistoricalAt } from "../lib/api";
import { levelColor } from "../hooks/useCountUp";

// Full IGX archive span — March 2021 → June 2026 (skip the sparse first months).
const MONTHS = (() => {
  const out = [];
  for (let y = 2021; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2026 && m > 6) break;
      out.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

const HERO = "2026-02";

export default function TimeTravel() {
  const [idx, setIdx] = useState(MONTHS.indexOf(HERO));
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const month = MONTHS[idx];

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    getHistoricalAt(month)
      .then(setState)
      .finally(() => setLoading(false));
  }, [month]);

  const nextColor = state?.next_mom_pct >= 15 ? "var(--red)"
                 : state?.next_mom_pct >= 5  ? "var(--amber)"
                 : "var(--green)";

  const flaggedRed = state && state.score >= 70;
  const nextBig    = state && state.next_mom_pct !== null && state.next_mom_pct >= 10;
  const outcome = flaggedRed && nextBig ? { label: "CORRECT · caught the spike",  color: "var(--green)" }
              :  flaggedRed && !nextBig ? { label: "FALSE POSITIVE",              color: "var(--amber)" }
              : !flaggedRed && nextBig  ? { label: "MISSED · demand-driven event", color: "var(--amber)" }
              :                            { label: "QUIET MARKET — correctly no signal", color: "var(--fg-muted)" };

  return (
    <div className="vstack fade-up" style={{ gap: 16 }}>
      <div>
        <div className="panel-title"><span className="dot" /> HISTORICAL TIME-TRAVEL</div>
        <div className="text-muted text-sm">
          Drag the slider to any past month. See what CruxIQ would have shown that day — and what actually happened next.
          Every value is computed from the archived IGX prices and the calibrated event calendar; nothing pre-cached.
        </div>
      </div>

      {/* Slider */}
      <div className="panel">
        <div className="hstack between mb-8">
          <div>
            <div className="kpi-label">SELECTED MONTH</div>
            <div className="text-mono" style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{month}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="kpi-label">RANGE</div>
            <div className="text-mono" style={{ fontSize: 12, color: "var(--fg-muted)" }}>
              {MONTHS[0]} → {MONTHS[MONTHS.length - 1]} · {MONTHS.length} months
            </div>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={MONTHS.length - 1}
          value={idx}
          onChange={e => setIdx(+e.target.value)}
          style={{ width: "100%" }}
        />
        <div className="hstack" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { m: "2022-02", label: "Ukraine invasion" },
            { m: "2023-10", label: "Israel-Gaza" },
            { m: "2024-01", label: "Houthi strikes" },
            { m: "2025-06", label: "US-Iran standoff" },
            { m: HERO,      label: "West Asia crisis" },
          ].map(p => (
            <button key={p.m} className="theme-toggle" style={{ fontSize: 10 }}
                    onClick={() => setIdx(MONTHS.indexOf(p.m))}>
              {p.m} · {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="loading">Rewinding…</div>}

      {state && !loading && (
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="panel" style={{ borderColor: levelColor(state.level), borderWidth: 2 }}>
            <div className="panel-title" style={{ color: levelColor(state.level) }}>
              <span className="dot" /> CRUXIQ STATE · {month}
            </div>
            <div className="grid grid-2" style={{ gap: 14 }}>
              <div className="kpi">
                <div className="kpi-label">Composite Risk Score</div>
                <div className="kpi-value" style={{ color: levelColor(state.level), fontSize: 48 }}>{state.score}</div>
                <div><span className={`badge badge-${state.level.toLowerCase()}`}>{state.level}</span></div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Trend</div>
                <div className="kpi-value" style={{ fontSize: 22 }}>{state.trend}</div>
                <div className="text-muted text-sm">
                  {state.events.length} active event{state.events.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            {state.events.length > 0 && (
              <div className="mt-16" style={{ padding: 10, background: "var(--bg-panel-2)",
                                              borderRadius: "var(--radius)", fontSize: 13 }}>
                {state.events.map((e, i) => (
                  <div key={i} style={{ padding: "4px 0" }}>
                    <b style={{ color: "var(--accent)" }}>{e.corridor.toUpperCase()}</b> · sev {e.severity}/10<br />
                    <span className="text-muted">{e.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title"><span className="dot" /> WHAT ACTUALLY HAPPENED</div>
            <div className="grid grid-2" style={{ gap: 14 }}>
              <div className="kpi">
                <div className="kpi-label">GIXI That Month</div>
                <div className="kpi-value" style={{ fontSize: 32 }}>
                  ₹{state.actual_price ?? "—"}
                </div>
                <div className="text-muted text-sm">MoM {state.mom_pct >= 0 ? "+" : ""}{state.mom_pct ?? 0}%</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">NEXT MONTH MOVE</div>
                <div className="kpi-value" style={{ color: nextColor, fontSize: 32 }}>
                  {state.next_mom_pct !== null ? `${state.next_mom_pct > 0 ? "+" : ""}${state.next_mom_pct}%` : "—"}
                </div>
                <div className="text-muted text-sm">this is what buyers actually paid</div>
              </div>
            </div>
            <div className="mt-16 stat-tile" style={{ borderColor: outcome.color }}>
              <div className="kpi-label">OUTCOME</div>
              <div style={{ color: outcome.color, fontWeight: 800, fontSize: 15 }}>{outcome.label}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
