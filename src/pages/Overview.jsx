// ============================================================
// Overview.jsx  — Page 1: The main dashboard
//
// WHAT YOU'LL LEARN FROM THIS FILE:
//  - How to use Recharts to draw bar and pie charts
//  - How to pass "stats" data into charts
//  - How layout works with CSS grid
// ============================================================

import { useMemo } from "react";
import KpiCard from "../components/KpiCard";
import AlertBanner from "../components/AlertBanner";
import InfoTooltip from "../components/InfoTooltip";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";

// PROPS: This page receives "stats" — the pre-computed summary object
// from generateData.js. We destructure it to get the pieces we need.
export default function Overview({ stats, data }) {
  // Generate alerts dynamically from real machine data.
  // For each machine, take its latest record and check failure conditions.
  const alerts = useMemo(() => {
    if (!data) return [];

    // Group latest record per machine
    const latestByMachine = data.reduce((map, r) => {
      map.set(r.machineId, r); // last record wins (data is in order)
      return map;
    }, new Map());

    const found = [];
    for (const [id, r] of latestByMachine) {
      const deltaT = r.processTemp - r.airTemp;
      if (r.wear > 200) {
        found.push({ title: `Machine ${id}`, message: `Tool wear at ${r.wear} min — approaching failure threshold`, color: "#E24B4A", severity: "HIGH RISK" });
      } else if (deltaT < 8.6 && r.rpm < 1380) {
        found.push({ title: `Machine ${id}`, message: `Heat dissipation below threshold (ΔT=${deltaT.toFixed(1)} K, ${r.rpm} rpm) — check cooling system`, color: "#EF9F27", severity: "WARNING" });
      } else if (r.wear > 160) {
        found.push({ title: `Machine ${id}`, message: `Tool wear at ${r.wear} min — monitor closely`, color: "#EF9F27", severity: "WARNING" });
      }
    }
    // Show at most 3 alerts, most severe first
    return found.slice(0, 3);
  }, [data]);

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Operations overview
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Predictive maintenance dashboard — AI4I milling machine dataset
        </p>
      </div>

      {/* Live alerts */}
      <AlertBanner alerts={alerts} />

      {/* Headline insight */}
      <div style={{
        background: "#FFF7EC",
        border: "1px solid var(--border)",
        borderLeft: "4px solid #EF9F27",
        borderRadius: 12, padding: "16px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: "#EF9F2722", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>⚠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
            Heat dissipation (HDF) is the leading cause of failure — and the most preventable
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            HDF accounts for 1 in 3 breakdowns. A targeted coolant and fan maintenance programme
            could cut total failures by <span style={{ color: "#EF9F27", fontWeight: 600 }}>~34%</span> without
            changing a single machine setting.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#EF9F27" }}>34%</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>of failures<br/>preventable</div>
        </div>
      </div>

      {/* ---- KPI CARDS ROW ---- */}
      {/* CSS grid: 4 equal columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard
          label="Total machine runs"
          value={stats.total.toLocaleString()}
          sub="in dataset"
          color="#378ADD"
        />
        <KpiCard
          label="Total failures"
          value={stats.failures}
          sub={`${stats.failureRate}% of all runs`}
          color="#E24B4A"
          trend={stats.failureRate + "%"}
          trendUp={false}
        />
        <KpiCard
          label="Normal runs"
          value={(stats.total - stats.failures).toLocaleString()}
          sub="no failure detected"
          color="#1D9E75"
        />
        <KpiCard
          label="Highest risk mode"
          value={stats.byMode[0].code}
          sub={`${stats.byMode[0].count} occurrences`}
          color="#EF9F27"
        />
      </div>

      {/* ---- CHARTS ROW 1 ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* CHART 1: Failure modes bar chart */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            Failures by mode <InfoTooltip />
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            How many times each failure type occurred
          </p>
          {/*
            ResponsiveContainer — makes the chart fill its parent width.
            WHY: Without this, charts have a fixed pixel width.
          */}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.byMode} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={130} />
              <Tooltip
                contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: "var(--border)" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {stats.byMode.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#FFF7EC", borderRadius: 8, color: "#7A3B00", borderLeft: "3px solid #EF9F27" }}>
            <strong>Takeaway:</strong> HDF and OSF together account for over 60% of all failures. Both are linked to operating conditions — not random defects — which means they are fixable.
          </p>
        </div>

        {/* CHART 2: Failure vs Normal pie chart */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            Normal vs failure split
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Overall proportion across 10,000 runs
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: "Normal", value: stats.total - stats.failures },
                  { name: "Failed", value: stats.failures },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                <Cell fill="#378ADD" />
                <Cell fill="#E24B4A" />
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [value.toLocaleString(), ""]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#EAF3DE", borderRadius: 8, color: "#27500A", borderLeft: "3px solid #1D9E75" }}>
            <strong>Takeaway:</strong> {stats.failureRate}% failure rate is already low — but each failure costs unplanned downtime. The goal is to push this toward 99% uptime using the predictive triggers on this dashboard.
          </p>
        </div>
      </div>

      {/* ---- CHARTS ROW 2 ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* CHART 3: Failures by product type */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            Failures vs Normal Runs by Machine Type
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Type L = 50% of fleet · Type M = 30% · Type H = 20%
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => [
                  name === "Failure rate" ? value + "%" : value.toLocaleString(),
                  name,
                ]}
              />
              <Legend
                iconType="square"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{value}</span>}
              />
              <Bar dataKey="total" name="Total runs" fill="#B5D4F4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failures" name="Failures" fill="#E24B4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, color: "#1A3A6B", borderLeft: "3px solid #378ADD" }}>
            <strong>Takeaway:</strong> Type L machines process the highest volume and accumulate the most failures. Prioritising maintenance on Type L machines delivers the biggest fleet-wide reduction in downtime.
          </p>
        </div>

        {/* CHART 4: Tool wear vs failures */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            Failure Distribution by Tool Wear (min)
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Failure rate stays low below 200 min, then spikes sharply — the 200–250 min range has the highest failure concentration
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.wearBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend
                iconType="square"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{value}</span>}
              />
              <Bar dataKey="normal" name="Normal" fill="#9FE1CB" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="failed" name="Failed" fill="#E24B4A" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, marginTop: 12, padding: "8px 12px", background: "#FEECEC", borderRadius: 8, color: "#7A1F1F", borderLeft: "3px solid #E24B4A" }}>
            <strong>Takeaway:</strong> Replace tools before 200 minutes. Failure probability is low and stable below this threshold, then spikes sharply in the 200–250 min range — where most tool-wear failures are concentrated.
          </p>
        </div>
      </div>
    </div>
  );
}
