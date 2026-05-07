import { useState } from "react";
import { Search, Play, BookOpen } from "lucide-react";
import type { CsvData } from "../types";
import { nlQuery } from "../utils/csvEngine";
import toast from "react-hot-toast";

const EXAMPLES = [
  "show rows where age > 30",
  "top 10 by salary",
  "count rows grouped by department",
  "where status is active",
  "top 5 by revenue",
];

interface QueryPageProps {
  csvData: CsvData | null;
  onDataUpdated: (data: CsvData) => void;
}

export default function QueryPage({ csvData, onDataUpdated }: QueryPageProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CsvData | null>(null);

  const run = () => {
    if (!csvData || !query.trim()) { toast.error("Enter a query"); return; }
    const res = nlQuery(csvData, query);
    if ("error" in res) { toast.error(res.error); return; }
    setResults(res);
    toast.success(`Query returned ${res.totalRows.toLocaleString()} rows`);
  };

  const apply = () => {
    if (results) { onDataUpdated(results); toast.success("Applied to data view"); }
  };

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Search size={18} className="text-brand-400" /> Natural Language Query
      </h2>

      <div className="card space-y-4">
        <div className="flex gap-3">
          <input
            className="input-field flex-1 text-sm"
            placeholder='e.g. "top 10 by salary" or "where age > 25 and city is London"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && run()}
          />
          <button className="btn-primary" onClick={run}><Play size={14} /> Run</button>
          {results && <button className="btn-secondary" onClick={apply}>Apply to Data</button>}
        </div>

        <div>
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><BookOpen size={11} /> Supported patterns:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setQuery(ex)}
                className="text-xs bg-dark-surface text-gray-400 hover:text-brand-400 border border-dark-border hover:border-brand-700 px-2 py-1 rounded font-mono transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {results && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="badge badge-green">{results.totalRows.toLocaleString()} rows returned</span>
          </div>
          <div className="card overflow-auto max-h-96">
            <table className="w-full text-left">
              <thead>
                <tr>{results.headers.map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {results.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-dark-hover">
                    {results.headers.map(h => (
                      <td key={h} className="table-cell">{row[h] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
