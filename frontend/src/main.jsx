import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Set initial theme before render to avoid flash.
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("cruxiq-theme") || "bloomberg"
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
