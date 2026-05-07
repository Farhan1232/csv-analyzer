# CSV Analyzer Pro

> A powerful cross-platform desktop application for analyzing, cleaning, transforming, and exporting CSV data — built with **Rust + Tauri + React + TypeScript**.

![License](https://img.shields.io/badge/license-MIT-blue)
![Rust](https://img.shields.io/badge/Rust-1.95-orange)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![React](https://img.shields.io/badge/React-18-cyan)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)

---

## Features

| Feature | Description |
|---|---|
| **Data Viewer** | Browse CSV with search & pagination |
| **Data Profiling** | Auto type detection, null%, health score |
| **Statistics** | Mean, median, IQR, skewness, std dev |
| **Filter & Sort** | 13 operators with AND/OR chaining |
| **Anomaly Detection** | Z-Score + IQR outlier detection |
| **Fuzzy Duplicates** | Levenshtein similarity matching |
| **PII Masking** | Detect & mask emails, SSNs, credit cards |
| **Formula Engine** | Computed columns (`total = price * qty`) |
| **NL Query** | Plain English queries (`top 10 by salary`) |
| **Join Files** | INNER / LEFT / RIGHT / OUTER CSV joins |
| **Diff Files** | Compare two CSVs, see exact changes |
| **Charts** | Bar, Line, Area, Pie visualizations |
| **Multi-Format Export** | CSV, JSON, SQL, HTML, Markdown |
| **Schema Generator** | SQL, JSON Schema, Rust Struct, TypeScript |

---

## Tech Stack

- **Backend:** Rust 1.95, Tauri v2
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Charts:** Recharts
- **Build:** Vite
- **CSV Parsing:** PapaParse + Rust `csv` crate
- **Fuzzy Match:** `strsim` (Levenshtein)

---

## Getting Started

### Prerequisites

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev librsvg2-dev patchelf libssl-dev libayatana-appindicator3-dev
```

**Rust:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Node.js:** v18+ required

### Install & Run

```bash
# Clone the repo
git clone https://github.com/Farhan1232/csv-analyzer.git
cd csv-analyzer

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

The installer will be in `src-tauri/target/release/bundle/`

---

## Project Structure

```
csv-analyzer/
├── src/                        # React frontend
│   ├── components/             # TitleBar, Sidebar
│   ├── pages/                  # 15 feature pages
│   ├── utils/csvEngine.ts      # Core analysis engine
│   └── types/index.ts          # TypeScript types
├── src-tauri/                  # Rust backend
│   └── src/
│       ├── commands/           # 11 Tauri command modules
│       └── models/             # Data models
└── package.json
```

---

## Screenshots

> Load any CSV file and get instant insights — data profiling, anomaly detection, PII masking, charts, and multi-format export all in one app.

---

## Use Cases

- **Data Analysts** — Profile and clean datasets without Python
- **Developers** — Generate SQL/Rust/TypeScript schemas from CSV
- **Finance Teams** — Detect anomalies and outliers in transactions
- **HR Managers** — Deduplicate employee/candidate lists
- **Marketing Teams** — Clean and segment customer data (GDPR compliant)

---

## License

MIT © [Farhan Riaz](https://github.com/Farhan1232)
