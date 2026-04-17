// ============================================================
// App.jsx — The root of your application
//
// WHAT THIS FILE DOES:
//  - Defines the overall layout: sidebar + main content area
//  - Controls which page is currently visible (navigation)
//  - Loads the data once and passes it to all pages
//
// REACT CONCEPTS SHOWN HERE:
//  - useState: tracks which page is active
//  - useMemo: generates data once (not on every render)
//  - Conditional rendering: shows different pages based on state
//  - Props: passes data down to child components
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { loadDataset, computeStats } from "./data/loadData";
import Overview from "./pages/Overview";
import Sensors from "./pages/Sensors";
import Predictor from "./pages/Predictor";
import MachineHealth from "./pages/MachineHealth";
import DatasetExplorer from "./pages/DatasetExplorer";
import DataInsights from "./pages/DataInsights";

// ---- DESIGN TOKENS ----
// CSS custom properties let you change the whole app theme in one place.
// In a real app you'd swap these for a dark theme toggle.
const CSS_VARS = `
  :root {
    --bg: #F5F4F0;
    --card-bg: #FFFFFF;
    --sidebar-bg: #0F1117;
    --sidebar-text: #C2C0B6;
    --sidebar-active: #FFFFFF;
    --sidebar-active-bg: rgba(255,255,255,0.08);
    --border: rgba(0,0,0,0.08);
    --text-primary: #1A1A18;
    --text-secondary: #3D3D3A;
    --text-muted: #73726C;
    --accent: #378ADD;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', sans-serif; background: var(--bg); }
  button { font-family: inherit; transition: all 0.15s; }
  button:hover { opacity: 0.85; }
  input[type=range] { cursor: pointer; }

  /* Pulsing dot animation for alerts */
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.3); }
  }

  /* Subtle fade-in when pages switch */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-content { animation: fadeIn 0.2s ease; }

  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }

  /* ── Responsive grid utilities ─────────────────────────────── */
  .grid-4  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .grid-3  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .grid-2  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-2-sm { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-2-lg { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .predictor-split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* ── Mobile nav drawer ─────────────────────────────────────── */
  .mobile-header {
    display: none;
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 52px;
    background: var(--sidebar-bg);
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .nav-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.5);
  }
  .nav-drawer {
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 400;
    width: 260px;
    background: var(--sidebar-bg);
    display: flex; flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    overflow-y: auto;
  }
  .nav-drawer.open { transform: translateX(0); }

  @media (max-width: 768px) {
    .desktop-sidebar  { display: none !important; }
    .mobile-header    { display: flex; }
    .app-main         { padding: 72px 16px 24px !important; }

    .grid-4           { grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid-3           { grid-template-columns: 1fr; }
    .grid-2           { grid-template-columns: 1fr; }
    .grid-2-sm        { grid-template-columns: 1fr; }
    .grid-2-lg        { grid-template-columns: 1fr; gap: 16px; }
    .predictor-split  { grid-template-columns: 1fr; }
  }

  @media (min-width: 769px) {
    .nav-overlay, .nav-drawer { display: none !important; }
    .mobile-header { display: none !important; }
  }
`;

// Navigation items — each has an id, label, and icon character
const NAV_ITEMS = [
  { id: "overview",  label: "Overview",         icon: "▦" },
  { id: "sensors",   label: "Sensor explorer",  icon: "⟁" },
  { id: "health",    label: "Machine health",   icon: "◈" },
  { id: "predictor", label: "Risk predictor",   icon: "◎" },
  { id: "dataset",   label: "Dataset explorer", icon: "⊞" },
  { id: "insights",  label: "Data insights",    icon: "⬡" },
];

const CITATION = `S. Matzka, "Explainable Artificial Intelligence for Predictive Maintenance Applications," 2020 Third International Conference on Artificial Intelligence for Industries (AI4I), 2020, pp. 69–74, doi: 10.1109/AI4I49448.2020.00023.`;

