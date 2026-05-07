import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { CsvData } from "../types";
import { detectAnomalies } from "../utils/csvEngine";
import clsx from "clsx";

export default function AnomalyPage({ csvData }: { csvData: CsvData | null }) {
  const [threshold, setThreshold] = useState(3);

  const anomalies = useMemo(
    () => csvData ? detectAnomalies(csvData, threshold) : [],
    [csvData, threshold]
  );

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle size={18} className="text-yellow-400" /> Anomaly Detection
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400">Z-score threshold:</label>
          <input type="range" min={2} max={5} step={0.5} value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-24 accent-brand-500" />
          <span className="text-sm text-brand-400 font-mono w-8">{threshold}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500">Total Anomalies</p>
          <p className="text-2xl font-bold text-yellow-400">{anomalies.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">High Severity</p>
          <p className="text-2xl font-bold text-red-400">{anomalies.filter(a => a.severity === "high").length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">Affected Columns</p>
          <p className="text-2xl font-bold text-white">{new Set(anomalies.map(a => a.column)).size}</p>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle size={32} className="mx-auto mb-3 text-green-400" />
          <p className="text-white font-medium">No anomalies detected</p>
          <p className="text-gray-500 text-sm mt-1">Try lowering the threshold to find more outliers</p>
        </div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                {["Row", "Column", "Value", "Z-Score", "Method", "Severity"].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anomalies.slice(0, 200).map((a, i) => (
                <tr key={i} className="hover:bg-dark-hover transition-colors">
                  <td className="table-cell text-gray-500">{a.rowIndex + 1}</td>
                  <td className="table-cell text-white font-medium">{a.column}</td>
                  <td className="table-cell font-mono">{a.value}</td>
                  <td className="table-cell font-mono text-yellow-400">{a.score}</td>
                  <td className="table-cell">
                    <span className="badge badge-blue">{a.method}</span>
                  </td>
                  <td className="table-cell">
                    <span className={clsx("badge", {
                      "badge-red": a.severity === "high",
                      "badge-yellow": a.severity === "medium",
                      "badge-gray": a.severity === "low",
                    })}>
                      {a.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
