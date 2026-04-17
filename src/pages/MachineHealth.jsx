// ============================================================
// MachineHealth.jsx — Page 4: Machine status grid
//
// WHAT THIS PAGE SHOWS: A grid of 12 "machines" each with
// a health status. This is what makes the demo feel real —
// stakeholders can immediately imagine their own factory floor.
// ============================================================

import { useMemo } from "react";

// Status badge component
function StatusBadge({ status }) {
  const config = {
    "Healthy":   { bg: "#EAF3DE", color: "#27500A", dot: "#1D9E75" },
    "Warning":   { bg: "#FAEEDA", color: "#633806", dot: "#EF9F27" },
    "Critical":  { bg: "#FCEBEB", color: "#791F1F", dot: "#E24B4A" },
    "Offline":   { bg: "#F1EFE8", color: "#444441", dot: "#888780" },
  }[status] || {};

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: config.bg, color: config.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.dot }} />
      {status}
    </span>
  );
}

// Mini metric row inside a machine card
function MiniMetric({ label, value, unit, warning }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: warning ? "#E24B4A" : "var(--text-primary)" }}>
        {value} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>{unit}</span>
      </span>
    </div>
  );
}

export default function MachineHealth({ data }) {
  // GROUP BY REAL machineId
  // How it works:
  //   reduce() walks every record and builds a Map: { machineId → [records] }
  //   Map preserves insertion order, so machines appear in the order they first
  //   appear in the CSV — no more arbitrary 833-record slices.
  const machines = useMemo(() => {
    const byMachine = data.reduce((map, record) => {
      const id = record.machineId;
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(record);
      return map;
    }, new Map());

    return Array.from(byMachine.entries()).map(([id, records]) => {
      const failures = records.filter((d) => d.failed).length;
      const failRate = failures / records.length;
      const latest = records[records.length - 1]; // most recent reading for this machine

      const status =
        latest.wear > 200     ? "Critical"
        : failRate > 0.06     ? "Critical"
        : failRate > 0.03     ? "Warning"
        : "Healthy";

      return {
        id,
        status,
        failRate: (failRate * 100).toFixed(1),
        wear: latest.wear,
        rpm: latest.rpm,
        torque: latest.torque.toFixed(1),
        power: latest.power,
        type: latest.type,
        runs: records.length,
        failures,
      };
    });
  }, [data]);

  const counts = {
    Healthy: machines.filter(m => m.status === "Healthy").length,
    Warning: machines.filter(m => m.status === "Warning").length,
    Critical: machines.filter(m => m.status === "Critical").length,
    Offline: machines.filter(m => m.status === "Offline").length,
  };

  // Group machines by product type so we can render L / M / H sections.
  // Each entry in GROUPS defines the display label and accent colour for that section.
  const STATUS_ORDER = { Critical: 0, Warning: 1, Healthy: 2, Offline: 3 };

  const GROUPS = [
    { type: "L", label: "Type L", color: "#6366F1" },
    { type: "M", label: "Type M", color: "#0891B2" },
    { type: "H", label: "Type H", color: "#B45309" },
  ];
  const byType = GROUPS.map(g => ({
    ...g,
    machines: machines
      .filter(m => m.type === g.type)
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
  }));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Machine health
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Live status of all {machines.length} milling machines on the floor
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          ["Healthy", counts.Healthy, "#1D9E75"],
          ["Warning", counts.Warning, "#EF9F27"],
          ["Critical", counts.Critical, "#E24B4A"],
          ["Offline", counts.Offline, "#888780"],
        ].map(([label, count, color]) => (
          <div key={label} style={{
            background: "var(--card-bg)", border: "1px solid var(--border)",
            borderLeft: `3px solid ${color}`,
            borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* One section per product type: L → M → H */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {byType.map(({ type, label, color, machines: group }) => (
          group.length === 0 ? null : (
            <div key={type}>
              {/* Section heading */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                paddingBottom: 10, borderBottom: `2px solid ${color}33`,
              }}>
                <span style={{
                  padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: color + "18", color,
                }}>
                  {type}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  {label}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {group.length} machine{group.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Cards grid for this type */}
              <div className="grid-3">
                {group.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderTop: `3px solid ${color}`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      opacity: m.status === "Offline" ? 0.6 : 1,
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{m.id}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {m.runs.toLocaleString()} runs
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>

                    {/* Metrics */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <MiniMetric label="Tool wear" value={m.wear} unit="min" warning={m.wear > 190} />
                      <MiniMetric label="Speed" value={m.rpm} unit="rpm" warning={m.rpm < 1380} />
                      <MiniMetric label="Torque" value={m.torque} unit="Nm" warning={parseFloat(m.torque) > 65} />
                      <MiniMetric label="Power" value={m.power} unit="W" warning={m.power < 3500 || m.power > 9000} />
                      <MiniMetric label="Failure rate" value={m.failRate} unit="%" warning={parseFloat(m.failRate) > 4} />
                    </div>

                    {/* Tool wear progress bar */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                        <span>Tool wear</span>
                        <span>{m.wear} / 240 min</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, (m.wear / 240) * 100)}%`,
                          background: m.status === "Critical" ? "#E24B4A" : m.status === "Warning" ? "#EF9F27" : "#1D9E75",
                          borderRadius: 3,
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
