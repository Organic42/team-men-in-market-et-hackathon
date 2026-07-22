import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RiskCenter from "./pages/RiskCenter";
import PriceHistory from "./pages/PriceHistory";
import Signal from "./pages/Signal";
import Scenario from "./pages/Scenario";
import PlantImpact from "./pages/PlantImpact";
import Backtest from "./pages/Backtest";
import Inject from "./pages/Inject";
import TimeTravel from "./pages/TimeTravel";

import "./themes.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index               element={<RiskCenter />} />
          <Route path="prices"       element={<PriceHistory />} />
          <Route path="signal"       element={<Signal />} />
          <Route path="scenario"     element={<Scenario />} />
          <Route path="plant"        element={<PlantImpact />} />
          <Route path="backtest"     element={<Backtest />} />
          <Route path="inject"       element={<Inject />} />
          <Route path="history"      element={<TimeTravel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
