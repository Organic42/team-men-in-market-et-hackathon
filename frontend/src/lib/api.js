import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// ── IGX ───────────────────────────────────────────────────────────────
export const getIGXSummary  = () => api.get("/api/igx/summary").then(r => r.data);
export const getIGXMonthly  = (frm) => api.get("/api/igx/monthly", { params: { from: frm } }).then(r => r.data);
export const getIGXPrices   = (frm, to) => api.get("/api/igx/prices",  { params: { from: frm, to } }).then(r => r.data);

// ── Risk ──────────────────────────────────────────────────────────────
export const getCorridors = () => api.get("/api/risk/corridors").then(r => r.data);
export const getSignal    = () => api.get("/api/risk/signal").then(r => r.data);
export const getEvents    = (days = 90) => api.get("/api/risk/events", { params: { days } }).then(r => r.data);

// ── Scenario ──────────────────────────────────────────────────────────
export const runScenario = (payload) =>
  api.post("/api/scenario/simulate", payload).then(r => r.data);

// ── Plant ─────────────────────────────────────────────────────────────
export const getPlantImpact = (plant_type, capacity_mtpa, gas_share_pct) =>
  api.get("/api/plant/impact", { params: { plant_type, capacity_mtpa, gas_share_pct } }).then(r => r.data);

// ── Backtest ──────────────────────────────────────────────────────────
export const getBacktestReport = () => api.get("/api/backtest/report").then(r => r.data);
export const getBacktestHero   = () => api.get("/api/backtest/hero").then(r => r.data);

// ── Custom event injector + historical time-travel ───────────────────
export const injectEvent    = (headline) => api.post("/api/risk/inject", { headline }).then(r => r.data);
export const getHistoricalAt = (month)   => api.get("/api/risk/at",     { params: { month } }).then(r => r.data);

// ── Peer benchmarking ────────────────────────────────────────────────
export const getPeerBenchmark = (plant_type, capacity_mtpa, gas_share_pct) =>
  api.get("/api/plant/benchmark", { params: { plant_type, capacity_mtpa, gas_share_pct } }).then(r => r.data);

// ── Enterprise portfolio ─────────────────────────────────────────────
export const getPortfolio = () => api.get("/api/plant/portfolio").then(r => r.data);
