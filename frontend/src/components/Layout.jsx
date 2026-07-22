import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { to: "/",           fn: "F1", label: "Risk Center"  },
  { to: "/prices",     fn: "F2", label: "IGX History"  },
  { to: "/signal",     fn: "F3", label: "Signal"       },
  { to: "/scenario",   fn: "F4", label: "Scenario"     },
  { to: "/plant",      fn: "F5", label: "Plant Impact" },
  { to: "/portfolio",  fn: "F6", label: "Portfolio"    },
  { to: "/backtest",   fn: "F7", label: "Backtest"     },
  { to: "/inject",     fn: "F8", label: "Inject"       },
  { to: "/history",    fn: "F9", label: "Time-Travel"  },
];

export default function Layout() {
  return (
    <div className="app">
      <nav className="nav">
        {/* renders as CRUX + "IQ" (two-tone via .brand::after in themes.css) */}
        <div className="brand">CRUX</div>
        <div className="nav-links">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}
              className={({ isActive }) => isActive ? "active" : ""}>
              <span className="fkey">{n.fn}</span>{n.label}
            </NavLink>
          ))}
        </div>
        <ThemeToggle />
      </nav>
      <main className="main"><Outlet /></main>
    </div>
  );
}
