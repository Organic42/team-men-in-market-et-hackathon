import { levelColor } from "../hooks/useCountUp";

const CONTINENTS = [
  "M70 70 L150 60 L205 78 L212 120 L188 150 L150 148 L120 175 L96 165 L104 132 L78 120 Z",
  "M170 178 L205 172 L214 200 L235 250 L224 300 L206 330 L192 318 L196 268 L178 232 L166 205 Z",
  "M405 78 L470 70 L500 92 L486 120 L452 128 L430 112 L408 104 Z",
  "M430 150 L500 142 L520 178 L512 232 L482 300 L458 300 L446 250 L430 205 L424 175 Z",
  "M500 70 L640 58 L760 74 L820 104 L806 150 L742 156 L700 138 L648 150 L604 132 L556 140 L516 118 L502 96 Z",
  "M690 168 L742 170 L760 196 L724 214 L694 200 Z",
  "M740 260 L812 252 L836 292 L800 322 L748 314 L730 286 Z",
];
const MAP_CORRIDORS = {
  hormuz:  { node: [590, 168], mid: [612, 205], label: "STRAIT OF HORMUZ",       lpos: [560, 150] },
  red_sea: { node: [548, 200], mid: [582, 224], label: "RED SEA · BAB-EL-MANDEB", lpos: [470, 214] },
  caspian: { node: [588, 138], mid: [610, 180], label: "CASPIAN · RUSSIA",        lpos: [600, 124] },
};
const INDIA = [648, 210];

export default function WorldMap({ corridors }) {
  const W = 900, H = 380;
  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-title between" style={{ display: "flex" }}>
        <span className="hstack" style={{ gap: 8 }}>
          <span className="dot" /> SHIPPING CORRIDORS · LIVE THREAT MAP
        </span>
        <span className="asof">LIVE</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <radialGradient id="ocean" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="var(--bg-panel-2)" />
            <stop offset="100%" stopColor="var(--bg)" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#ocean)" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={"v" + i} x1={i * (W / 8)} y1="0" x2={i * (W / 8)} y2={H} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={"h" + i} x1="0" y1={i * (H / 4)} x2={W} y2={i * (H / 4)} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
        ))}
        {CONTINENTS.map((d, i) => (
          <path key={i} d={d} fill="var(--bg-elev)" stroke="var(--border-strong)" strokeWidth="1" strokeLinejoin="round" />
        ))}
        {corridors && Object.entries(MAP_CORRIDORS).map(([k, cfg]) => {
          const d = corridors[k]; if (!d) return null;
          const c = levelColor(d.level);
          const path = `M${cfg.node[0]} ${cfg.node[1]} Q${cfg.mid[0]} ${cfg.mid[1]} ${INDIA[0]} ${INDIA[1]}`;
          const isRed = d.level === "RED";
          return (
            <g key={k}>
              <path d={path} stroke={c} strokeWidth="9" fill="none" opacity="0.14" strokeLinecap="round" />
              <path d={path} stroke={c} strokeWidth="2.2" fill="none" strokeLinecap="round"
                strokeDasharray="7 9"
                style={{ animation: "dashFlow 1.1s linear infinite", filter: isRed ? `drop-shadow(0 0 5px ${c})` : "none" }} />
              <circle cx={cfg.node[0]} cy={cfg.node[1]} r="4.5" fill={c} />
              {isRed && (
                <circle cx={cfg.node[0]} cy={cfg.node[1]} r="4.5" fill="none" stroke={c} strokeWidth="1.5"
                  style={{ transformOrigin: `${cfg.node[0]}px ${cfg.node[1]}px`, animation: "ringPulse 1.8s var(--ease) infinite" }} />
              )}
              <g style={{ animation: `tankerMove ${isRed ? 3.4 : 6}s linear infinite`, offsetPath: `path('${path}')` }}>
                <rect x="-5" y="-2.2" width="10" height="4.4" rx="1" fill="var(--fg)" opacity="0.85" />
                <rect x="-5" y="-2.2" width="2.4" height="4.4" rx="1" fill={c} />
              </g>
              <text x={cfg.lpos[0]} y={cfg.lpos[1]} fill={c}
                style={{ fontFamily: "var(--font-numeric)", fontSize: 10, fontWeight: 800, letterSpacing: 0.6 }}>
                {cfg.label} · {d.score}
              </text>
            </g>
          );
        })}
        <circle cx={INDIA[0]} cy={INDIA[1]} r="5.5" fill="var(--accent)" />
        <circle cx={INDIA[0]} cy={INDIA[1]} r="5.5" fill="none" stroke="var(--accent)" strokeWidth="1.5"
          style={{ transformOrigin: `${INDIA[0]}px ${INDIA[1]}px`, animation: "ringPulse 2.6s var(--ease) infinite" }} />
        <text x={INDIA[0] + 11} y={INDIA[1] + 4} fill="var(--accent)"
          style={{ fontFamily: "var(--font-numeric)", fontSize: 12, fontWeight: 800 }}>INDIA</text>
      </svg>
    </div>
  );
}
