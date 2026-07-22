import { useEffect, useState } from "react";
import { getSignal } from "../lib/api";
import DeltaChip from "../components/DeltaChip";
import Sparkline from "../components/Sparkline";
import { useCountUp, deriveSeries, levelColor, fmtTime } from "../hooks/useCountUp";
import { LoadingBrand } from "../components/Skeleton";

const ACTION_LABEL = { BUY_NOW: "BUY NOW", PARTIAL_HEDGE: "HEDGE 50%", WAIT: "WAIT" };
const ACTION_SUB = {
  BUY_NOW: "Lock in 60-day forward supply",
  PARTIAL_HEDGE: "Hedge half, leave half on spot",
  WAIT: "Continue normal procurement",
};
const ROWS = [
  { key: "hormuz",  label: "Strait of Hormuz",  weight: "60%" },
  { key: "red_sea", label: "Red Sea",           weight: "30%" },
  { key: "caspian", label: "Caspian / Russia",  weight: "10%" },
];

export default function Signal() {
  const [data, setData] = useState(null);
  const [conf, setConf] = useState(0);
  useEffect(() => {
    getSignal().then(d => {
      setData(d);
      setTimeout(() => setConf(d.confidence), 120);
    });
  }, []);

  const confShown = useCountUp(data ? data.confidence : 0, { duration: 1200 });

  if (!data) return <LoadingBrand label="Computing 30-day signal…" />;
  const barClass = data.action === "BUY_NOW" ? "red" : data.action === "PARTIAL_HEDGE" ? "amber" : "green";

  return (
    <div className="vstack fade-up" style={{ gap: 16, maxWidth: 1000, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <div className="panel-title"><span className="dot" /> 30-DAY PROCUREMENT RECOMMENDATION</div>
          <div className="text-muted text-sm">System recommendation for gas procurement over the next 30 days, based on live corridor risk.</div>
        </div>
        <div className="asof">AS OF {fmtTime(new Date().toISOString())} IST</div>
      </div>

      <div className={`signal-card ${data.action}`}>
        <div className="signal-eyebrow">◈ CRUXIQ DIRECTIVE · COMPOSITE {data.composite_score}</div>
        <div className="signal-action">{ACTION_LABEL[data.action] || data.action}</div>
        <div className="signal-conf">
          {ACTION_SUB[data.action]} · CONFIDENCE <b className="text-mono">{confShown}%</b>
        </div>
        <div className="bar tall" style={{ maxWidth: 340, margin: "0 auto 26px" }}>
          <div className={`bar-fill sheen ${barClass}`} style={{ width: `${conf}%` }} />
        </div>
        <div className="signal-rationale">{data.rationale}</div>
      </div>

      <div className="grid grid-3 stagger">
        {ROWS.map(r => {
          const c = data.corridors[r.key]; if (!c) return null;
          return (
            <div className="panel hover" key={r.key}>
              <div className="hstack between mb-8">
                <span className="text-dim uppercase" style={{ fontSize: 10 }}>{r.label}</span>
                <span className="text-dim text-mono" style={{ fontSize: 10 }}>{r.weight}</span>
              </div>
              <div className="hstack between">
                <span className="kpi-value" style={{ fontSize: 30, color: levelColor(c.level) }}>{c.score}</span>
                <span className={`badge badge-${c.level.toLowerCase()}`}>{c.level}</span>
              </div>
              <Sparkline data={deriveSeries(c.score, c.trend)} color={levelColor(c.level)} width={260} height={30} />
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-title"><span className="dot" /> SIGNAL DRIVERS · CORRIDOR BREAKDOWN</div>
        <table>
          <thead><tr><th>Corridor</th><th>Score</th><th>Level</th><th>Trend</th><th>Weight</th></tr></thead>
          <tbody>
            {ROWS.map(r => {
              const c = data.corridors[r.key]; if (!c) return null;
              return (
                <tr key={r.key}>
                  <td style={{ fontWeight: 700 }}>{r.label}</td>
                  <td style={{ color: levelColor(c.level), fontWeight: 700 }}>{c.score}</td>
                  <td><span className={`badge nodot badge-${c.level.toLowerCase()}`}>{c.level}</span></td>
                  <td className="text-muted">{c.trend}</td>
                  <td className="text-muted">{r.weight}</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid var(--border-strong)", fontWeight: 800 }}>
              <td>COMPOSITE</td><td colSpan={4}>{data.composite_score}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
