import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import { runScenario } from "../lib/api";

const chartAxis = { fontSize: 11, fontFamily: "var(--font-numeric)" };
const EVENT_TYPES = [
  { value: "hormuz_closure",      label: "Strait of Hormuz Partial Closure" },
  { value: "red_sea_suspension",  label: "Red Sea Shipping Suspension"     },
  { value: "opec_cut",            label: "OPEC+ Emergency Production Cut" },
  { value: "iran_sanctions",      label: "Iran Sanctions Snapback"          },
];

export default function Scenario() {
  const [eventType, setEventType] = useState("hormuz_closure");
  const [severity, setSeverity]   = useState(0.8);
  const [dur, setDur]             = useState(4);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);

  async function simulate() {
    setLoading(true);
    try {
      const r = await runScenario({ event_type: eventType, severity, duration_weeks: dur });
      setResult(r);
    } finally { setLoading(false); }
  }

  const chartData = result ? [
    { name: "Current", value: result.price_impact.gixi_baseline_inr, fill: "var(--fg-muted)" },
    { name: "Low",     value: result.price_impact.gixi_low_inr,      fill: "var(--amber)"    },
    { name: "Mid",     value: result.price_impact.gixi_mid_inr,      fill: "var(--red)"      },
    { name: "High",    value: result.price_impact.gixi_high_inr,     fill: "var(--red)"      },
  ] : [];

  return (
    <div className="vstack fade-up" style={{ gap: 16 }}>
      <div>
        <div className="panel-title"><span className="dot" /> SCENARIO SIMULATOR</div>
        <div className="text-muted text-sm">Model the impact of a geopolitical event on Indian gas prices, import costs, and SPR runway.</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-title"><span className="dot" /> CONFIGURE EVENT</div>
          <div className="vstack" style={{ gap: 18 }}>
            <div>
              <label>Event type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label>Severity: {(severity * 100).toFixed(0)}%</label>
              <input type="range" min="0" max="1" step="0.05" value={severity} onChange={e => setSeverity(+e.target.value)} />
            </div>
            <div>
              <label>Duration: {dur} weeks</label>
              <input type="range" min="1" max="12" step="1" value={dur} onChange={e => setDur(+e.target.value)} />
            </div>
            <button className="btn" onClick={simulate} disabled={loading}>
              {loading ? "Simulating…" : "Run Simulation"}
            </button>
          </div>
        </div>

        {result ? (
          <div className="vstack" style={{ gap: 16 }}>
            <div className="grid grid-3 stagger">
              <div className="panel kpi">
                <div className="kpi-label">GIXI Impact</div>
                <div className="kpi-value" style={{ color: "var(--red)" }}>+{result.price_impact.gixi_change_pct_mid}%</div>
                <div className="text-muted text-sm">₹{result.price_impact.gixi_baseline_inr} → ₹{result.price_impact.gixi_mid_inr}</div>
              </div>
              <div className="panel kpi">
                <div className="kpi-label">Extra Import Cost</div>
                <div className="kpi-value" style={{ color: "var(--red)" }}>${result.macro_impact.india_extra_import_cost_usd_bn}B</div>
                <div className="text-muted text-sm">India / month</div>
              </div>
              <div className="panel kpi">
                <div className="kpi-label">SPR Runway</div>
                <div className="kpi-value" style={{ color: result.macro_impact.spr_days_remaining < 6 ? "var(--red)" : "var(--fg)" }}>
                  {result.macro_impact.spr_days_remaining}d
                </div>
                <div className="text-muted text-sm">was {result.macro_impact.spr_days_baseline}d</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title"><span className="dot" /> GIXI PRICE RANGE · ₹/MMBTU</div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--fg-muted)" tick={chartAxis} />
                    <YAxis stroke="var(--fg-muted)" tick={chartAxis} domain={["dataMin - 100", "dataMax + 100"]} width={48} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title"><span className="dot" /> RECOMMENDED ACTIONS</div>
              <ol style={{ paddingLeft: 18, lineHeight: 2 }}>
                {result.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
              </ol>
            </div>
          </div>
        ) : (
          <div className="panel" style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
            <div className="text-muted text-sm">Configure a scenario and press <b>Run Simulation</b>.</div>
          </div>
        )}
      </div>
    </div>
  );
}
