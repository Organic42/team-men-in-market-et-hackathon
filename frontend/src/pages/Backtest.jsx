import { useEffect, useState } from "react";
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ReferenceArea, ResponsiveContainer,
} from "recharts";
import { getBacktestReport, getBacktestHero } from "../lib/api";
import { useCountUp } from "../hooks/useCountUp";
import { SkeletonPanel } from "../components/Skeleton";

const chartAxis = { fontSize: 11, fontFamily: "var(--font-numeric)" };

export default function Backtest() {
  const [report, setReport] = useState(null);
  const [hero, setHero] = useState(null);
  useEffect(() => {
    Promise.all([getBacktestReport(), getBacktestHero()]).then(([r, h]) => {
      setReport(r); setHero(h);
    });
  }, []);

  const hit         = useCountUp(report ? report.summary.geopolitical_hit_rate : 0, { decimals: 1 });
  const savedShown  = useCountUp(hero ? hero.savings_per_mmbtu_inr : 0);
  const plantShown  = useCountUp(hero ? hero.example_plant_saved_cr : 0, { decimals: 1 });

  if (!report || !hero) return (
    <div className="vstack" style={{ gap: 14 }}>
      <div className="grid grid-4">{[0,1,2,3].map(i => <SkeletonPanel key={i} h={30} />)}</div>
      <SkeletonPanel h={320} />
    </div>
  );

  const s = report.summary;
  const feb = hero.timeline.find(t => t.month === hero.signal_fired_month);
  const mar = hero.timeline.find(t => t.month === hero.peak_impact_month);

  const kpis = [
    { label: "Geopolitical Hit Rate", value: `${hit}%`, sub: `of ${s.geopolitical_moves_count} geopol-driven big moves caught`, color: "var(--green)", big: true },
    { label: "Big-Move Hit Rate",     value: `${s.big_move_hit_rate}%`, sub: "all moves ≥10% MoM (incl. demand shocks)" },
    { label: "False Positive Rate",   value: `${s.false_positive_rate}%`, sub: "RED flags followed by <5% move", color: "var(--green)" },
    { label: "Months Evaluated",      value: s.months_evaluated, sub: s.date_range },
  ];

  return (
    <div className="vstack fade-up" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="panel-title"><span className="dot" /> HISTORICAL BACKTEST · 5-YEAR ACCURACY REPORT</div>
          <div className="text-muted text-sm">Every trading month in the IGX archive. All metrics from actual historical prices — no forward-looking data leaked.</div>
        </div>
        <div className="asof">{s.date_range}</div>
      </div>

      <div className="grid grid-4 stagger">
        {kpis.map((k, i) => (
          <div className="panel hover kpi" key={i}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color || "var(--fg)", fontSize: k.big ? 40 : 28 }}>{k.value}</div>
            <div className="text-muted text-sm">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ borderColor: "var(--accent)", borderWidth: 2, boxShadow: "var(--glow) var(--accent-soft)" }}>
        <div className="panel-title between" style={{ display: "flex", color: "var(--accent)" }}>
          <span className="hstack" style={{ gap: 8 }}><span className="dot" /> HERO CASE STUDY · {hero.peak_impact_month.toUpperCase()} WEST ASIA CRISIS</span>
          <span className="badge badge-red">SIGNAL VALIDATED</span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 20, alignItems: "center", margin: "6px 0 18px" }}>
          <div className="stat-tile" style={{ borderColor: "var(--border-strong)" }}>
            <div className="text-dim uppercase" style={{ fontSize: 10 }}>{feb.month.toUpperCase()} · SIGNAL FIRES</div>
            <div className="kpi-value" style={{ fontSize: 34 }}>₹{feb.actual_price}</div>
            <div className="text-muted text-sm">locked-in forward price · Hormuz RED {feb.risk_score}</div>
          </div>
          <div style={{ textAlign: "center", color: "var(--red)" }}>
            <div style={{ fontSize: 30, lineHeight: 1 }}>→</div>
            <div className="text-mono" style={{ fontWeight: 800, fontSize: 22, color: "var(--red)" }}>
              +{Math.round(((mar.actual_price - feb.actual_price) / feb.actual_price) * 100)}%
            </div>
            <div className="text-dim" style={{ fontSize: 9, letterSpacing: 1 }}>MoM</div>
          </div>
          <div className="stat-tile" style={{ borderColor: "var(--red)", background: "color-mix(in srgb, var(--red) 8%, var(--bg-panel-2))" }}>
            <div className="text-dim uppercase" style={{ fontSize: 10, color: "var(--red)" }}>{mar.month.toUpperCase()} · SPOT PEAK</div>
            <div className="kpi-value" style={{ fontSize: 34, color: "var(--red)" }}>₹{mar.actual_price}</div>
            <div className="text-muted text-sm">what spot buyers paid · Hormuz RED {mar.risk_score}</div>
          </div>
        </div>

        <div style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>{hero.narrative}</div>

        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer>
            <ComposedChart data={hero.timeline} margin={{ top: 24, right: 30, bottom: 12, left: 12 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" stroke="var(--fg-muted)" tick={chartAxis} />
              <YAxis yAxisId="left"  stroke="var(--accent)" tick={chartAxis} width={54} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--red)" tick={chartAxis} domain={[0, 100]} width={34} />
              <Tooltip />
              <ReferenceArea yAxisId="left" x1={feb.month} x2={mar.month} fill="var(--red)" fillOpacity={0.10}
                label={{ value: "SIGNAL → SPIKE", position: "insideTop", fill: "var(--red)", fontSize: 11, fontWeight: 800 }} />
              <Bar yAxisId="right" dataKey="risk_score" name="Risk Score" fill="var(--red)" fillOpacity={0.28} radius={[3,3,0,0]} animationDuration={900} />
              <Area yAxisId="left" type="monotone" dataKey="actual_price" name="GIXI ₹/MMBTU"
                stroke="var(--accent)" strokeWidth={3} fill="url(#priceFill)" dot={{ r: 3 }} animationDuration={1400} />
              <ReferenceDot yAxisId="left" x={feb.month} y={feb.actual_price} r={7}
                fill="var(--bg-panel)" stroke="var(--red)" strokeWidth={3}
                label={{ value: "▲ SIGNAL", position: "left", fill: "var(--red)", fontSize: 11, fontWeight: 800 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-3 mt-24 stagger">
          <div className="kpi"><div className="kpi-label">Signal Fired</div><div className="kpi-value" style={{ fontSize: 24 }}>{hero.signal_fired_month}</div></div>
          <div className="kpi"><div className="kpi-label">Spot Premium Avoided</div>
            <div className="kpi-value" style={{ color: "var(--green)", fontSize: 24 }}>
              ₹{savedShown}<span style={{ fontSize: 13, color: "var(--fg-muted)" }}> /MMBTU</span>
            </div></div>
          <div className="kpi"><div className="kpi-label">Example Plant Saved</div>
            <div className="kpi-value" style={{ color: "var(--green)", fontSize: 24 }}>₹{plantShown} Cr</div>
            <div className="text-muted text-sm">{hero.example_plant_config}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><span className="dot" /> MONTH-BY-MONTH DETAIL</div>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          <table>
            <thead><tr><th>Month</th><th>Risk</th><th>Level</th><th>Pred %</th><th>Actual %</th><th>Price</th><th>Event</th></tr></thead>
            <tbody>
              {report.months.slice().reverse().map(m => (
                <tr key={m.month}>
                  <td style={{ fontWeight: 700 }}>{m.month}</td>
                  <td>{m.risk_score}</td>
                  <td><span className={`badge nodot badge-${m.risk_level.toLowerCase()}`}>{m.risk_level}</span></td>
                  <td>{m.predicted_next_pct}%</td>
                  <td style={{
                    color: m.actual_next_pct == null ? "var(--fg-muted)" :
                           Math.abs(m.actual_next_pct) >= 10 ? "var(--red)" : "var(--fg)",
                    fontWeight: m.actual_next_pct != null && Math.abs(m.actual_next_pct) >= 10 ? 700 : 400,
                  }}>{m.actual_next_pct != null ? `${m.actual_next_pct > 0 ? "+" : ""}${m.actual_next_pct}%` : "—"}</td>
                  <td>₹{m.actual_avg_price}</td>
                  <td className="text-muted" style={{ fontSize: 11 }}>{m.event_note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
