import { useState, useMemo } from "react";
import { BarChart2 } from "lucide-react";
import type { CsvData, StatsResult } from "../types";
import { computeStats } from "../utils/csvEngine";

export default function StatsPage({ csvData }: { csvData: CsvData | null }) {
  const [selectedCol, setSelectedCol] = useState<string>("");

  const numericCols = useMemo(() => {
    if (!csvData) return [];
    return csvData.headers.filter(h => {
      const vals = csvData.rows.slice(0, 50).map(r => r[h]);
      return vals.filter(v => !isNaN(Number(v)) && v !== "").length > vals.length * 0.5;
    });
  }, [csvData]);

  const stats: StatsResult | null = useMemo(() => {
    if (!csvData || !selectedCol) return null;
    return computeStats(csvData, selectedCol);
  }, [csvData, selectedCol]);

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart2 size={18} className="text-brand-400" /> Statistics
        </h2>
      </div>

      <div className="card max-w-xs">
        <label className="text-xs text-gray-400 block mb-2">Select numeric column</label>
        <select className="select-field w-full" value={selectedCol} onChange={e => setSelectedCol(e.target.value)}>
          <option value="">-- Choose column --</option>
          {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {numericCols.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">No numeric columns detected</p>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 animate-slide-up">
          {[
            { label: "Count",     value: stats.count?.toLocaleString() },
            { label: "Sum",       value: stats.sum?.toLocaleString() },
            { label: "Mean",      value: stats.mean?.toFixed(4) },
            { label: "Median",    value: stats.median?.toFixed(4) },
            { label: "Mode",      value: stats.mode },
            { label: "Min",       value: stats.min?.toLocaleString() },
            { label: "Max",       value: stats.max?.toLocaleString() },
            { label: "Range",     value: stats.range?.toFixed(4) },
            { label: "Std Dev",   value: stats.stdDev?.toFixed(4) },
            { label: "Variance",  value: stats.variance?.toFixed(4) },
            { label: "Q1",        value: stats.q1?.toFixed(4) },
            { label: "Q3",        value: stats.q3?.toFixed(4) },
            { label: "IQR",       value: stats.iqr?.toFixed(4) },
            { label: "Skewness",  value: stats.skewness?.toFixed(4) },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-white font-mono">{s.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {!selectedCol && (
        <div className="text-center py-12 text-gray-500">
          Select a numeric column to see full statistics
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
