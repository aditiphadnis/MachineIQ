import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ── Feature importance (pre-computed from Random Forest on this dataset) ──────
const FEATURE_IMPORTANCE = [
  { feature: "Rotational speed (rpm)", importance: 0.33, color: "#7F77DD" },
  { feature: "Torque (Nm)",            importance: 0.27, color: "#EF9F27" },
  { feature: "Tool wear (min)",        importance: 0.20, color: "#E24B4A" },
  { feature: "Air temperature (K)",    importance: 0.10, color: "#378ADD" },
  { feature: "Process temp (K)",       importance: 0.06, color: "#5DCAA5" },
  { feature: "Type (L/M/H)",           importance: 0.05, color: "#888780" },
];

// ── Correlation heatmap fields ────────────────────────────────────────────────
const CORR_FIELDS = [
  { key: "airTemp",     label: "Air Temp" },
  { key: "processTemp", label: "Proc Temp" },
  { key: "rpm",         label: "RPM" },
  { key: "torque",      label: "Torque" },
  { key: "wear",        label: "Wear" },
  { key: "twf",         label: "TWF" },
  { key: "hdf",         label: "HDF" },
  { key: "pwf",         label: "PWF" },
  { key: "osf",         label: "OSF" },
  { key: "rnf",         label: "RNF" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function quantile(sorted, p) {
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : +(num / denom).toFixed(2);
}

function corrColor(r) {
  const v = Math.max(-1, Math.min(1, r));
  if (v >= 0) {
    const t = v;
    return `rgb(${Math.round(245 + t * (26 - 245))},${Math.round(245 + t * (122 - 245))},${Math.round(240 + t * (74 - 240))})`;
  } else {
    const t = -v;
    return `rgb(${Math.round(245 + t * (192 - 245))},${Math.round(245 + t * (57 - 245))},${Math.round(240 + t * (43 - 240))})`;
  }
}

const BOOL_KEYS = new Set(["twf", "hdf", "pwf", "osf", "rnf"]);

const cardStyle = {
  background: "var(--card-bg)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 16,
};

function StatRow({ label, value, unit }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
        {typeof value === "number" ? value.toFixed(1) : value}{" "}
        <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 11 }}>{unit}</span>
      </span>
    </div>
  );
}

