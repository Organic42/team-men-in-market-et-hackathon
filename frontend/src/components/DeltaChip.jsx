export default function DeltaChip({ value, unit = "", invert = false }) {
  const up = value > 0.05, down = value < -0.05;
  const cls = up ? (invert ? "down" : "up") : down ? (invert ? "up" : "down") : "flat";
  const arrow = up ? "▲" : down ? "▼" : "▬";
  return <span className={`delta-chip ${cls}`}>{arrow} {value > 0 ? "+" : ""}{value}{unit}</span>;
}
