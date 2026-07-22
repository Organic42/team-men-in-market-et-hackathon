/**
 * Peer benchmark strip — where does this plant's exposure sit against
 * a realistic population of sector peers?
 *
 * Reads /api/plant/benchmark. Shows: verdict, percentile, delta vs. median,
 * and a horizontal distribution bar with the plant's position marked.
 */

export default function PeerBenchmark({ data }) {
  if (!data || data.error) return null;

  const {
    your_exposure_cr, peer_median_cr, peer_min_cr, peer_max_cr,
    percentile, peers_below, peers_above,
    delta_vs_median_pct, verdict, verdict_color,
    distribution,
  } = data;

  const badgeClass = verdict_color === "red" ? "badge-red"
                   : verdict_color === "amber" ? "badge-amber" : "badge-green";
  const barColor   = verdict_color === "red" ? "var(--red)"
                   : verdict_color === "amber" ? "var(--amber)" : "var(--green)";

  // Position of the marker on the 0-100% axis, mapped from your value in the min..max range
  const span = peer_max_cr - peer_min_cr || 1;
  const myPos = Math.max(0, Math.min(100, ((your_exposure_cr - peer_min_cr) / span) * 100));
  const medPos = Math.max(0, Math.min(100, ((peer_median_cr - peer_min_cr) / span) * 100));

  return (
    <div className="panel">
      <div className="panel-title between" style={{ display: "flex" }}>
        <span className="hstack" style={{ gap: 8 }}>
          <span className="dot" /> PEER BENCHMARK · {data.plant_type.toUpperCase()}
        </span>
        <span className={`badge nodot ${badgeClass}`}>{verdict}</span>
      </div>

      <div className="grid grid-3" style={{ gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi-label">Your Percentile Rank</div>
          <div className="kpi-value" style={{ color: barColor, fontSize: 40 }}>
            {percentile}<span style={{ fontSize: 16, color: "var(--fg-muted)" }}>th</span>
          </div>
          <div className="text-muted text-sm">
            {peers_below} peers below · {peers_above} above
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">vs. Peer Median</div>
          <div className="kpi-value" style={{
            color: delta_vs_median_pct <= 0 ? "var(--green)" : "var(--red)",
            fontSize: 40,
          }}>
            {delta_vs_median_pct > 0 ? "+" : ""}{delta_vs_median_pct}%
          </div>
          <div className="text-muted text-sm">
            median exposure ₹{peer_median_cr} Cr
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Peer Range</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>
            ₹{peer_min_cr} → ₹{peer_max_cr} Cr
          </div>
          <div className="text-muted text-sm">
            across {data.peer_count} sector peers
          </div>
        </div>
      </div>

      {/* Distribution bar */}
      <div style={{ marginTop: 8 }}>
        <div className="hstack between" style={{ marginBottom: 8, fontSize: 10, color: "var(--fg-muted)", letterSpacing: 1 }}>
          <span>LOWER EXPOSURE (BETTER)</span>
          <span>HIGHER EXPOSURE (WORSE) →</span>
        </div>
        <div style={{
          position: "relative",
          height: 40,
          background: "linear-gradient(to right, color-mix(in srgb, var(--green) 20%, transparent), color-mix(in srgb, var(--amber) 20%, transparent), color-mix(in srgb, var(--red) 25%, transparent))",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border-strong)",
        }}>
          {/* Peer dots */}
          {distribution.map((v, i) => {
            const pct = ((v - peer_min_cr) / span) * 100;
            return (
              <div key={i} style={{
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--fg-muted)", opacity: 0.6,
              }} />
            );
          })}
          {/* Median marker */}
          <div style={{
            position: "absolute",
            left: `${medPos}%`,
            top: 0, bottom: 0,
            width: 2, background: "var(--fg-muted)",
            transform: "translateX(-1px)",
          }} />
          <div style={{
            position: "absolute",
            left: `${medPos}%`,
            top: -18, transform: "translateX(-50%)",
            fontSize: 9, color: "var(--fg-muted)", letterSpacing: 1,
            whiteSpace: "nowrap",
          }}>
            MEDIAN
          </div>
          {/* Your plant marker */}
          <div style={{
            position: "absolute",
            left: `${myPos}%`,
            top: -4, bottom: -4,
            width: 4, background: barColor,
            transform: "translateX(-2px)",
            borderRadius: 2,
            boxShadow: `0 0 8px ${barColor}`,
          }} />
          <div style={{
            position: "absolute",
            left: `${myPos}%`,
            bottom: -22, transform: "translateX(-50%)",
            fontSize: 10, fontWeight: 800, color: barColor, letterSpacing: 1,
            whiteSpace: "nowrap",
          }}>
            YOU · ₹{your_exposure_cr} Cr
          </div>
        </div>
        {/* Scale labels */}
        <div className="hstack between" style={{ marginTop: 28, fontSize: 10, color: "var(--fg-muted)", fontFamily: "var(--font-numeric)" }}>
          <span>₹{peer_min_cr} Cr</span>
          <span>₹{peer_max_cr} Cr</span>
        </div>
      </div>
    </div>
  );
}
