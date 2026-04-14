import { useState, useMemo } from "react";
import InfoTooltip from "../components/InfoTooltip";

const COLUMNS = [
  { key: "id",          label: "ID",            fmt: (v) => v },
  { key: "machineId",   label: "Machine",       fmt: (v) => v },
  { key: "type",        label: "Type",          fmt: (v) => v },
  { key: "airTemp",     label: "Air Temp (K)",  fmt: (v) => v.toFixed(1) },
  { key: "processTemp", label: "Proc Temp (K)", fmt: (v) => v.toFixed(1) },
  { key: "rpm",         label: "RPM",           fmt: (v) => v },
  { key: "torque",      label: "Torque (Nm)",   fmt: (v) => v.toFixed(1) },
  { key: "wear",        label: "Wear (min)",    fmt: (v) => v },
  { key: "power",       label: "Power (W)",     fmt: (v) => v },
  { key: "failureType", label: "Failure", fmt: (v) => v, info: true },
];

const PAGE_SIZE = 50;

const FAILURE_COLORS = {
  TWF: { bg: "#FEE2E2", text: "#B91C1C" },
  HDF: { bg: "#FEF3C7", text: "#92400E" },
  PWF: { bg: "#EDE9FE", text: "#5B21B6" },
  OSF: { bg: "#FFE4E6", text: "#9F1239" },
  RNF: { bg: "#FEE2E2", text: "#7F1D1D" },
  None: { bg: "#DCFCE7", text: "#166534" },
};

export default function DatasetExplorer({ data }) {
  const [typeFilter, setTypeFilter]         = useState("All");
  const [failureFilter, setFailureFilter]   = useState("All");
  const [machineFilter, setMachineFilter]   = useState("All");
  const [search, setSearch]                 = useState("");
  const [sortKey, setSortKey]               = useState("id");
  const [sortAsc, setSortAsc]               = useState(true);
  const [page, setPage]                     = useState(1);

  // Sorted list of unique machine IDs for the dropdown
  const machineIds = useMemo(
    () => ["All", ...[...new Set(data.map((d) => d.machineId))].sort()],
    [data]
  );

  const filtered = useMemo(() => {
    let rows = data;
    if (machineFilter !== "All") rows = rows.filter((d) => d.machineId === machineFilter);
    if (typeFilter !== "All")    rows = rows.filter((d) => d.type === typeFilter);
    if (failureFilter !== "All") rows = rows.filter((d) => (d.failureType ?? "None") === failureFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((d) =>
        String(d.id).includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.machineId.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, machineFilter, typeFilter, failureFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number") return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  }

  function handleFilter(setter) {
    return (val) => { setter(val); setPage(1); };
  }

  const btnStyle = (active) => ({
    padding: "5px 14px",
    borderRadius: 7,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    borderColor: active ? "#378ADD" : "var(--border)",
    background: active ? "#E6F1FB" : "var(--card-bg)",
    color: active ? "#0C447C" : "var(--text-secondary)",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Dataset explorer
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Browse all {data.length.toLocaleString()} raw records from the AI4I 2020 dataset
        </p>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, alignItems: "center" }}>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by ID or type…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)",
            fontSize: 13, background: "var(--card-bg)", color: "var(--text-primary)",
            outline: "none", width: 200,
          }}
        />

        {/* Machine filter */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Machine:</span>
          <select
            value={machineFilter}
            onChange={(e) => handleFilter(setMachineFilter)(e.target.value)}
            style={{
              padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)",
              fontSize: 12, background: "var(--card-bg)", color: "var(--text-primary)", cursor: "pointer",
            }}
          >
            {machineIds.map((id) => (
              <option key={id} value={id}>{id === "All" ? "All machines" : id}</option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Type:</span>
          {["All", "L", "M", "H"].map((t) => (
            <button key={t} style={btnStyle(typeFilter === t)} onClick={() => handleFilter(setTypeFilter)(t)}>
              {t === "All" ? "All" : t === "L" ? "Low" : t === "M" ? "Med" : "High"}
            </button>
          ))}
        </div>

        {/* Failure type filter */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Failure:</span>
          {["All", "None", "TWF", "HDF", "OSF", "PWF", "RNF"].map((f) => (
            <button key={f} style={btnStyle(failureFilter === f)} onClick={() => handleFilter(setFailureFilter)(f)}>
              {f}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          {filtered.length.toLocaleString()} records
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAF8" }}>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: sortKey === col.key ? "#378ADD" : "var(--text-secondary)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {col.label} {sortKey === col.key ? (sortAsc ? "↑" : "↓") : ""}
                      {col.info && <InfoTooltip />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                    No records match the current filters.
                  </td>
                </tr>
              ) : pageRows.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: i % 2 === 0 ? "var(--card-bg)" : "#FAFAF8",
                  }}
                >
                  {COLUMNS.map((col) => {
                    const val = row[col.key];
                    if (col.key === "failureType") {
                      const c = FAILURE_COLORS[val] || FAILURE_COLORS["None"];
                      return (
                        <td key={col.key} style={{ padding: "8px 14px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 5, fontSize: 11,
                            fontWeight: 600, background: c.bg, color: c.text,
                          }}>
                            {val}
                          </span>
                        </td>
                      );
                    }
                    if (col.key === "type") {
                      const colors = { L: "#6366F1", M: "#0891B2", H: "#059669" };
                      return (
                        <td key={col.key} style={{ padding: "8px 14px" }}>
                          <span style={{ fontWeight: 600, color: colors[val] || "var(--text-primary)" }}>{val}</span>
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} style={{ padding: "8px 14px", color: "var(--text-primary)" }}>
                        {col.fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderTop: "1px solid var(--border)", background: "#FAFAF8",
        }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Page {currentPage} of {totalPages} &nbsp;·&nbsp; rows {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString()}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btnStyle(false)} disabled={currentPage === 1} onClick={() => setPage(1)}>«</button>
            <button style={btnStyle(false)} disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
            <button style={btnStyle(false)} disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            <button style={btnStyle(false)} disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
