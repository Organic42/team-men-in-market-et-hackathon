import { useEffect, useState } from "react";

const THEMES = ["bloomberg", "saas"];
const LABEL   = { bloomberg: "TERMINAL", saas: "SAAS" };
const ICON    = { bloomberg: "◼", saas: "◻" };

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    THEMES.includes(localStorage.getItem("cruxiq-theme")) ? localStorage.getItem("cruxiq-theme") : "bloomberg"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cruxiq-theme", theme);
  }, [theme]);
  const next = theme === "bloomberg" ? "saas" : "bloomberg";
  return (
    <button className="theme-toggle" onClick={() => setTheme(next)} title={`Switch to ${LABEL[next]} view`}>
      <span style={{ fontSize: 13 }}>{ICON[theme]}</span>
      <span>{LABEL[theme]}</span>
    </button>
  );
}