function DatasetFooter() {
  const [show, setShow] = useState(false);

  return (
    <div
      style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Dataset
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, cursor: "default" }}>
        AI4I 2020<br />
        10,000 records<br />
        <span style={{ borderBottom: "1px dashed rgba(255,255,255,0.2)" }}>Matzka et al.</span>
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 6, fontStyle: "italic" }}>
        For demo purposes only
      </div>

      {show && (
        <div style={{
          position: "fixed",
          bottom: 16,
          left: 228,
          width: 300,
          background: "#1E2030",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "12px 14px",
          zIndex: 9999,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#7F77DD", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            Citation
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
            {CITATION}
          </p>
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 10, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            This dashboard is for demonstration purposes only. Source: Kaggle / UCI ML Repository.
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadDataset().then((rows) => {
      setData(rows);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => (data ? computeStats(data) : null), [data]);

  // Decide which page component to render
  // This is "conditional rendering" — React's equivalent of if/else in HTML
  function renderPage() {
    switch (activePage) {
      case "overview":  return <Overview stats={stats} data={data} />;
      case "sensors":   return <Sensors data={data} />;
      case "health":    return <MachineHealth data={data} />;
      case "predictor": return <Predictor data={data} />;
      case "dataset":   return <DatasetExplorer data={data} />;
      case "insights":  return <DataInsights data={data} />;
      default:          return <Overview stats={stats} />;
    }
  }

  if (loading) {
    return (
      <>
        <style>{CSS_VARS}</style>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .spinner {
            width: 40px; height: 40px; border-radius: 50%;
            border: 3px solid var(--border);
            border-top-color: var(--accent);
            animation: spin 0.75s linear infinite;
          }
        `}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
          <div className="spinner" />
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading AI4I 2020 dataset…</p>
        </div>
      </>
    );
  }

  function navigate(id) {
    setActivePage(id);
    setDrawerOpen(false);
  }

  return (
    <>
      {/* Inject CSS variables into the page */}
      <style>{CSS_VARS}</style>

      {/* ── Mobile top header ── */}
      <header className="mobile-header">
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#fff", fontSize: 20, lineHeight: 1 }}
          aria-label="Open menu"
        >☰</button>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>MachineIQ</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Live</span>
        </div>
      </header>

      {/* ── Mobile nav overlay ── */}
      <div className={`nav-overlay${drawerOpen ? "" : " hidden"}`}
        style={{ display: drawerOpen ? "block" : "none" }}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Mobile nav drawer ── */}
      <nav className={`nav-drawer${drawerOpen ? " open" : ""}`}>
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>MachineIQ</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Predictive Maintenance</div>
          </div>
          <button onClick={() => setDrawerOpen(false)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: "10px 0", flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", padding: "4px 20px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "11px 20px",
                  background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${isActive ? "#378ADD" : "transparent"}`,
                  color: isActive ? "#fff" : "var(--sidebar-text)",
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  cursor: "pointer", textAlign: "left",
                }}>
                <span style={{ fontSize: 15, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
        <DatasetFooter />
      </nav>

      {/* APP SHELL: sidebar + main area side by side */}
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* ===== SIDEBAR (desktop only) ===== */}
        <aside className="desktop-sidebar" style={{
          width: 220,
          background: "var(--sidebar-bg)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}>

          {/* Logo / brand */}
          <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              MachineIQ
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
              Predictive Maintenance
            </div>
          </div>

          {/* Live status indicator */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Live monitoring</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav style={{ padding: "12px 0", flex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", padding: "4px 20px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "9px 20px",
                    background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                    border: "none",
                    borderLeft: `2px solid ${isActive ? "#378ADD" : "transparent"}`,
                    color: isActive ? "var(--sidebar-active)" : "var(--sidebar-text)",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 14, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom: dataset info with citation tooltip */}
          <DatasetFooter />
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="app-main" style={{ flex: 1, padding: "28px 32px", overflowY: "auto", minWidth: 0 }}>
          {/* key={activePage} forces a remount on navigation, triggering the fade-in animation */}
          <div key={activePage} className="page-content">
            {renderPage()}
          </div>
        </main>

      </div>
    </>
  );
}
