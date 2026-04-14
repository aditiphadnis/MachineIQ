// ============================================================
// AlertBanner.jsx
// WHAT: A coloured banner that shows when machines are at risk.
// This is the kind of thing that makes stakeholders lean forward —
// it feels like a real live monitoring system.
// ============================================================

export default function AlertBanner({ alerts }) {
    // If there are no alerts, render nothing at all
    // WHY: "null" in React means "don't show anything here"
    if (!alerts || alerts.length === 0) return null;
  
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {/* Loop through each alert and show a banner */}
        {/* .map() turns an array of data into an array of HTML */}
        {alerts.map((alert, index) => (
          <div
            key={index} // WHY KEY: React needs a unique ID to track list items
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${alert.color}44`,
              background: `${alert.color}11`,
            }}
          >
            {/* Pulsing dot — animates to draw attention */}
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: alert.color,
              flexShrink: 0,
              animation: "pulse 1.4s ease-in-out infinite",
            }} />
  
            {/* Alert message */}
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: alert.color }}>
                {alert.title}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 8 }}>
                {alert.message}
              </span>
            </div>
  
            {/* Severity badge on the right */}
            <span style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              background: alert.color,
              color: "#fff",
              letterSpacing: "0.04em",
            }}>
              {alert.severity}
            </span>
          </div>
        ))}
      </div>
    );
  }
  