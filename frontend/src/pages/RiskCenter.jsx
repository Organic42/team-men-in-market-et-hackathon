import { useEffect, useState } from "react";
import { getCorridors } from "../lib/api";
import CorridorGauge from "../components/CorridorGauge";
import WorldMap from "../components/WorldMap";
import DeltaChip from "../components/DeltaChip";
import { useCountUp, deriveDelta, levelColor, fmtTime } from "../hooks/useCountUp";
import { SkeletonPanel } from "../components/Skeleton";
import LineageModal from "../components/LineageModal";

const NAMES = {
  hormuz: "Strait of Hormuz",
  red_sea: "Red Sea / Bab-el-Mandeb",
  caspian: "Caspian / Russia",
};

export default function RiskCenter() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lineageKey, setLineageKey] = useState(null);
  useEffect(() => { getCorridors().then(setData).catch(e => setError(String(e))); }, []);

  const composite = data ? Math.round(
    data.hormuz.score * 0.6 + data.red_sea.score * 0.3 + data.caspian.score * 0.1
  ) : 0;
  const compShown = useCountUp(composite);

  if (error) return <div className="error">Failed to load corridor risk: {error}</div>;
  if (!data) return (
    <div className="vstack" style={{ gap: 14 }}>
      <SkeletonPanel h={40} />
      <div className="grid grid-3">{[0,1,2].map(i => <SkeletonPanel key={i} h={120} />)}</div>
      <div className="cmd-grid"><SkeletonPanel h={200} /><SkeletonPanel h={280} /><SkeletonPanel h={280} /></div>
    </div>
  );

  const compLevel = composite >= 70 ? "RED" : composite >= 40 ? "AMBER" : "GREEN";
  const allEvents = Object.entries(data)
    .flatMap(([c, d]) => (d.events || []).map(e => ({ ...e, corridor: c })))
    .sort((a, b) => (b.severity || 0) - (a.severity || 0));

  return (
    <div className="vstack fade-up" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <div className="panel-title" style={{ marginBottom: 4 }}>
            <span className="dot" /> INDIA ENERGY SUPPLY RISK · COMPOSITE
          </div>
          <div className="hstack" style={{ gap: 14 }}>
            <div className="kpi-value" style={{ fontSize: 56 }}>{compShown}</div>
            <div className="vstack" style={{ gap: 6, alignItems: "flex-start" }}>
              <span className={`badge badge-${compLevel.toLowerCase()}`}>{compLevel}</span>
              <DeltaChip value={deriveDelta(composite, "escalating")} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="text-muted text-sm" style={{ lineHeight: 1.7 }}>
            Weighted across 3 corridors<br />
            Hormuz 60% · Red Sea 30% · Caspian 10%
          </div>
          <div className="asof mt-8" style={{ justifyContent: "flex-end" }}>AS OF {fmtTime(data.hormuz.updated)} IST</div>
        </div>
      </div>

      <div className="cmd-grid">
        <div className="vstack stagger" style={{ gap: 14 }}>
          {["hormuz", "red_sea", "caspian"].map(k => (
            <CorridorGauge key={k} name={NAMES[k]}
              score={data[k].score} level={data[k].level}
              trend={data[k].trend} updated={data[k].updated} />
          ))}
        </div>

        <div className="vstack" style={{ gap: 14 }}>
          <WorldMap corridors={data} />
          <div className="grid grid-3" style={{ gap: 14 }}>
            {["hormuz","red_sea","caspian"].map(k => (
              <div className="stat-tile" key={k}
                   onClick={() => setLineageKey(k)}
                   style={{ cursor: "pointer", position: "relative" }}
                   title="Click to see why this score">
                <div className="hstack between">
                  <div className="text-dim" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>{k.replace("_"," ")}</div>
                  <div className="text-dim" style={{ fontSize: 9, letterSpacing: 1 }}>WHY? ▸</div>
                </div>
                <div className="hstack between" style={{ marginTop: 4 }}>
                  <span className="text-mono" style={{ fontSize: 18, fontWeight: 700, color: levelColor(data[k].level) }}>{data[k].score}</span>
                  <DeltaChip value={deriveDelta(data[k].score, data[k].trend)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ maxHeight: 560, display: "flex", flexDirection: "column" }}>
          <div className="panel-title between" style={{ display: "flex" }}>
            <span className="hstack" style={{ gap: 8 }}><span className="dot" /> LIVE EVENT FEED</span>
            <span className="text-dim" style={{ fontSize: 10 }}>72H</span>
          </div>
          <div className="vstack" style={{ gap: 0, overflowY: "auto" }}>
            {allEvents.map((e, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="hstack between" style={{ marginBottom: 5 }}>
                  <span className="uppercase" style={{ color: "var(--accent)", fontSize: 10 }}>{NAMES[e.corridor]}</span>
                  <span className={`badge nodot badge-${e.severity >= 7 ? "red" : e.severity >= 4 ? "amber" : "green"}`}>{e.severity}/10</span>
                </div>
                <div className="text-sm" style={{ lineHeight: 1.5 }}>{e.description}</div>
                <div className="text-dim text-mono" style={{ fontSize: 10, marginTop: 4 }}>
                  {e.date} · {(e.impact_type || "").toUpperCase()}
                </div>
              </div>
            ))}
            {allEvents.length === 0 && (
              <div className="text-muted text-sm" style={{ padding: "12px 0" }}>No recent events across monitored corridors.</div>
            )}
          </div>
        </div>
      </div>

      {lineageKey && (
        <LineageModal
          corridorKey={lineageKey}
          corridor={data[lineageKey]}
          onClose={() => setLineageKey(null)}
        />
      )}
    </div>
  );
}
