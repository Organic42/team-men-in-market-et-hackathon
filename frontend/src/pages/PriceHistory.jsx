import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ReferenceArea, ResponsiveContainer,
} from "recharts";
import { getIGXMonthly, getBacktestReport } from "../lib/api";
import DeltaChip from "../components/DeltaChip";
import { SkeletonPanel } from "../components/Skeleton";

const chartAxis = { fontSize: 11, fontFamily: "var(--font-numeric)" };
const KEY_EVENTS = [
  { month: "2022-02", label: "Russia invades Ukraine",    severity: "red"   },
  { month: "2022-10", label: "OPEC+ emergency cut",       severity: "amber" },
  { month: "2023-10", label: "Israel-Gaza begins",        severity: "amber" },
  { month: "2024-01", label: "Houthi Red Sea strikes",    severity: "amber" },
  { month: "2025-06", label: "US-Iran standoff",          severity: "amber" },
  { month: "2026-02", label: "CruxIQ signal fires",       severity: "red"   },
  { month: "2026-03", label: "GIXI +69% MoM",             severity: "red"   },
];

export default function PriceHistory() {
  const [rows, setRows] = useState(null);
  const [zoom, setZoom] = useState("all");
  useEffect(() => {
    Promise.all([getIGXMonthly(), getBacktestReport()]).then(([m, b]) => {
      setRows(m.map(r => {
        const s = b.months.find(x => x.month === r.month);
        return { month: r.month, price: Math.round(r.avg_price),
          risk_score: s?.risk_score ?? 20, risk_level: s?.risk_level ?? "GREEN" };
      }));
    });
  }, []);
  if (!rows) return <SkeletonPanel h={360} />;

  const filtered = zoom === "all" ? rows
    : zoom === "hero"   ? rows.filter(r => r.month >= "2025-11" && r.month <= "2026-07")
    : rows.filter(r => r.month >= new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().slice(0, 7));
  const eventDots = KEY_EVENTS.map(e => ({ ...e, ...rows.find(r => r.month === e.month) })).filter(e => e.price);
  const heroActive = zoom === "hero";
  const last = rows[rows.length - 1], prev = rows[rows.length - 2];

  return (
    <div className="vstack fade-up" style={{ gap: 16 }}>
      <div className="panel">
        <div className="page-head mb-16">
          <div>
            <div className="panel-title"><span className="dot" /> IGX MONTHLY AVG PRICE · ₹/MMBTU</div>
            <div className="hstack" style={{ gap: 12 }}>
              <span className="kpi-value" style={{ fontSize: 30 }}>₹{last.price}</span>
              <DeltaChip value={+(((last.price - prev.price) / prev.price) * 100).toFixed(1)} unit="%" invert />
              <span className="text-dim text-sm">{rows.length} months · {rows[0].month} → {last.month}</span>
            </div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            {[{ k: "all", label: "All" }, { k: "recent", label: "3Y" }, { k: "hero", label: "Mar 2026 Zoom" }].map(b => (
              <button key={b.k} className="theme-toggle" onClick={() => setZoom(b.k)}
                style={{ color: zoom === b.k ? "var(--accent)" : "var(--fg-muted)",
                  borderColor: zoom === b.k ? "var(--accent)" : "var(--border)",
                  background: zoom === b.k ? "var(--accent-soft)" : "transparent" }}>{b.label}</button>
            ))}
          </div>
        </div>
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <AreaChart data={filtered} margin={{ top: 20, right: 24, bottom: 12, left: 12 }}>
              <defs>
                <linearGradient id="ph" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" stroke="var(--fg-muted)" tick={chartAxis} minTickGap={30} />
              <YAxis stroke="var(--fg-muted)" tick={chartAxis} domain={["dataMin - 100", "dataMax + 100"]} width={54} />
              <Tooltip />
              {heroActive && (
                <ReferenceArea x1="2026-02" x2="2026-03" fill="var(--red)" fillOpacity={0.12}
                  label={{ value: "SIGNAL → SPIKE", position: "top", fill: "var(--red)", fontSize: 12, fontWeight: 800 }} />
              )}
              <Area type="monotone" dataKey="price" stroke="var(--accent)" strokeWidth={2.5}
                fill="url(#ph)" dot={false} activeDot={{ r: 5 }} animationDuration={1400} />
              {eventDots.filter(e => filtered.find(r => r.month === e.month)).map((e, i) => (
                <ReferenceDot key={i} x={e.month} y={e.price} r={5}
                  fill={e.severity === "red" ? "var(--red)" : "var(--amber)"}
                  stroke="var(--bg-panel)" strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><span className="dot" /> ANNOTATED EVENTS · GEOPOLITICAL TIMELINE</div>
        <div className="grid grid-3" style={{ gap: 10 }}>
          {KEY_EVENTS.slice().reverse().map((e, i) => {
            const row = rows.find(r => r.month === e.month);
            return (
              <div key={i} className="hstack" style={{ gap: 10, padding: "6px 0" }}>
                <span className={`badge nodot badge-${e.severity}`}>{e.month}</span>
                <div style={{ flex: 1 }}>
                  <div className="text-sm">{e.label}</div>
                  {row && <div className="text-dim text-mono" style={{ fontSize: 11 }}>₹{row.price} / MMBTU</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
