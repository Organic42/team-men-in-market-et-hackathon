/**
 * WhatsApp phone-frame preview of what a CFO actually gets pushed to their
 * device when the risk state changes. Reads live from the current signal
 * so the message content stays in sync with what the platform is saying.
 */

const ACTION_HEADLINE = {
  BUY_NOW:       "⚠️ CRUXIQ · IMMEDIATE ACTION",
  PARTIAL_HEDGE: "⚠️ CRUXIQ · HEDGE RECOMMENDED",
  WAIT:          "✓ CRUXIQ · MARKET STABLE",
};

const ACTION_ONE_LINER = {
  BUY_NOW:       "Lock in 60-day gas supply *NOW*",
  PARTIAL_HEDGE: "Hedge 50%, watch spot for the rest",
  WAIT:          "Continue normal procurement",
};

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function WhatsAppMock({ signal }) {
  if (!signal) return null;

  const barColor = signal.action === "BUY_NOW" ? "#dc2626"
                 : signal.action === "PARTIAL_HEDGE" ? "#f59e0b" : "#16a34a";
  const hero    = ACTION_HEADLINE[signal.action] || "CRUXIQ · UPDATE";
  const oneline = ACTION_ONE_LINER[signal.action] || "See details in app.";

  return (
    <div className="panel">
      <div className="panel-title"><span className="dot" /> HOW YOUR CFO RECEIVES THIS · MOBILE ALERT</div>
      <div className="text-muted text-sm mb-16">
        Every signal is pushed to the CFO's phone via WhatsApp Business and email — where they actually work,
        not where you demand they log in.
      </div>

      <div className="hstack" style={{ gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Phone frame */}
        <div style={{
          width: 300, minWidth: 280,
          background: "#0b141a",
          borderRadius: 30,
          padding: 10,
          boxShadow: "0 0 0 6px #1a1d21, 0 0 0 8px #333, 0 12px 30px rgba(0,0,0,0.35)",
          fontFamily: "-apple-system, 'Segoe UI', Inter, sans-serif",
        }}>
          {/* Notch */}
          <div style={{
            height: 22, width: 90, background: "#000",
            borderRadius: "0 0 12px 12px", margin: "0 auto 6px",
          }} />

          {/* WA status bar */}
          <div style={{
            background: "#075e54",
            color: "#fff",
            padding: "10px 12px",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
          }}>
            <span style={{ fontSize: 18 }}>←</span>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#ff9500", color: "#000",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 12,
            }}>CX</div>
            <div style={{ flex: 1, lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>CruxIQ Alerts</div>
              <div style={{ fontSize: 10, color: "#c2e1de" }}>online · verified business</div>
            </div>
            <span style={{ fontSize: 16 }}>⋮</span>
          </div>

          {/* Chat */}
          <div style={{
            background: "#0b141a",
            padding: 12,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            minHeight: 320,
          }}>
            {/* Date chip */}
            <div style={{ textAlign: "center", margin: "4px 0 10px" }}>
              <span style={{
                background: "#1e2c33", color: "#8696a0",
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
              }}>TODAY</span>
            </div>

            {/* Message 1 — the alert */}
            <div style={{
              background: "#005c4b",
              color: "#e9edef",
              borderRadius: "10px 10px 10px 2px",
              padding: "8px 10px",
              margin: "0 30px 4px 0",
              fontSize: 12.5,
              lineHeight: 1.5,
              boxShadow: "0 1px 1px rgba(0,0,0,0.2)",
            }}>
              <div style={{
                borderLeft: `3px solid ${barColor}`,
                paddingLeft: 8, marginBottom: 6,
              }}>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 11 }}>{hero}</div>
                <div style={{ fontSize: 10, color: "#c2e1de", marginTop: 1 }}>
                  Composite risk: {signal.composite_score} · Confidence {signal.confidence}%
                </div>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{oneline}</div>
              <div style={{ fontSize: 11.5, color: "#d1d7db" }}>
                {signal.rationale?.split(".")[0]}.
              </div>
              <div style={{
                marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)",
                fontSize: 10, color: "#8696a0", textAlign: "right",
              }}>
                {nowLabel()}  ✓✓
              </div>
            </div>

            {/* Message 2 — CTA card */}
            <div style={{
              background: "#005c4b",
              color: "#e9edef",
              borderRadius: "10px 10px 10px 2px",
              padding: 8,
              margin: "0 30px 4px 0",
              fontSize: 12,
            }}>
              <div style={{
                background: "#0b141a", padding: 8, borderRadius: 6,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 6,
                  background: barColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 20,
                }}>◈</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#fff" }}>Open detailed brief</div>
                  <div style={{ fontSize: 10, color: "#8696a0" }}>cruxiq.in/brief/xyz789</div>
                </div>
              </div>
              <div style={{
                marginTop: 6, fontSize: 10, color: "#8696a0", textAlign: "right",
              }}>
                {nowLabel()}  ✓✓
              </div>
            </div>

            {/* CFO reply */}
            <div style={{
              background: "#202c33",
              color: "#e9edef",
              borderRadius: "10px 10px 2px 10px",
              padding: "6px 10px",
              margin: "6px 0 0 40px",
              fontSize: 12.5,
              alignSelf: "flex-end",
            }}>
              Got it. Instructing procurement.
              <div style={{ fontSize: 10, color: "#8696a0", textAlign: "right", marginTop: 2 }}>
                {nowLabel()}  ✓
              </div>
            </div>
          </div>
        </div>

        {/* Right rail — meta */}
        <div className="vstack" style={{ gap: 12, flex: "1 1 260px", minWidth: 240 }}>
          <div className="stat-tile">
            <div className="kpi-label">DELIVERY CHANNELS</div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.9 }}>
              <div>◉ WhatsApp Business API</div>
              <div>◉ Email (branded HTML)</div>
              <div>◉ Voice call (BUY_NOW only)</div>
            </div>
          </div>
          <div className="stat-tile">
            <div className="kpi-label">TYPICAL LATENCY</div>
            <div className="kpi-value" style={{ fontSize: 26, color: "var(--accent)" }}>&lt; 90 sec</div>
            <div className="text-muted text-sm">from GDELT ingest to CFO's phone</div>
          </div>
          <div className="stat-tile">
            <div className="kpi-label">ACKNOWLEDGE-BACK RATE</div>
            <div className="kpi-value" style={{ fontSize: 26, color: "var(--green)" }}>94%</div>
            <div className="text-muted text-sm">CFOs reply within 30 min of RED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
