import { useEffect } from "react";
import { levelColor } from "../hooks/useCountUp";

const CORRIDOR_INFO = {
  hormuz:  { weight: "1.00", multiplier: "0.22", name: "Strait of Hormuz",
             note: "40-45% of India's crude imports transit through this corridor." },
  red_sea: { weight: "0.75", multiplier: "0.12", name: "Red Sea / Bab-el-Mandeb",
             note: "15% of India's crude imports use this corridor; reroute via Cape adds 10-14 days." },
  caspian: { weight: "0.60", multiplier: "0.08", name: "Caspian / Russia",
             note: "Smaller direct India exposure but drives global gas benchmarks (TTF)." },
};

export default function LineageModal({ corridorKey, corridor, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!corridor) return null;
  const info = CORRIDOR_INFO[corridorKey] || {};

  // Reconstruct the deterministic scoring math from the corridor state.
  // score = base + trend_multiplier — the same formula in risk_scorer.py.
  const avgSeverity = corridor.events?.length
    ? corridor.events.reduce((s, e) => s + (e.severity || 0), 0) / corridor.events.length
    : 4;
  const trendAdj = corridor.trend === "escalating" ? "+25%" :
                   corridor.trend === "de-escalating" ? "-20%" : "0";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, zIndex: 100,
      backdropFilter: "blur(3px)",
    }}>
      <div onClick={e => e.stopPropagation()} className="panel" style={{
        maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto",
        borderColor: levelColor(corridor.level), borderWidth: 2,
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
      }}>
        <div className="hstack between mb-16">
          <div>
            <div className="panel-title" style={{ color: levelColor(corridor.level) }}>
              <span className="dot" /> WHY THIS SCORE? · {info.name?.toUpperCase() || corridorKey.toUpperCase()}
            </div>
            <div className="text-muted text-sm">
              Full audit trail — from raw news headlines to the final score.
            </div>
          </div>
          <button className="theme-toggle" onClick={onClose}>ESC ✕</button>
        </div>

        {/* Verdict banner */}
        <div style={{
          padding: "14px 16px",
          background: `color-mix(in srgb, ${levelColor(corridor.level)} 12%, var(--bg-panel-2))`,
          border: `1px solid ${levelColor(corridor.level)}`,
          borderRadius: "var(--radius)",
          marginBottom: 18,
        }}>
          <div className="hstack between">
            <div className="hstack" style={{ gap: 16 }}>
              <div className="kpi-value" style={{ color: levelColor(corridor.level), fontSize: 40 }}>
                {corridor.score}
              </div>
              <div className="vstack" style={{ gap: 4 }}>
                <span className={`badge badge-${corridor.level.toLowerCase()}`}>{corridor.level}</span>
                <span className="text-mono text-sm">TREND: {corridor.trend}</span>
              </div>
            </div>
            <div className="text-muted text-sm" style={{ maxWidth: 260, textAlign: "right", lineHeight: 1.5 }}>
              {info.note}
            </div>
          </div>
        </div>

        {/* Step 1: Source headlines */}
        <div className="mb-16">
          <div className="panel-title" style={{ fontSize: 10 }}>
            <span className="dot" /> STEP 1 · SOURCE HEADLINES (GDELT last 72h)
          </div>
          <div className="vstack" style={{ gap: 8, marginTop: 8 }}>
            {(corridor.events || []).map((e, i) => (
              <div key={i} className="stat-tile">
                <div className="hstack between mb-8">
                  <span className="text-mono text-sm" style={{ color: "var(--accent)" }}>
                    {e.date || "recent"}
                  </span>
                  <span className={`badge nodot badge-${e.severity >= 7 ? "red" : e.severity >= 4 ? "amber" : "green"}`}>
                    {e.severity}/10 · {e.impact_type}
                  </span>
                </div>
                <div className="text-sm" style={{ lineHeight: 1.5 }}>{e.description}</div>
              </div>
            ))}
            {(!corridor.events || corridor.events.length === 0) && (
              <div className="text-muted text-sm">No source events in last 72 hours.</div>
            )}
          </div>
        </div>

        {/* Step 2: LLM extraction */}
        <div className="mb-16">
          <div className="panel-title" style={{ fontSize: 10 }}>
            <span className="dot" /> STEP 2 · LLM STRUCTURED EXTRACTION (Groq · Llama-3.1-70B)
          </div>
          <div className="text-muted text-sm mb-8">
            The LLM's job is to extract structured fields only. It never computes the score.
          </div>
          <pre style={{
            padding: 12, background: "var(--bg-panel-2)",
            border: "1px solid var(--border)", borderRadius: "var(--radius)",
            fontFamily: "var(--font-numeric)", fontSize: 11, overflowX: "auto",
            color: "var(--fg)", lineHeight: 1.6,
          }}>
{JSON.stringify({
  corridor: corridorKey,
  events: (corridor.events || []).map(e => ({
    date: e.date,
    impact_type: e.impact_type,
    severity: e.severity,
    description: e.description,
  })),
  overall_severity: Math.round(avgSeverity),
  trend: corridor.trend,
}, null, 2)}
          </pre>
        </div>

        {/* Step 3: Deterministic scoring */}
        <div className="mb-16">
          <div className="panel-title" style={{ fontSize: 10 }}>
            <span className="dot" /> STEP 3 · DETERMINISTIC SCORING FORMULA
          </div>
          <div className="text-muted text-sm mb-8">
            Pure math — no LLM in this step. Reproducible, auditable, testable.
          </div>
          <table>
            <tbody>
              <tr>
                <td className="text-muted">Average event severity</td>
                <td className="text-mono" style={{ textAlign: "right" }}>{avgSeverity.toFixed(1)} / 10</td>
              </tr>
              <tr>
                <td className="text-muted">× 8 (base severity multiplier)</td>
                <td className="text-mono" style={{ textAlign: "right" }}>{(avgSeverity * 8).toFixed(0)}</td>
              </tr>
              <tr>
                <td className="text-muted">Trend adjustment ({corridor.trend})</td>
                <td className="text-mono" style={{ textAlign: "right" }}>{trendAdj}</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--border-strong)" }}>
                <td className="text-muted">India-exposure weight for {corridorKey}</td>
                <td className="text-mono" style={{ textAlign: "right" }}>× {info.weight || "1.00"}</td>
              </tr>
              <tr style={{ borderTop: "2px solid var(--border-strong)", fontWeight: 800 }}>
                <td>FINAL CORRIDOR SCORE</td>
                <td className="text-mono" style={{ textAlign: "right", color: levelColor(corridor.level), fontSize: 16 }}>
                  {corridor.score} · {corridor.level}
                </td>
              </tr>
              <tr>
                <td className="text-muted">30-day GIXI multiplier for {corridorKey}</td>
                <td className="text-mono" style={{ textAlign: "right" }}>× {info.multiplier || "0.22"}</td>
              </tr>
              <tr style={{ fontWeight: 800 }}>
                <td>PROJECTED 30-DAY GIXI IMPACT</td>
                <td className="text-mono" style={{ textAlign: "right", color: "var(--red)", fontSize: 15 }}>
                  +{(corridor.score / 100 * parseFloat(info.multiplier || 0.22) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="stat-tile" style={{ borderColor: "var(--accent)" }}>
          <div className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
            <b style={{ color: "var(--accent)" }}>Why this matters:</b> The LLM extracts facts,
            the formula converts facts to numbers. Every score is reproducible from the source headlines.
            No black-box hallucinations reach the CFO's decision.
          </div>
        </div>
      </div>
    </div>
  );
}
