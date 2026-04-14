# MachineIQ — Predictive Maintenance Dashboard

**🔗 Live demo: [machine-iq.vercel.app](https://machine-iq.vercel.app/)**

An interactive, browser-based dashboard for exploring and analysing the **AI4I 2020 Predictive Maintenance Dataset**. Built with React and Recharts, it demonstrates how sensor data from CNC milling machines can be visualised to surface failure patterns, risk signals, and operational insights.

> **For demonstration purposes only.** This project uses a publicly available research dataset and is not intended for production use.

---

## Features

| Page | Description |
|---|---|
| **Overview** | Fleet-level KPIs, alert banner for at-risk machines, failure mode breakdown, and narrative chart insights |
| **Sensor Explorer** | Time-series view of all sensor readings (RPM, torque, temperature, tool wear, power) per machine |
| **Machine Health** | Per-machine health scoring, failure rate history, and status classification (Healthy / Warning / Critical) |
| **Risk Predictor** | Pseudo-ML failure risk assessment with SHAP-style feature contribution chart and dual-mode input (analyse a machine vs. explore a scenario) |
| **Dataset Explorer** | Filterable, sortable, paginated table of all 10,000 raw records with failure type badges |
| **Data Insights** | Statistical narrative: distribution comparisons, Random Forest feature importance, Pearson correlation heatmap |

---

## Tech Stack

- **React 19** — UI framework
- **Vite 8** — development server and bundler
- **Recharts 3** — charting library (bar, stacked bar, line, scatter, pie, radar)
- **Plain CSS-in-JS** — design tokens via CSS custom properties, no external styling library

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install and run

```bash
git clone https://github.com/aditiphadnis/machineiq.git
cd machineiq
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other commands

```bash
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint
```

---

## Dataset

**AI4I 2020 Predictive Maintenance Dataset**

- 10,000 records of CNC milling machine sensor readings
- Features: air temperature, process temperature, rotational speed, torque, tool wear
- Labels: machine type (L / M / H), failure flag, and five one-hot failure modes (TWF, HDF, PWF, OSF, RNF)
- Source: [Kaggle](https://www.kaggle.com/datasets/stephanmatzka/predictive-maintenance-dataset-ai4i-2020) / UCI ML Repository

### Citation

> S. Matzka, "Explainable Artificial Intelligence for Predictive Maintenance Applications," *2020 Third International Conference on Artificial Intelligence for Industries (AI4I)*, 2020, pp. 69–74, doi: [10.1109/AI4I49448.2020.00023](https://doi.org/10.1109/AI4I49448.2020.00023).

---

## Project Structure

```
src/
├── data/
│   └── loadData.js          # CSV loader and stats computation (computeStats)
├── pages/
│   ├── Overview.jsx          # Fleet overview with KPIs and charts
│   ├── Sensors.jsx           # Sensor time-series explorer
│   ├── MachineHealth.jsx     # Per-machine health dashboard
│   ├── Predictor.jsx         # Risk predictor with SHAP-style output
│   ├── DatasetExplorer.jsx   # Filterable data table
│   └── DataInsights.jsx      # Statistical analysis page
├── components/
│   ├── AlertBanner.jsx       # At-risk machine alerts
│   ├── InfoTooltip.jsx       # Failure mode definitions popover
│   └── KpiCard.jsx           # Reusable KPI metric card
├── App.jsx                   # App shell, routing, sidebar, CSS tokens
└── main.jsx                  # React entry point

public/
└── ai4i2020_with_machines.csv   # Dataset (served statically)
```

---

## Failure Mode Reference

| Code | Name | Description |
|---|---|---|
| **TWF** | Tool Wear Failure | Tool has reached or exceeded its wear limit |
| **HDF** | Heat Dissipation Failure | Insufficient heat dissipation; process/air temperature differential too low at low RPM |
| **PWF** | Power Failure | Power output outside safe operating bounds |
| **OSF** | Overstrain Failure | Product of tool wear and torque exceeds machine-type limit |
| **RNF** | Random Failure | Stochastic failure independent of process parameters |

---

## License

This project is released for educational and demonstration purposes. The dataset is subject to the citation requirements above.
