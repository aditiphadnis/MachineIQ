// ============================================================
// KpiCard.jsx
// WHAT: A single summary number card — e.g. "Total Runs: 10,000"
// WHY A COMPONENT: We need 4 of these. Instead of copy-pasting
// the same HTML 4 times, we define it once and reuse it.
// HOW COMPONENTS WORK: Think of it like a function that returns HTML.
// You pass in data as "props" (like function arguments).
// ============================================================

// Props this component accepts:
//   label  — the small text above, e.g. "Total Runs"
//   value  — the big number, e.g. "10,000"
//   sub    — optional small note below, e.g. "last 30 days"
//   color  — optional accent color for the value text
//   trend  — optional trend text e.g. "+2.4%"
//   trendUp — true = green arrow, false = red arrow

export default function KpiCard({ label, value, sub, color, trend, trendUp }) {
    return (
      // Each card is a white box with a subtle border
      <div style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        // Left accent bar — a thin colored strip on the left edge
        borderLeft: color ? `3px solid ${color}` : "1px solid var(--border)",
      }}>
  
        {/* LABEL — small muted text at the top */}
        <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          {label}
        </span>
  
        {/* VALUE — the big number */}
        <span style={{ fontSize: 28, fontWeight: 700, color: color || "var(--text-primary)", lineHeight: 1.1 }}>
          {value}
        </span>
  
        {/* BOTTOM ROW — optional trend + sub text */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          {/* Trend badge — green if up, red if down */}
          {trend && (
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 4,
              background: trendUp ? "#EAF3DE" : "#FCEBEB",
              color: trendUp ? "#27500A" : "#791F1F",
            }}>
              {trendUp ? "▲" : "▼"} {trend}
            </span>
          )}
          {/* Sub text */}
          {sub && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</span>
          )}
        </div>
      </div>
    );
  }
  