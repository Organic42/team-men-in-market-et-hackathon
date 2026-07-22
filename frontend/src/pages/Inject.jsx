import { useState } from "react";
import { injectEvent } from "../lib/api";
import { levelColor } from "../hooks/useCountUp";

const SAMPLES = [
  "Iranian IRGC seizes British-flagged tanker in Strait of Hormuz overnight",
  "Houthi missile strike hits chemical tanker off Yemen coast",
  "US Treasury announces secondary sanctions on Iranian crude buyers",
  "CPC pipeline halts export after drone strike near Novorossiysk",
  "Saudi Aramco raises Asian OSP by $2.10/bbl citing tightness",
];

export default function Inject() {
  const [headline, setHeadline] = useState(SAMPLES[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await injectEvent(headline);
      setResult(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vstack fade-up" style={{ gap: 16, maxWidth: 1000, margin: "0 auto" }}>
      <div>
        <div className="panel-title"><span className="dot" /> CUSTOM EVENT INJECTOR</div>
        <div className="text-muted text-sm">
          Type a hypothetical headline. Groq (Llama-3.1-70B) extracts structured impact fields. Our deterministic
          formula converts them into a corridor score and 30-day GIXI forecast. No black box.
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><span className="dot" /> HEADLINE</div>
        <textarea
          value={headline}
          onChange={e => setHeadline(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            background: "var(--bg-panel-2)",
            color: "var(--fg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 12,
            fontFamily: "var(--font-body)",
            fontSize: 14,
            resize: "vertical",
          }}
          placeholder="Iranian IRGC seizes British-flagged tanker in Strait of Hormuz overnight"
        />
        <div className="hstack" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn" onClick={run} disabled={loading || !headline.trim()}>
            {loading ? "Analyzing…" : "Score Headline"}
          </button>
          {SAMPLES.map((s, i) => (
            <button key={i} className="theme-toggle" style={{ fontSize: 10 }} onClick={() => setHeadline(s)}>
              SAMPLE {i + 1}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {result && !result.error && (
        <div className="vstack" style={{ gap: 14 }}>
          {/* Verdict */}
          <div className="panel" style={{ borderColor: levelColor(result.level), borderWidth: 2 }}>
            <div className="panel-title" style={{ color: levelColor(result.level) }}>
              <span className="dot" /> VERDICT · {result.corridor.toUpperCase().replace("_", " ")} · {result.level}
            </div>
            <div className="grid grid-3" style={{ gap: 14, marginTop: 8 }}>
              <div className="kpi">
                <div className="kpi-label">Corridor Score</div>
                <div className="kpi-value" style={{ color: levelColor(result.level), fontSize: 42 }}>
                  {result.corridor_score}
                </div>
                <div className="text-muted text-sm">0-100 scale</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Severity (LLM)</div>
                <div className="kpi-value" style={{ fontSize: 42 }}>
                  {result.extracted.severity}<span style={{ fontSize: 18, color: "var(--fg-muted)" }}>/10</span>
                </div>
                <div className="text-muted text-sm">{result.extracted.impact_type}</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">30-Day GIXI Move</div>
                <div className="kpi-value" style={{ color: "var(--red)", fontSize: 42 }}>
                  +{result.predicted_gixi_pct}%
                </div>
                <div className="text-muted text-sm">projected</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: "var(--bg-panel-2)",
                          borderRadius: "var(--radius)", fontSize: 13, lineHeight: 1.7 }}>
              <b>Reasoning:</b> {result.explanation}
            </div>
          </div>

          {/* LLM extraction */}
          <div className="panel">
            <div className="panel-title"><span className="dot" /> LLM EXTRACTION · {result.extracted.source}</div>
            <pre style={{
              margin: 0, padding: 12, background: "var(--bg-panel-2)",
              border: "1px solid var(--border)", borderRadius: "var(--radius)",
              fontFamily: "var(--font-numeric)", fontSize: 12, overflowX: "auto",
              color: "var(--fg)",
            }}>{JSON.stringify(result.extracted, null, 2)}</pre>
          </div>

          {/* Audit trail */}
          <div className="panel">
            <div className="panel-title"><span className="dot" /> SCORING FORMULA · AUDITABLE</div>
            <table>
              <tbody>
                <tr><td>Corridor</td><td className="text-mono" style={{ color: "var(--accent)" }}>{result.corridor}</td></tr>
                <tr><td>Severity (0-10)</td><td className="text-mono">{result.extracted.severity}</td></tr>
                <tr><td>India exposure weight</td><td className="text-mono">
                  {result.corridor === "hormuz" ? "1.00" : result.corridor === "red_sea" ? "0.75" : "0.60"}
                </td></tr>
                <tr><td>Multiplier for 30-day GIXI</td><td className="text-mono">
                  {result.corridor === "hormuz" ? "0.22" : result.corridor === "red_sea" ? "0.12" : "0.08"}
                </td></tr>
                <tr style={{ borderTop: "2px solid var(--border-strong)", fontWeight: 800 }}>
                  <td>Final corridor score</td>
                  <td className="text-mono" style={{ color: levelColor(result.level) }}>
                    {result.corridor_score} · {result.level}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
