import { useEffect, useMemo, useState } from "react";
import { getPortfolio } from "../lib/api";
import { levelColor } from "../hooks/useCountUp";

const SECTOR_LABEL = { cement: "Cement", steel: "Steel", chemical: "Chemical" };
const REGIONS     = ["All", "North", "South", "East", "West", "Central"];

export default function Portfolio() {
  const [data,   setData]   = useState(null);
  const [sortBy, setSortBy] = useState("exposure_cr");
  const [sortDir, setSortDir] = useState("desc");
  const [region, setRegion] = useState("All");
  const [sector, setSector] = useState("all");

  useEffect(() => { getPortfolio().then(setData); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let plants = data.plants;
    if (region !== "All") plants = plants.filter(p => p.region === region);
    if (sector !== "all") plants = plants.filter(p => p.plant_type === sector);
    const sorted = [...plants].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [data, sortBy, sortDir, region, sector]);

  const filteredTotals = useMemo(() => {
    if (!filtered.length) return null;
    return {
      exposure_cr: filtered.reduce((s, p) => s + p.exposure_cr, 0),
      revenue_cr:  filtered.reduce((s, p) => s + p.annual_revenue_cr, 0),
      gas_cost_cr: filtered.reduce((s, p) => s + p.annual_gas_cost_cr, 0),
    };
  }, [filtered]);

  if (!data) return <div className="loading">Rolling up 15 plants across the group…</div>;

  const s = data.summary;
  const setSort = k => {
    if (sortBy === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(k); setSortDir("desc"); }
  };
  const arrow = k => sortBy !== k ? "" : sortDir === "asc" ? " ▲" : " ▼";

  return (
    <div className="vstack fade-up" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="panel-title"><span className="dot" /> ENTERPRISE PORTFOLIO · GROUP EXPOSURE</div>
          <div className="text-muted text-sm">
            Multi-plant rollup for a large Indian industrial group.
            The land-and-expand story: one deployment → the whole book.
          </div>
        </div>
        <div className="asof">15 PLANTS · 5 REGIONS · 3 SECTORS</div>
      </div>

      {/* Group KPIs */}
      <div className="grid grid-4 stagger">
        <div className="panel kpi">
          <div className="kpi-label">Total Group Exposure</div>
          <div className="kpi-value" style={{ color: "var(--red)", fontSize: 34 }}>
            ₹{s.total_exposure_cr.toLocaleString("en-IN")} Cr
          </div>
          <div className="text-muted text-sm">
            {s.group_exposure_pct}% of group revenue
          </div>
        </div>
        <div className="panel kpi">
          <div className="kpi-label">Annual Gas Spend</div>
          <div className="kpi-value" style={{ fontSize: 34 }}>
            ₹{s.total_gas_spend_cr.toLocaleString("en-IN")} Cr
          </div>
          <div className="text-muted text-sm">across the book</div>
        </div>
        <div className="panel kpi">
          <div className="kpi-label">RED Plants</div>
          <div className="kpi-value" style={{ color: "var(--red)", fontSize: 34 }}>
            {s.red_plants}<span style={{ fontSize: 14, color: "var(--fg-muted)" }}> / {s.plant_count}</span>
          </div>
          <div className="text-muted text-sm">need immediate action</div>
        </div>
        <div className="panel kpi">
          <div className="kpi-label">CruxIQ ARR from Group</div>
          <div className="kpi-value" style={{ color: "var(--green)", fontSize: 34 }}>
            ₹{s.arr_ceiling_cr} Cr
          </div>
          <div className="text-muted text-sm">at ₹30L base tier / plant</div>
        </div>
      </div>

      {/* Sector breakdown */}
      <div className="panel">
        <div className="panel-title"><span className="dot" /> EXPOSURE BY SECTOR</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, height: 28, borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border-strong)" }}>
          {Object.entries(data.by_sector).map(([sec, x]) => {
            const pct = (x.exposure_cr / s.total_exposure_cr) * 100;
            const color = sec === "chemical" ? "var(--red)" : sec === "steel" ? "var(--amber)" : "var(--accent)";
            return (
              <div key={sec} title={`${SECTOR_LABEL[sec]} — ₹${x.exposure_cr} Cr · ${pct.toFixed(0)}%`}
                   style={{ width: `${pct}%`, background: color, display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#000", fontWeight: 800, fontSize: 11, letterSpacing: 1 }}>
                {pct > 8 && `${SECTOR_LABEL[sec].toUpperCase()} · ₹${x.exposure_cr} Cr`}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="panel hstack" style={{ gap: 12, flexWrap: "wrap" }}>
        <span className="uppercase text-sm" style={{ color: "var(--fg-muted)" }}>Filter:</span>
        <div className="hstack" style={{ gap: 4 }}>
          {REGIONS.map(r => (
            <button key={r} className="theme-toggle" onClick={() => setRegion(r)}
              style={{ color: region === r ? "var(--accent)" : "var(--fg-muted)",
                       borderColor: region === r ? "var(--accent)" : "var(--border)" }}>
              {r}
            </button>
          ))}
        </div>
        <span style={{ borderLeft: "1px solid var(--border)", height: 20, margin: "0 8px" }} />
        <div className="hstack" style={{ gap: 4 }}>
          {[["all","All Sectors"], ["cement","Cement"], ["steel","Steel"], ["chemical","Chemical"]].map(([k, lbl]) => (
            <button key={k} className="theme-toggle" onClick={() => setSector(k)}
              style={{ color: sector === k ? "var(--accent)" : "var(--fg-muted)",
                       borderColor: sector === k ? "var(--accent)" : "var(--border)" }}>
              {lbl}
            </button>
          ))}
        </div>
        <span className="text-muted text-sm" style={{ marginLeft: "auto" }}>
          Showing {filtered.length} of {data.plants.length} plants
        </span>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th style={{ cursor: "pointer" }} onClick={() => setSort("id")}>Plant{arrow("id")}</th>
              <th style={{ cursor: "pointer" }} onClick={() => setSort("plant_type")}>Sector{arrow("plant_type")}</th>
              <th style={{ cursor: "pointer" }} onClick={() => setSort("region")}>Region{arrow("region")}</th>
              <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => setSort("capacity_mtpa")}>MTPA{arrow("capacity_mtpa")}</th>
              <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => setSort("gas_share_pct")}>Gas %{arrow("gas_share_pct")}</th>
              <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => setSort("annual_revenue_cr")}>Revenue ₹Cr{arrow("annual_revenue_cr")}</th>
              <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => setSort("annual_gas_cost_cr")}>Gas Spend ₹Cr{arrow("annual_gas_cost_cr")}</th>
              <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => setSort("exposure_cr")}>Exposure ₹Cr{arrow("exposure_cr")}</th>
              <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => setSort("exposure_pct_rev")}>% of Rev{arrow("exposure_pct_rev")}</th>
              <th style={{ textAlign: "center" }}>Level</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 700 }}>{p.id}</td>
                <td className="text-muted">{SECTOR_LABEL[p.plant_type]}</td>
                <td className="text-muted">{p.region}</td>
                <td style={{ textAlign: "right" }}>{p.capacity_mtpa}</td>
                <td style={{ textAlign: "right" }}>{p.gas_share_pct}%</td>
                <td style={{ textAlign: "right" }}>{p.annual_revenue_cr.toLocaleString("en-IN")}</td>
                <td style={{ textAlign: "right" }}>{p.annual_gas_cost_cr.toLocaleString("en-IN")}</td>
                <td style={{ textAlign: "right", color: levelColor(p.level), fontWeight: 800 }}>
                  {p.exposure_cr.toLocaleString("en-IN")}
                </td>
                <td style={{ textAlign: "right", color: p.exposure_pct_rev >= 5 ? "var(--red)" : "var(--fg)" }}>
                  {p.exposure_pct_rev}%
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge nodot badge-${p.level.toLowerCase()}`}>{p.level}</span>
                </td>
              </tr>
            ))}
            {filteredTotals && (
              <tr style={{ borderTop: "2px solid var(--border-strong)", fontWeight: 800 }}>
                <td colSpan={5}>TOTAL · {filtered.length} PLANTS</td>
                <td style={{ textAlign: "right" }}>{filteredTotals.revenue_cr.toLocaleString("en-IN")}</td>
                <td style={{ textAlign: "right" }}>{Math.round(filteredTotals.gas_cost_cr).toLocaleString("en-IN")}</td>
                <td style={{ textAlign: "right", color: "var(--red)" }}>
                  {Math.round(filteredTotals.exposure_cr).toLocaleString("en-IN")}
                </td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
