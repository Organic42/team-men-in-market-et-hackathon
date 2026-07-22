export default function Sparkline({ data, color, height = 30, width = 120, animate = true }) {
  const vs = data.map(d => d.v);
  const min = Math.min(...vs), max = Math.max(...vs);
  const nx = i => (i / (data.length - 1)) * width;
  const ny = v => height - 3 - ((v - min) / (max - min || 1)) * (height - 6);
  const d = data.map((p, i) => `${i ? "L" : "M"}${nx(i).toFixed(1)} ${ny(p.v).toFixed(1)}`).join(" ");
  const area = `${d} L${width} ${height} L0 ${height} Z`;
  const id = "sg" + Math.round(min + max + data.length);
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
        style={animate ? { strokeDasharray: 1000, strokeDashoffset: 1000, animation: "dashDraw 1.1s var(--ease) forwards" } : null} />
      <circle cx={nx(data.length - 1)} cy={ny(vs[vs.length - 1])} r="2.4" fill={color} />
    </svg>
  );
}
