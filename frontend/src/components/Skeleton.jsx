export function SkeletonPanel({ h = 120 }) {
  return (
    <div className="skeleton-panel">
      <div className="skeleton sk-title mb-16" />
      <div className="skeleton sk-line mb-8" style={{ width: "90%" }} />
      <div className="skeleton sk-line mb-8" style={{ width: "70%" }} />
      <div className="skeleton" style={{ height: h, borderRadius: 6, marginTop: 12 }} />
    </div>
  );
}
export function LoadingBrand({ label = "Loading…" }) {
  return <div className="loading-brand"><div className="ring" />{label}</div>;
}
