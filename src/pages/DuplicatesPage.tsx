import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import type { CsvData } from "../types";
import { findFuzzyDuplicates } from "../utils/csvEngine";

export default function DuplicatesPage({ csvData }: { csvData: CsvData | null }) {
  const [threshold, setThreshold] = useState(85);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof findFuzzyDuplicates> | null>(null);

  const run = () => {
    if (!csvData) return;
    setRunning(true);
    setTimeout(() => {
      setResults(findFuzzyDuplicates(csvData, threshold / 100));
      setRunning(false);
    }, 50);
  };

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Copy size={18} className="text-brand-400" /> Fuzzy Duplicate Detection
      </h2>

      <div className="card flex items-end gap-6">
        <div>
          <label className="text-xs text-gray-400 block mb-2">Similarity threshold: <span className="text-brand-400 font-mono">{threshold}%</span></label>
          <input type="range" min={70} max={100} step={1} value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-48 accent-brand-500" />
        </div>
        <button className="btn-primary" onClick={run} disabled={running}>
          {running ? <><Loader2 size={14} className="animate-spin" /> Scanning...</> : <><Copy size={14} /> Find Duplicates</>}
        </button>
      </div>

      {results !== null && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card"><p className="text-xs text-gray-500">Fuzzy Duplicate Pairs</p><p className="text-2xl font-bold text-yellow-400">{results.length}</p></div>
            <div className="stat-card"><p className="text-xs text-gray-500">Scanned Rows</p><p className="text-2xl font-bold text-white">{Math.min(csvData.rows.length, 500)}</p></div>
          </div>

          {results.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-green-400 font-medium">No fuzzy duplicates found at {threshold}% threshold</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.slice(0, 50).map((dup, i) => (
                <div key={i} className="card border border-yellow-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">Rows #{dup.row1Index + 1} & #{dup.row2Index + 1}</span>
                    <span className="badge badge-yellow">{dup.similarity}% similar</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1">Row {dup.row1Index + 1}</p>
                      {dup.matchedColumns.map(col => (
                        <div key={col} className="flex gap-2 py-0.5">
                          <span className="text-gray-500 w-24 truncate shrink-0">{col}:</span>
                          <span className="text-white font-mono">{dup.row1Data[col]}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Row {dup.row2Index + 1}</p>
                      {dup.matchedColumns.map(col => (
                        <div key={col} className="flex gap-2 py-0.5">
                          <span className="text-gray-500 w-24 truncate shrink-0">{col}:</span>
                          <span className="text-white font-mono">{dup.row2Data[col]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
