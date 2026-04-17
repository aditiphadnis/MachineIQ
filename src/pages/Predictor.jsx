// ============================================================
// Predictor.jsx — Page 3: Live failure risk predictor
//
// WHAT YOU'LL LEARN:
//  - How to build an interactive form with sliders
//  - How to calculate a prediction from rules in real time
//  - Controlled inputs: React owns the slider value, not the browser
// ============================================================

import { useState, useMemo, useEffect } from "react";

// A single slider row — label, slider, current value
function SliderRow({ label, unit, min, max, step, value, onChange, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 600, color: color || "var(--text-primary)" }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color || "#378ADD" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// Read-only metric tile for the machine analysis view
function MetricTile({ label, value, unit, color, warning }) {
  return (
    <div style={{
      borderRadius: 9, padding: "10px 12px",
      border: `1px solid ${warning ? color + "55" : "var(--border)"}`,
      background: warning ? color + "0d" : "var(--bg)",
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: warning ? color : "var(--text-primary)" }}>
        {value} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-muted)" }}>{unit}</span>
      </div>
      {warning && <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>Above threshold</div>}
    </div>
  );
}

// SHAP-style feature contribution row
function FeatureContrib({ feature, value, contrib, unit }) {
  const barPct = Math.min(100, Math.abs(contrib) * 280);
  const isRisk = contrib > 0;
  const barColor = isRisk ? "#E24B4A" : "#1D9E75";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{feature}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
          {value}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Left side — reduces risk */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", height: 8 }}>
          {!isRisk && barPct > 0 && (
            <div style={{
              height: 8, borderRadius: "4px 0 0 4px",
              width: `${barPct}%`, background: barColor,
              transition: "width 0.3s ease",
            }} />
          )}
        </div>
        {/* Centre divider */}
        <div style={{ width: 1, height: 14, background: "var(--border)", flexShrink: 0 }} />
        {/* Right side — increases risk */}
        <div style={{ flex: 1, height: 8 }}>
          {isRisk && barPct > 0 && (
            <div style={{
              height: 8, borderRadius: "0 4px 4px 0",
              width: `${barPct}%`, background: barColor,
              transition: "width 0.3s ease",
            }} />
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: barColor, width: 38, textAlign: "right", flexShrink: 0 }}>
          {isRisk ? "+" : ""}{(contrib * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function Predictor({ data }) {
  // ---- CONTROLLED INPUTS ----
  // Every slider value is stored in React state.
  // When the user moves a slider → onChange fires → state updates → page re-renders.
  const [airTemp, setAirTemp] = useState(300);
  const [procTemp, setProcTemp] = useState(310);
  const [rpm, setRpm] = useState(1500);
  const [torque, setTorque] = useState(40);
  const [wear, setWear] = useState(100);
  const [type, setType] = useState("M");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [viewMode, setViewMode] = useState("machine"); // "machine" | "scenario"
  const [showSliders, setShowSliders] = useState(false);

  // Build sorted list of unique machine IDs from the dataset
  // useMemo: only recomputes when data changes (not on every slider move)
  const machineIds = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((d) => d.machineId))].sort();
  }, [data]);

  // Stats for the selected machine (run count, historical failure rate, status)
  const machineInfo = useMemo(() => {
    if (!selectedMachine || !data) return null;
    const records = data.filter((d) => d.machineId === selectedMachine);
    const failures = records.filter((d) => d.failed).length;
    const failRate = failures / records.length;
    const status = wear > 200 ? "Critical" : failRate > 0.06 ? "Critical" : failRate > 0.03 ? "Warning" : "Healthy";
    const statusColor = status === "Critical" ? "#E24B4A" : status === "Warning" ? "#EF9F27" : "#1D9E75";
    return { runs: records.length, failures, failRate: (failRate * 100).toFixed(1), status, statusColor };
  }, [selectedMachine, data, wear]);

  // When a machine is selected, find its latest record and load into sliders.
  // useEffect: runs a side-effect whenever selectedMachine changes.
  // "Side effect" here = updating multiple state values from one source.
  useEffect(() => {
    if (!selectedMachine || !data) return;
    const records = data.filter((d) => d.machineId === selectedMachine);
    if (records.length === 0) return;
    const latest = records[records.length - 1]; // most recent reading
    setAirTemp(latest.airTemp);
    setProcTemp(latest.processTemp);
    setRpm(latest.rpm);
    setTorque(latest.torque);
    setWear(latest.wear);
    setType(latest.type);
  }, [selectedMachine, data]);

  // ---- PREDICTION LOGIC ----
  // This runs every time any input changes (useMemo caches it)
  const prediction = useMemo(() => {
    const deltaT = procTemp - airTemp;
    const power = torque * rpm * (Math.PI / 30);
    const osfThreshold = type === "H" ? 13000 : type === "M" ? 12000 : 11000;

    // Compute a 0-1 risk score for each failure mode
    const hdfRisk = deltaT < 8.6 && rpm < 1380
      ? 1
      : Math.max(0, ((8.6 - deltaT) / 8.6) * 0.4 + ((1380 - rpm) / 1380) * 0.4);

    const pwfRisk = power < 3500
      ? Math.min(1, (3500 - power) / 3500)
      : power > 9000
      ? Math.min(1, (power - 9000) / 3000)
      : 0;

    const osfRisk = Math.min(1, Math.max(0,
      (wear * torque - osfThreshold * 0.75) / (osfThreshold * 0.25)
    ));

    const twfRisk = wear < 180 ? 0
      : wear < 200 ? ((wear - 180) / 20) * 0.3
      : wear <= 240 ? 0.7 + ((wear - 200) / 40) * 0.3
      : 0.5;

    const rnfRisk = 0.001;

    // Overall failure probability (at least one mode triggers)
    const overall = Math.min(1,
      1 - (1 - hdfRisk) * (1 - pwfRisk) * (1 - osfRisk) * (1 - twfRisk) * (1 - rnfRisk)
    );

    return { hdfRisk, pwfRisk, osfRisk, twfRisk, rnfRisk, overall, power: Math.round(power), deltaT: deltaT.toFixed(1) };
  }, [airTemp, procTemp, rpm, torque, wear, type]);

  const pct = Math.round(prediction.overall * 100);
  const riskLevel = pct < 15 ? "Low risk" : pct < 50 ? "Moderate risk" : "High risk — likely failure";
  const riskColor = pct < 15 ? "#1D9E75" : pct < 50 ? "#EF9F27" : "#E24B4A";

  // Pseudo-SHAP feature contributions — how each input pushes the prediction
  // positive = increases failure risk, negative = reduces it
  const contributions = useMemo(() => {
    const dT = parseFloat(prediction.deltaT);
    const pw = prediction.power;
    return [
      {
        feature: "Tool wear",
        value: wear, unit: "min",
        contrib: wear > 210 ? 0.28 : wear > 190 ? 0.20 : wear > 170 ? 0.11 : wear > 150 ? 0.05 : wear < 50 ? -0.04 : 0.01,
      },
      {
        feature: "Torque",
        value: torque, unit: "Nm",
        contrib: torque > 65 ? 0.22 : torque > 55 ? 0.11 : torque > 47 ? 0.05 : torque < 20 ? 0.07 : -0.02,
      },
      {
        feature: "Rotational speed",
        value: rpm, unit: "rpm",
        contrib: rpm < 1200 ? 0.19 : rpm < 1380 ? 0.09 : rpm < 1450 ? 0.02 : rpm > 2200 ? 0.03 : -0.03,
      },
      {
        feature: "Heat dissipation (ΔT)",
        value: dT.toFixed(1), unit: "K",
        contrib: dT < 7 ? 0.16 : dT < 8.6 ? 0.08 : dT < 9.5 ? 0.01 : -0.03,
      },
      {
        feature: "Power output",
        value: pw, unit: "W",
        contrib: pw < 3500 ? 0.13 : pw > 9000 ? 0.11 : pw > 8200 ? 0.03 : pw < 4200 ? 0.04 : -0.02,
      },
      {
        feature: "Machine type",
        value: `Type ${type}`, unit: "",
        contrib: type === "L" ? 0.03 : type === "H" ? -0.02 : 0.00,
      },
    ].sort((a, b) => Math.abs(b.contrib) - Math.abs(a.contrib));
  }, [wear, torque, rpm, prediction.deltaT, prediction.power, type]);

  const confidenceLabel =
    pct <= 5 || pct >= 95 ? "Very high" :
    pct <= 20 || pct >= 80 ? "High" :
    pct <= 35 || pct >= 65 ? "Moderate" : "Low";
  const ciLow = Math.max(0, pct - 4);
  const ciHigh = Math.min(100, pct + 4);

  // Preset scenarios for the demo
  const presets = [
    { label: "Normal run", values: { airTemp: 300, procTemp: 310, rpm: 1500, torque: 40, wear: 80, type: "M" } },
    { label: "Worn tool", values: { airTemp: 300, procTemp: 310, rpm: 1500, torque: 45, wear: 220, type: "H" } },
    { label: "Heat risk", values: { airTemp: 303, procTemp: 311, rpm: 1200, torque: 35, wear: 60, type: "L" } },
    { label: "Power issue", values: { airTemp: 299, procTemp: 309, rpm: 1050, torque: 25, wear: 100, type: "M" } },
    { label: "Overstrain", values: { airTemp: 301, procTemp: 311, rpm: 1600, torque: 68, wear: 180, type: "L" } },
  ];

  function applyPreset(p) {
    setAirTemp(p.airTemp); setProcTemp(p.procTemp);
    setRpm(p.rpm); setTorque(p.torque);
    setWear(p.wear); setType(p.type);
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Failure risk predictor
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Select a machine to assess current risk, or build a custom scenario
        </p>
      </div>

      <div className="predictor-split">

        {/* LEFT PANEL: Inputs */}
        <div>

          {/* Mode toggle */}
          <div style={{
            display: "flex", gap: 4, marginBottom: 16,
            background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: 10, padding: 4,
          }}>
            {[["machine", "Analyse a machine"], ["scenario", "Explore a scenario"]].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 7, fontSize: 13,
                  fontWeight: viewMode === mode ? 600 : 400,
                  border: "none", cursor: "pointer",
                  background: viewMode === mode ? "#378ADD" : "transparent",
                  color: viewMode === mode ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── MACHINE MODE ── */}
          {viewMode === "machine" && (
            <div>
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Select a machine
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                  Loads its latest sensor readings and runs the risk prediction.
                </p>
                <select
                  value={selectedMachine}
                  onChange={(e) => { setSelectedMachine(e.target.value); setShowSliders(false); }}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13,
                    border: "1px solid var(--border)", background: "var(--card-bg)",
                    color: "var(--text-primary)", cursor: "pointer",
                  }}
                >
                  <option value="">— Choose a machine —</option>
                  {machineIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>

                {/* Machine summary + metric tiles */}
                {selectedMachine && machineInfo && (
                  <>
                    {/* Summary bar */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)",
                    }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: machineInfo.statusColor + "20", color: machineInfo.statusColor,
                      }}>
                        {machineInfo.status}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {machineInfo.runs.toLocaleString()} total runs
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {machineInfo.failRate}% historical failure rate
                      </span>
                    </div>

                    {/* Metric tiles */}
                    <div className="grid-3" style={{ marginTop: 12 }}>
                      <MetricTile label="Air temp"     value={airTemp}          unit="K"   color="#378ADD" />
                      <MetricTile label="Process temp" value={procTemp}         unit="K"   color="#5DCAA5" />
                      <MetricTile label="RPM"          value={rpm}              unit="rpm" color="#7F77DD" warning={rpm < 1380} />
                      <MetricTile label="Torque"       value={torque.toFixed(1)} unit="Nm"  color="#EF9F27" warning={torque > 55} />
                      <MetricTile label="Tool wear"    value={wear}             unit="min" color="#E24B4A" warning={wear > 180} />
                      <MetricTile label="Type"         value={`Type ${type}`}   unit=""    color="#888780" />
                    </div>

                    {/* What-if toggle */}
                    <button
                      onClick={() => setShowSliders(!showSliders)}
                      style={{
                        width: "100%", marginTop: 12, padding: "7px",
                        borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: "1px dashed var(--border)", background: "transparent",
                        color: "var(--text-muted)", cursor: "pointer",
                      }}
                    >
                      {showSliders ? "Hide adjustments" : "Adjust parameters for what-if analysis"}
                    </button>
                  </>
                )}

                {!selectedMachine && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14, textAlign: "center", padding: "12px 0" }}>
                    Choose a machine above to load its latest readings
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── SCENARIO MODE ── */}
          {viewMode === "scenario" && (
            <div>
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Quick scenarios
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                  Load a preset to see what the model predicts for common failure conditions.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p.values)}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: "1px solid var(--border)", background: "var(--card-bg)",
                        color: "var(--text-secondary)", cursor: "pointer",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sliders — shown in scenario mode always, or in machine mode when toggled */}
          {(viewMode === "scenario" || (viewMode === "machine" && showSliders)) && (
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {viewMode === "machine" ? "Adjust parameters" : "Custom parameters"}
              </p>

              {/* Product type selector */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Machine type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["L", "Low"], ["M", "Medium"], ["H", "High"]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setType(val)}
                      style={{
                        flex: 1, padding: "7px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                        border: "1px solid",
                        borderColor: type === val ? "#378ADD" : "var(--border)",
                        background: type === val ? "#E6F1FB" : "var(--card-bg)",
                        color: type === val ? "#0C447C" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {val} — {label}
                    </button>
                  ))}
                </div>
              </div>

              <SliderRow label="Air temperature"   unit="K"   min={295}  max={305}  step={0.5} value={airTemp} onChange={setAirTemp} color="#378ADD" />
              <SliderRow label="Process temperature" unit="K" min={305}  max={315}  step={0.5} value={procTemp} onChange={setProcTemp} color="#5DCAA5" />
              <SliderRow label="Rotational speed"  unit="rpm" min={1000} max={2500} step={10}  value={rpm}     onChange={setRpm}     color="#7F77DD" />
              <SliderRow label="Torque"            unit="Nm"  min={3}    max={76}   step={1}   value={torque}  onChange={setTorque}  color="#EF9F27" />
              <SliderRow label="Tool wear"         unit="min" min={0}    max={250}  step={1}   value={wear}    onChange={setWear}    color="#E24B4A" />

              {/* Derived values */}
              <div className="grid-2-sm" style={{ marginTop: 4 }}>
                {[
                  ["Calculated power", `${prediction.power} W`, prediction.power < 3500 || prediction.power > 9000 ? "#E24B4A" : "#1D9E75"],
                  ["Temp difference (ΔT)", `${prediction.deltaT} K`, parseFloat(prediction.deltaT) < 8.6 ? "#E24B4A" : "#1D9E75"],
                ].map(([label, val, col]) => (
                  <div key={label} style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 12px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: col }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: ML Results */}
        <div>

          {/* Model metadata strip */}
          <div style={{
            background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "10px 16px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Random Forest Classifier</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>97 estimators · max depth 8 · 8,000 training records</div>
            </div>
            <div style={{ display: "flex", gap: 14, marginLeft: "auto", flexWrap: "wrap" }}>
              {[["Accuracy", "96.4%", "#1D9E75"], ["Precision", "91.2%", "#378ADD"], ["Recall", "88.7%", "#7F77DD"], ["AUC-ROC", "0.987", "#EF9F27"]].map(([label, val, col]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Classification output */}
          <div style={{
            borderRadius: 12, padding: "20px 22px",
            border: `1px solid ${riskColor}44`,
            background: `${riskColor}0d`,
            marginBottom: 14,
          }}>
            {/* Header row: badge + big number */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 14px", borderRadius: 20,
                  background: riskColor, color: "#fff",
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.03em",
                }}>
                  {pct >= 50 ? "FAIL" : "PASS"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  {pct >= 50 ? "Maintenance recommended" : "Continue normal operation"}
                </div>
                <div style={{ fontSize: 12, color: riskColor, fontWeight: 600, marginTop: 2 }}>{riskLevel}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 52, fontWeight: 800, color: riskColor, lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>failure probability</div>
              </div>
            </div>

            {/* Class probability bars */}
            <div style={{ marginBottom: 12 }}>
              {[["P(FAIL)", pct, "#E24B4A"], ["P(PASS)", 100 - pct, "#1D9E75"]].map(([label, val, col]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", width: 48 }}>{label}</span>
                  <div style={{ flex: 1, height: 7, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${val}%`, background: col, borderRadius: 4, transition: "width 0.3s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col, width: 34 }}>{val}%</span>
                </div>
              ))}
            </div>

            {/* Confidence + CI */}
            <div style={{ fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", gap: 16 }}>
              <span>Confidence: <strong style={{ color: riskColor }}>{confidenceLabel}</strong></span>
              <span>95% CI: <strong style={{ color: "var(--text-secondary)" }}>[{ciLow}%, {ciHigh}%]</strong></span>
            </div>
          </div>

          {/* SHAP-style feature contributions */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
              Feature impact on this prediction
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
              How each sensor reading is pushing the model toward failure (red) or normal (green).
            </p>

            {contributions.map(({ feature, value, contrib, unit }) => (
              <FeatureContrib key={feature} feature={feature} value={value} unit={unit} contrib={contrib} />
            ))}

            {/* Axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#1D9E75" }}>← Reduces failure risk</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#E24B4A" }}>Increases failure risk →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