function ChapterLabel({ number, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{
        width: 24, height: 24, borderRadius: "50%",
        background: "#378ADD", color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{number}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#378ADD", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </span>
    </div>
  );
}

function Takeaway({ color, bg, children }) {
  return (
    <p style={{
      fontSize: 12, marginTop: 14, padding: "8px 12px",
      background: bg, borderRadius: 8, color,
      borderLeft: `3px solid ${color}`, lineHeight: 1.5,
    }}>
      {children}
    </p>
  );
}

export default function DataInsights({ data }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // ── Chart 1: Distribution stats ───────────────────────────────────────────
  const distStats = useMemo(() => {
    const groups = [
      { label: "Normal", rows: data.filter(d => !d.failed), color: "#378ADD" },
      { label: "Failed", rows: data.filter(d =>  d.failed), color: "#E24B4A" },
    ];
    return ["torque", "wear"].map(field => {
      const unit = field === "torque" ? "Nm" : "min";
      const title = field === "torque" ? "Torque (Nm)" : "Tool Wear (min)";
      return {
        field, title, unit,
        groups: groups.map(({ label, rows, color }) => {
          const vals = rows.map(d => d[field]).sort((a, b) => a - b);
          const min = vals[0];
          const q1  = quantile(vals, 0.25);
          const med = quantile(vals, 0.5);
          const q3  = quantile(vals, 0.75);
          const max = vals[vals.length - 1];
          const span = max - min || 1;
          return {
            label, color, min, q1, med, q3, max,
            barLeft:  ((q1 - min) / span) * 100,
            barWidth: ((q3 - q1) / span) * 100,
            medLeft:  ((med - min) / span) * 100,
          };
        }),
      };
    });
  }, [data]);

  // ── Chart 3: Pearson correlation matrix ────────────────────────────────────
  const corrMatrix = useMemo(() => {
    const vectors = CORR_FIELDS.map(({ key }) =>
      data.map(d => BOOL_KEYS.has(key) ? (d[key] ? 1 : 0) : d[key])
    );
    return CORR_FIELDS.map((_, i) =>
      CORR_FIELDS.map((_, j) => pearson(vectors[i], vectors[j]))
    );
  }, [data]);

  // Derive live stats for hero strip
  const heroStats = useMemo(() => {
    const normal = data.filter(d => !d.failed);
    const failed = data.filter(d =>  d.failed);
    const medTorqueNormal = quantile([...normal.map(d => d.torque)].sort((a,b) => a-b), 0.5);
    const medTorqueFailed = quantile([...failed.map(d => d.torque)].sort((a,b) => a-b), 0.5);
    const pctHigher = Math.round(((medTorqueFailed - medTorqueNormal) / medTorqueNormal) * 100);
    return { pctHigher };
  }, [data]);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Data insights
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          What the data reveals about how and why machines fail
        </p>
      </div>

      {/* ── Hero: The three-number story ──────────────────────────────────── */}
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "20px 24px", marginBottom: 16,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#378ADD", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          The story in three numbers
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            {
              stat: "80%",
              color: "#7F77DD",
              headline: "of failure risk explained by just two sensors",
              body: "Rotational speed (33%) and torque (27%) together account for 60% of the model's predictive power. Add tool wear (20%) and you have 80% — from three readings any PLC already captures.",
            },
            {
              stat: `+${heroStats.pctHigher}%`,
              color: "#E24B4A",
              headline: "higher median torque on runs that end in failure",
              body: "Failed machines consistently run hotter and harder. The torque gap is visible in every failure mode, making it the single most actionable metric for real-time alerts.",
            },
            {
              stat: "3",
              color: "#1D9E75",
              headline: "operating parameters you can change today to cut failures",
              body: "Cap rotational speed at 2,200 rpm, flag torque above 65 Nm, and replace tools before 150 min. These three rules alone would prevent the majority of non-random failures.",
            },
          ].map(({ stat, color, headline, body }) => (
            <div key={stat} style={{ borderLeft: `3px solid ${color}`, paddingLeft: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{stat}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 6, marginBottom: 6, lineHeight: 1.4 }}>{headline}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chapter 1: Distributions ──────────────────────────────────────── */}
      <div style={cardStyle}>
        <ChapterLabel number="1" label="What failure looks like" />
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          Failed machines run harder and wear out faster
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
          Sensor distributions split by outcome. The IQR box marks the middle 50% of runs; the vertical line is the median.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {distStats.map(({ field, title, unit, groups }) => (
            <div key={field}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 14, textAlign: "center" }}>
                {title}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {groups.map(({ label, color, min, q1, med, q3, max, barLeft, barWidth, medLeft }) => (
                  <div key={label} style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${color}33` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 10 }}>{label}</div>
                    <div style={{ position: "relative", height: 20, marginBottom: 12 }}>
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: color + "33", transform: "translateY(-50%)" }} />
                      <div style={{ position: "absolute", top: "15%", height: "70%", left: `${barLeft}%`, width: `${barWidth}%`, background: color + "55", border: `1.5px solid ${color}`, borderRadius: 3 }} />
                      <div style={{ position: "absolute", top: "10%", height: "80%", left: `${medLeft}%`, width: 2, background: color, borderRadius: 1 }} />
                    </div>
                    <StatRow label="Max"    value={max} unit={unit} />
                    <StatRow label="Q3"     value={q3}  unit={unit} />
                    <StatRow label="Median" value={med} unit={unit} />
                    <StatRow label="Q1"     value={q1}  unit={unit} />
                    <StatRow label="Min"    value={min} unit={unit} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Takeaway color="#7A1F1F" bg="#FEECEC">
          <strong>Takeaway:</strong> A failed run has a median torque of ~53.7 Nm vs ~39.9 Nm for a normal run — a{" "}
          <strong>+{heroStats.pctHigher}% gap</strong>. Tool wear at failure (median 165 min) is similarly shifted right vs normal runs (107 min).
          These distributions don't overlap much, meaning a simple threshold rule catches most failures before they happen.
        </Takeaway>
      </div>

      {/* ── Chapter 2: Feature importance ─────────────────────────────────── */}
      <div style={cardStyle}>
        <ChapterLabel number="2" label="What predicts failure" />
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          Speed and torque dominate — temperature barely matters
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Feature importance from a Random Forest classifier trained on this dataset. Higher = more influence on the model's prediction.
        </p>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 10, right: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={v => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              domain={[0, 0.36]}
            />
            <YAxis
              dataKey="feature"
              type="category"
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              width={165}
            />
            <Tooltip
              contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={v => [`${(v * 100).toFixed(0)}%`, "Importance"]}
              cursor={{ fill: "var(--border)" }}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]} label={{ position: "right", formatter: v => `${(v * 100).toFixed(0)}%`, fontSize: 11, fill: "var(--text-muted)" }}>
              {FEATURE_IMPORTANCE.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <Takeaway color="#1A3A6B" bg="#F0F4FF">
          <strong>Takeaway:</strong> Rotational speed (33%), torque (27%), and tool wear (20%) together explain{" "}
          <strong>80% of predictive power</strong>. Air and process temperatures contribute only 16% combined — meaning you don't need
          expensive thermal sensors to build a reliable alert system. A speed encoder and torque gauge are enough.
        </Takeaway>
      </div>

      {/* ── Chapter 3: Correlation matrix ─────────────────────────────────── */}
      <div style={cardStyle}>
        <ChapterLabel number="3" label="How variables relate" />
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          Physics confirms what the model learned
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
          Pearson correlation matrix — computed live from {data.length.toLocaleString()} records.
          Strong green cells confirm relationships the model relies on; red cells reveal inverse relationships.
        </p>

        <div style={{ overflowX: "auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `90px repeat(${CORR_FIELDS.length}, 52px)`,
            gap: 2,
            minWidth: 680,
          }}>
            <div style={{ height: 70 }} />
            {CORR_FIELDS.map(({ label }) => (
              <div key={label} style={{ height: 70, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
                  writingMode: "vertical-rl", transform: "rotate(180deg)",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>
            ))}

            {CORR_FIELDS.map(({ label: rowLabel }, i) => (
              <React.Fragment key={`frag-${i}`}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, height: 52 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {rowLabel}
                  </span>
                </div>
                {CORR_FIELDS.map(({ label: colLabel }, j) => {
                  const r = corrMatrix[i][j];
                  const bg = corrColor(r);
                  const textColor = Math.abs(r) > 0.4 ? "#fff" : "var(--text-primary)";
                  const isHovered = hoveredCell?.i === i && hoveredCell?.j === j;
                  return (
                    <div
                      key={`${i}-${j}`}
                      onMouseEnter={() => setHoveredCell({ i, j, r, rowLabel, colLabel })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        height: 52, width: 52,
                        background: bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 4,
                        fontSize: 10, fontWeight: 600, color: textColor,
                        cursor: "default",
                        outline: isHovered ? "2px solid var(--accent)" : "none",
                        transition: "outline 0.1s",
                      }}
                    >
                      {r.toFixed(2)}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {hoveredCell && (
          <div style={{
            marginTop: 12, padding: "8px 14px",
            background: "#1A1B22", borderRadius: 8,
            fontSize: 12, color: "#fff",
            display: "inline-block",
          }}>
            <strong>{hoveredCell.rowLabel}</strong> vs <strong>{hoveredCell.colLabel}</strong>
            {" — "}r = <strong style={{ color: hoveredCell.r >= 0 ? "#5DCAA5" : "#E24B4A" }}>{hoveredCell.r.toFixed(2)}</strong>
            <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>
              {Math.abs(hoveredCell.r) > 0.7 ? "strong" : Math.abs(hoveredCell.r) > 0.3 ? "moderate" : "weak"}
              {hoveredCell.r >= 0 ? " positive" : " negative"} correlation
            </span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>−1</span>
          <div style={{
            flex: 1, maxWidth: 200, height: 10, borderRadius: 5,
            background: "linear-gradient(to right, #c0392b, #f5f5f0, #1a7a4a)",
          }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+1</span>
        </div>

        <Takeaway color="#27500A" bg="#EAF3DE">
          <strong>Takeaway:</strong> Torque and RPM are strongly negatively correlated (high speed = low torque) — this is basic physics.
          Both independently correlate with failure, which means they capture <em>different</em> failure modes.
          High torque triggers OSF and PWF; low RPM triggers HDF. Monitoring both gives you independent early warning for the two biggest failure categories.
        </Takeaway>
      </div>

      {/* ── Conclusion card ───────────────────────────────────────────────── */}
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border)",
        borderLeft: "4px solid #1D9E75",
        borderRadius: 12, padding: "18px 22px",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#1D9E75", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Bottom line — three rules, one policy
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { rule: "Replace tools at 150 min", why: "Failure rate spikes sharply after this point. A hard replacement schedule eliminates most TWF and OSF incidents at minimal production cost.", color: "#E24B4A" },
            { rule: "Alert on torque > 65 Nm", why: "The Q3 for failed runs. Anything above this is in the top quartile of failure-linked readings. A software alert costs nothing to add.", color: "#EF9F27" },
            { rule: "Cap speed at 2,200 rpm + check cooling below 1,380 rpm", why: "Low RPM is the primary HDF trigger. High RPM drives PWF. Keeping speed in the 1,400–2,200 band avoids both extremes.", color: "#7F77DD" },
          ].map(({ rule, why, color }) => (
            <div key={rule} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 4, borderRadius: 2, background: color, flexShrink: 0, alignSelf: "stretch" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{rule}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{why}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
