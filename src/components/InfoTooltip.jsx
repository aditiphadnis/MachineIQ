import { useState, useRef, useEffect } from "react";

const FAILURE_MODES = [
  {
    code: "None",
    name: "No Failure",
    color: "#1D9E75",
    desc: "All sensor readings are within safe operating ranges. The run completed normally with no failure mode triggered.",
  },
  {
    code: "TWF",
    name: "Tool Wear Failure",
    color: "#E24B4A",
    desc: "Triggered when tool wear is between 200–240 min and a probabilistic threshold is crossed. High-quality (H) tools wear faster.",
  },
  {
    code: "HDF",
    name: "Heat Dissipation Failure",
    color: "#EF9F27",
    desc: "Occurs when the temperature difference between process and air is below 8.6 K and rotational speed is under 1,380 rpm — the machine can't shed heat fast enough.",
  },
  {
    code: "PWF",
    name: "Power Failure",
    color: "#D85A30",
    desc: "Triggered when power (torque × rotational speed) falls outside the safe operating range of 3,500–9,000 W.",
  },
  {
    code: "OSF",
    name: "Overstrain Failure",
    color: "#7F77DD",
    desc: "Occurs when tool wear × torque exceeds a product-type threshold (H: 13,000 · M: 12,000 · L: 11,000). A worn tool under high torque snaps.",
  },
  {
    code: "RNF",
    name: "Random Failure",
    color: "#888780",
    desc: "A 0.1% random failure chance per run, independent of all sensor readings. Models unpredictable real-world events.",
  },
];

export default function InfoTooltip() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  function handleMouseEnter() {
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        style={{
          width: 16, height: 16, borderRadius: "50%",
          background: "var(--border)", border: "none",
          cursor: "pointer", fontSize: 10, fontWeight: 700,
          color: "var(--text-muted)", lineHeight: 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, verticalAlign: "middle",
        }}
        aria-label="Failure mode definitions"
      >
        i
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: 320,
            background: "#1A1B22",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{
            position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
            width: 10, height: 10, background: "#1A1B22",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRight: "none", borderBottom: "none",
            rotate: "45deg",
          }} />

          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Failure Mode Definitions
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAILURE_MODES.map(({ code, name, color, desc }) => (
              <div key={code} style={{ display: "flex", gap: 10 }}>
                <span style={{
                  flexShrink: 0, marginTop: 1,
                  padding: "1px 6px", borderRadius: 4,
                  fontSize: 10, fontWeight: 700,
                  background: color + "30", color,
                }}>
                  {code}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
