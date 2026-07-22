import { useEffect, useState } from "react";
import { getPlantImpact, getSignal, getPeerBenchmark } from "../lib/api";
import PeerBenchmark from "../components/PeerBenchmark";

const PLANT_TYPES = [
  { value: "cement",   label: "Cement" },
  { value: "steel",    label: "Integrated Steel" },
  { value: "chemical", label: "Chemical / Fertiliser" },
];
const fmtCr = n => `₹${Number(n).toLocaleString("en-IN")} Cr`;

export default function PlantImpact() {
  const [plantType, setPlantType] = useState("cement");
  const [capacity, setCapacity]   = useState(2.0);
  const [gasShare, setGasShare]   = useState(30);
  const [data, setData]           = useState(null);
  const [signal, setSignal]       = useState(null);
  const [peers, setPeers]         = useState(null);
  const [loading, setLoading]     = useState(false);

  async function calc() {
    setLoading(true);
    try {
      // Fetch impact + peer benchmark in parallel — same inputs
      const [d, p] = await Promise.all([
        getPlantImpact(plantType, capacity, gasShare),
        getPeerBenchmark(plantType, capacity, gasShare).catch(() => null),
      ]);
      setData(d);
      setPeers(p);
    } finally { setLoading(false); }
  }
  useEffect(() => { calc(); /* initial */ /* eslint-disable-next-line */ }, []);
  useEffect(() => { getSignal().then(setSignal).catch(() => {}); }, []);

  const savedCr = data ? +(data.exposure.current_risk_scenario_cost_cr * 0.8).toFixed(1) : 0;

  return (
    <>
    <div className="vstack fade-up" style={{ gap: 16 }}>
      <div className="hstack between">
        <div>
          <div className="panel-title"><span className="dot" /> PLANT-LEVEL EXPOSURE CALCULATOR</div>
          <div className="text-muted text-sm">Rupee impact of the current risk scenario on a specific plant configuration.</div>
        </div>
        {data && (
          <button className="btn no-print" onClick={() => window.print()}
                  title="Save as PDF via browser print dialog"
                  style={{ whiteSpace: "nowrap" }}>
            ▤ Download CFO Report (PDF)
          </button>
        )}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-title"><span className="dot" /> PLANT CONFIGURATION</div>
          <div className="vstack" style={{ gap: 18 }}>
            <div>
              <label>Plant Type</label>
              <select value={plantType} onChange={e => setPlantType(e.target.value)}>
                {PLANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label>Capacity: {capacity} MTPA</label>
              <input type="range" min="0.5" max="10" step="0.5" value={capacity} onChange={e => setCapacity(+e.target.value)} />
            </div>
            <div>
              <label>Gas Share of Energy Mix: {gasShare}%</label>
              <input type="range" min="10" max="90" step="5" value={gasShare} onChange={e => setGasShare(+e.target.value)} />
            </div>
            <button className="btn" onClick={calc} disabled={loading}>
              {loading ? "Calculating…" : "Calculate Exposure"}
            </button>
          </div>
        </div>

        {data && (
          <div className="vstack" style={{ gap: 16 }}>
            <div className="panel">
              <div className="panel-title"><span className="dot" /> {String(data.plant_type).toUpperCase()} · {data.capacity_mtpa} MTPA</div>
              <div className="grid grid-2">
                <div className="kpi">
                  <div className="kpi-label">Annual Gas Consumption</div>
                  <div className="kpi-value">{(data.gas_consumption.annual_mmbtu / 1e6).toFixed(2)}M</div>
                  <div className="text-muted text-sm">MMBTU / year</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Current Gas Spend</div>
                  <div className="kpi-value">{fmtCr(data.gas_consumption.annual_cost_cr)}</div>
                  <div className="text-muted text-sm">at ₹{data.current_gixi}/MMBTU GIXI</div>
                </div>
              </div>
            </div>

            <div className="panel" style={{ borderColor: "var(--red)" }}>
              <div className="panel-title" style={{ color: "var(--red)" }}><span className="dot" /> RISK EXPOSURE · CURRENT SCENARIO</div>
              <div className="grid grid-3">
                <div className="kpi">
                  <div className="kpi-label">If GIXI moves +10%</div>
                  <div className="kpi-value" style={{ color: "var(--amber)" }}>{fmtCr(data.exposure.per_10pct_gixi_move_cr)}</div>
                  <div className="text-muted text-sm">Additional annual cost</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">Current Risk Impact</div>
                  <div className="kpi-value" style={{ color: "var(--red)" }}>{fmtCr(data.exposure.current_risk_scenario_cost_cr)}</div>
                  <div className="text-muted text-sm">at {data.exposure.current_risk_scenario_pct}% projected move</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label">% of Revenue at Risk</div>
                  <div className="kpi-value" style={{ color: "var(--red)" }}>{data.exposure.as_pct_of_revenue}%</div>
                  <div className="text-muted text-sm">Revenue: {fmtCr(data.context.annual_revenue_cr)}</div>
                </div>
              </div>
            </div>

            <PeerBenchmark data={peers} />

            <div className="panel">
              <div className="panel-title"><span className="dot" /> CFO SUMMARY</div>
              <div style={{ padding: "8px 0", lineHeight: 1.8 }}>
                A <strong>{data.capacity_mtpa} MTPA {data.plant_type}</strong> at <strong>{data.gas_share_pct}% gas share</strong> faces{" "}
                <strong style={{ color: "var(--red)" }}>{fmtCr(data.exposure.current_risk_scenario_cost_cr)} in annual gas cost inflation</strong>{" "}
                under the currently elevated Hormuz risk scenario.<br /><br />
                CruxIQ's forward-supply lock, if executed, is projected to eliminate roughly{" "}
                <strong style={{ color: "var(--green)" }}>{fmtCr((+data.exposure.current_risk_scenario_cost_cr * 0.8).toFixed(1))}</strong>{" "}
                of that exposure. Payback on subscription (₹30L / year): <strong>{data.context.payback_on_tool_months} months</strong>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* PRINT-ONLY CFO REPORT · shown only when the user hits Download PDF */}
    {data && (
      <div className="vstack print-only">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                       borderBottom: "3px solid #2563eb", paddingBottom: 8, marginBottom: 14 }}>
          <div>
            <div className="brand">CRUX IQ</div>
            <h1>Energy Risk & Exposure Report</h1>
            <div style={{ color: "#64748b", fontSize: 10 }}>
              {data.plant_type} · {data.capacity_mtpa} MTPA · {data.gas_share_pct}% gas share
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 9, color: "#64748b" }}>
            Prepared: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}<br />
            Report ID: CRX-{Date.now().toString(36).toUpperCase()}
          </div>
        </div>

        {/* HERO: current signal */}
        {signal && (
          <div className="panel">
            <h2>Current Procurement Signal</h2>
            <div className="grid grid-3">
              <div>
                <div className="kpi-label">Recommendation</div>
                <div className="kpi-value red" style={{ fontSize: "24pt" }}>{signal.action.replace("_", " ")}</div>
              </div>
              <div>
                <div className="kpi-label">Confidence</div>
                <div className="kpi-value">{signal.confidence}%</div>
              </div>
              <div>
                <div className="kpi-label">Composite Risk</div>
                <div className="kpi-value red">{signal.composite_score}</div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, marginTop: 10, lineHeight: 1.6 }}>{signal.rationale}</div>
          </div>
        )}

        {/* PLANT EXPOSURE */}
        <div className="panel">
          <h2>Your Plant Exposure</h2>
          <div className="grid grid-3">
            <div>
              <div className="kpi-label">Annual Gas Spend</div>
              <div className="kpi-value">₹{data.gas_consumption.annual_cost_cr} Cr</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>at ₹{data.current_gixi}/MMBTU GIXI</div>
            </div>
            <div>
              <div className="kpi-label">Cost at Current Risk</div>
              <div className="kpi-value red">+ ₹{data.exposure.current_risk_scenario_cost_cr} Cr</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>at {data.exposure.current_risk_scenario_pct}% projected move</div>
            </div>
            <div>
              <div className="kpi-label">% of Revenue at Risk</div>
              <div className="kpi-value red">{data.exposure.as_pct_of_revenue}%</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>Revenue: ₹{data.context.annual_revenue_cr} Cr</div>
            </div>
          </div>
        </div>

        {/* SAVINGS */}
        <div className="panel">
          <h2>Projected Savings with CruxIQ</h2>
          <div className="grid grid-2">
            <div>
              <div className="kpi-label">Exposure Eliminated by Forward Lock</div>
              <div className="kpi-value green">₹{savedCr} Cr / year</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>
                Executing forward-supply lock as recommended above avoids ~80% of the projected exposure.
              </div>
            </div>
            <div>
              <div className="kpi-label">Payback on Subscription</div>
              <div className="kpi-value green">{data.context.payback_on_tool_months} months</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Base tier: ₹30 lakh / plant / year</div>
            </div>
          </div>
        </div>

        {/* METHOD */}
        <div className="panel">
          <h2>Methodology · Auditable</h2>
          <div style={{ fontSize: 10.5, lineHeight: 1.7 }}>
            Corridor risk scores derived from GDELT news via LLM structured extraction (Groq · Llama-3.1-70B),
            then converted to scores by a deterministic formula. Plant exposure computed from published energy-intensity
            benchmarks (BEE PAT / Indian industry sources). Backtest against 5 years of Indian Gas Exchange (IGX) trade data
            shows <b>77.8% hit rate</b> on geopolitically-driven big moves, RMSE 19.9pp.
          </div>
        </div>

        <div className="foot">
          Generated by CruxIQ · ET AI Hackathon 2026 Submission ·
          Confidential to {data.plant_type} plant operations · Not investment advice
        </div>
      </div>
    )}
    </>
  );
}
