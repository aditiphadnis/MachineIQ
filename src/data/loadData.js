// ============================================================
// loadData.js — Loads the real AI4I 2020 dataset from CSV
// ============================================================

export async function loadDataset() {
  const response = await fetch("/ai4i2020_with_machines.csv");
  const text = await response.text();

  const lines = text.trim().split("\n");
  // Skip header row
  const records = lines.slice(1).map((line) => {
    const cols = line.split(",");
    const twf    = cols[9]  === "1";
    const hdf    = cols[10] === "1";
    const pwf    = cols[11] === "1";
    const osf    = cols[12] === "1";
    const rnf    = cols[13] === "1";
    const failed = cols[8]  === "1";

    const torque      = parseFloat(cols[6]);
    const rpm         = parseInt(cols[5], 10);
    const airTemp     = parseFloat(cols[3]);
    const processTemp = parseFloat(cols[4]);

    return {
      id:          parseInt(cols[0], 10),
      type:        cols[2].trim(),
      airTemp,
      processTemp,
      rpm,
      torque,
      wear:        parseInt(cols[7], 10),
      power:       Math.round(torque * rpm * (Math.PI / 30)),
      deltaT:      parseFloat((processTemp - airTemp).toFixed(2)),
      twf,
      hdf,
      pwf,
      osf,
      rnf,
      failed,
      failureType: twf ? "TWF" : hdf ? "HDF" : pwf ? "PWF" : osf ? "OSF" : rnf ? "RNF" : "None",
      machineId: cols[14].trim(),

    };
  });

  return records;
}

export function computeStats(data) {
  const total    = data.length;
  const failures = data.filter((d) => d.failed);
  const normals  = data.filter((d) => !d.failed);

  const failureRate = ((failures.length / total) * 100).toFixed(1);

  const byMode = [
    { code: "TWF", name: "Tool wear (TWF)",        count: data.filter((d) => d.twf).length, color: "#E24B4A" },
    { code: "HDF", name: "Heat dissipation (HDF)", count: data.filter((d) => d.hdf).length, color: "#EF9F27" },
    { code: "OSF", name: "Overstrain (OSF)",       count: data.filter((d) => d.osf).length, color: "#7F77DD" },
    { code: "PWF", name: "Power failure (PWF)",    count: data.filter((d) => d.pwf).length, color: "#D85A30" },
    { code: "RNF", name: "Random (RNF)",           count: data.filter((d) => d.rnf).length, color: "#888780" },
  ];
  byMode.sort((a, b) => b.count - a.count);

  const byType = ["L", "M", "H"].map((t) => {
    const typeData  = data.filter((d) => d.type === t);
    const typeFails = typeData.filter((d) => d.failed);
    return {
      type: t,
      total:    typeData.length,
      failures: typeFails.length,
      rate:     typeData.length ? ((typeFails.length / typeData.length) * 100).toFixed(1) : "0.0",
    };
  });

  const avg = (arr, key) =>
    arr.length ? (arr.reduce((s, d) => s + d[key], 0) / arr.length).toFixed(1) : 0;

  const sensorComparison = [
    { sensor: "Temp (air)",     normal: avg(normals, "airTemp"),     failed: avg(failures, "airTemp") },
    { sensor: "Temp (process)", normal: avg(normals, "processTemp"), failed: avg(failures, "processTemp") },
    { sensor: "Speed (rpm)",    normal: avg(normals, "rpm"),         failed: avg(failures, "rpm") },
    { sensor: "Torque (Nm)",    normal: avg(normals, "torque"),      failed: avg(failures, "torque") },
    { sensor: "Wear (min)",     normal: avg(normals, "wear"),        failed: avg(failures, "wear") },
  ];

  const wearBuckets = Array.from({ length: 10 }, (_, i) => ({
    range:  `${i * 25}–${(i + 1) * 25}`,
    normal: data.filter((d) => !d.failed && d.wear >= i * 25 && d.wear < (i + 1) * 25).length,
    failed: data.filter((d) =>  d.failed && d.wear >= i * 25 && d.wear < (i + 1) * 25).length,
  }));

  return { total, failures: failures.length, failureRate, byMode, byType, sensorComparison, wearBuckets };
}
