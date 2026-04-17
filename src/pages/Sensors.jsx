// ============================================================
// Sensors.jsx — Page 2: Sensor data explorer
//
// WHAT YOU'LL LEARN:
//  - useState: how to track what the user selected
//  - Filtering data based on user input
//  - ScatterChart: plotting two values against each other
// ============================================================

import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

export default function Sensors({ data }) {
  // ---- useState ----
  // useState stores a value that, when changed, causes the page to re-render.
  // Here we track which product type the user has selected.
  // "filter" is the current value. "setFilter" is how we change it.
  const [filter, setFilter] = useState("All");

  // Filter the dataset based on what the user picked
  // useMemo: only recomputes when data or filter changes (performance)
  const filtered = useMemo(() => {
    if (filter === "All") return data;
    return data.filter((d) => d.type === filter);
  }, [data, filter]);

  // Sample down to 500 points for the scatter chart (10k dots is too slow)
  const scatterSample = useMemo(() => {
    const step = Math.floor(filtered.length / 500);
    return filtered.filter((_, i) => i % step === 0).slice(0, 500);
  }, [filtered]);

  // Build histogram for air temperature
  const tempHistogram = useMemo(() => {
    const bins = Array.from({ length: 20 }, (_, i) => ({
      temp: (295 + i * 0.5).toFixed(1),
      normal: 0,
      failed: 0,
    }));
    filtered.forEach((d) => {
      const idx = Math.min(19, Math.floor((d.airTemp - 295) / 0.5));
      if (idx >= 0) {
        if (d.failed) bins[idx].failed++;
        else bins[idx].normal++;
      }
    });
    return bins;
  }, [filtered]);

  // Build histogram for torque
  const torqueHistogram = useMemo(() => {
    const bins = Array.from({ length: 16 }, (_, i) => ({
      torque: (i * 5).toString(),
      normal: 0,
      failed: 0,
    }));
    filtered.forEach((d) => {
      const idx = Math.min(15, Math.floor(d.torque / 5));
      if (idx >= 0) {
        if (d.failed) bins[idx].failed++;
        else bins[idx].normal++;
      }
    });
    return bins;
  }, [filtered]);

  const filterBtns = ["All", "L", "M", "H"];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Sensor explorer
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Explore how sensor readings differ between normal and failed runs
        </p>
      </div>

      {/* FILTER BUTTONS — lets user pick a product type */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>Filter by product type:</span>
        {filterBtns.map((btn) => (
          <button
            key={btn}
            onClick={() => setFilter(btn)}  // When clicked, update the filter state
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              // Highlight the active button
              borderColor: filter === btn ? "#378ADD" : "var(--border)",
              background: filter === btn ? "#E6F1FB" : "var(--card-bg)",
              color: filter === btn ? "#0C447C" : "var(--text-secondary)",
            }}
          >
            {btn === "All" ? "All types" : btn === "L" ? "Low (L)" : btn === "M" ? "Medium (M)" : "High (H)"}
          </button>
        ))}
        {/* Show how many records are currently showing */}
        <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center", marginLeft: 8 }}>
          Showing {filtered.length.toLocaleString()} records
        </span>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid-2" style={{ marginBottom: 16 }}>

        {/* Air temperature distribution */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            Temperature is not a warning sign
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Failures (red) are spread evenly across all temperature levels — a hot factory floor is not the problem.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tempHistogram} stackOffset="none">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="temp" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="normal" name="Normal" stackId="a" fill="#85B7EB" />
              <Bar dataKey="failed" name="Failed" stackId="a" fill="#E24B4A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, color: "#1A3A6B", borderLeft: "3px solid #378ADD" }}>
            <strong>Takeaway:</strong> Don't invest in temperature controls to prevent failures — the data shows no link.
          </p>
        </div>

        {/* Torque distribution */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            Machines working harder than usual are more likely to fail
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Failed runs work 27% harder on average (50.2 vs 39.6 Nm). The red bars shift noticeably to the right.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={torqueHistogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="torque" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="normal" name="Normal" stackId="a" fill="#EF9F27" opacity={0.5} />
              <Bar dataKey="failed" name="Failed" stackId="a" fill="#E24B4A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#FFF7EC", borderRadius: 8, color: "#7A3B00", borderLeft: "3px solid #EF9F27" }}>
            <strong>Takeaway:</strong> Flag any machine consistently running above 50 Nm for immediate inspection.
          </p>
        </div>
      </div>

      {/* SCATTER PLOT: Tool wear vs Torque */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          When a worn tool is pushed hard, failure is almost certain
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Each dot is one production run. Red dots are failures. Notice how they cluster in the top-right — that is where tools are both old and under heavy load at the same time.
        </p>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          {[["Normal run", "#85B7EB"], ["Failed run", "#E24B4A"]].map(([label, color]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="wear"
              name="Tool wear"
              unit=" min"
              domain={[0, 'auto']}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              label={{ value: "Tool wear (min)", position: "insideBottom", offset: -5, fontSize: 12, fill: "var(--text-muted)" }}
            />
            <YAxis
              dataKey="torque"
              name="Torque"
              unit=" Nm"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              label={{ value: "Torque (Nm)", angle: -90, position: "insideLeft", fontSize: 12, fill: "var(--text-muted)" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => [typeof value === "number" ? value.toFixed(1) : value, name]}
            />
            {/* Normal runs — blue, semi-transparent */}
            <Scatter
              name="Normal"
              data={scatterSample.filter((d) => !d.failed)}
              fill="#378ADD"
              opacity={0.25}
              r={2}
            />
            {/* Failed runs — red, on top */}
            <Scatter
              name="Failed"
              data={scatterSample.filter((d) => d.failed)}
              fill="#E24B4A"
              opacity={0.8}
              r={4}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#FEECEC", borderRadius: 8, color: "#7A1F1F", borderLeft: "3px solid #E24B4A" }}>
          <strong>Takeaway:</strong> Replace tools before 200 minutes of use — never let a worn tool run a high-load job.
        </p>
      </div>
    </div>
  );
}
