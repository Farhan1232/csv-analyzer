import { useState, useMemo } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";
import type { CsvData } from "../types";
import { detectAndMaskPii } from "../utils/csvEngine";
import toast from "react-hot-toast";
import clsx from "clsx";

interface PiiPageProps {
  csvData: CsvData | null;
  onDataUpdated: (data: CsvData) => void;
}

export default function PiiPage({ csvData, onDataUpdated }: PiiPageProps) {
  const [showValues, setShowValues] = useState(false);

  const { results } = useMemo(
    () => csvData ? detectAndMaskPii(csvData, false) : { results: [] },
    [csvData]
  );

  const applyMasking = () => {
    if (!csvData) return;
    const { maskedData } = detectAndMaskPii(csvData, true);
    if (maskedData) {
      onDataUpdated(maskedData);
      toast.success(`Masked PII in ${results.length} cells`);
    }
  };

  const piiByType = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.piiType] = (acc[r.piiType] || 0) + 1;
    return acc;
  }, {});

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield size={18} className="text-red-400" /> PII Detection & Masking
        </h2>
        <div className="flex items-center gap-3">
          <button className="btn-secondary py-1.5" onClick={() => setShowValues(v => !v)}>
            {showValues ? <EyeOff size={14} /> : <Eye size={14} />}
            {showValues ? "Hide Values" : "Show Values"}
          </button>
          {results.length > 0 && (
            <button className="btn-danger py-1.5" onClick={applyMasking}>
              <Shield size={14} /> Mask All PII
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500">PII Cells Found</p>
          <p className="text-2xl font-bold text-red-400">{results.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">Affected Columns</p>
          <p className="text-2xl font-bold text-white">{new Set(results.map(r => r.column)).size}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">PII Types</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(piiByType).map(([type, count]) => (
              <span key={type} className="badge badge-red">{type}: {count}</span>
            ))}
            {Object.keys(piiByType).length === 0 && <span className="text-green-400 text-sm font-medium">None</span>}
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-12">
          <Shield size={32} className="mx-auto mb-3 text-green-400" />
          <p className="text-white font-medium">No PII detected</p>
          <p className="text-gray-500 text-sm mt-1">Your data appears to be PII-free</p>
        </div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                {["Row", "Column", "PII Type", showValues ? "Original Value" : "Redacted", "Masked As"].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 200).map((r, i) => (
                <tr key={i} className="hover:bg-dark-hover transition-colors">
                  <td className="table-cell text-gray-500">{r.rowIndex + 1}</td>
                  <td className="table-cell text-white font-medium">{r.column}</td>
                  <td className="table-cell">
                    <span className={clsx("badge", {
                      "badge-red":    ["credit_card", "ssn"].includes(r.piiType),
                      "badge-yellow": ["email", "phone"].includes(r.piiType),
                      "badge-blue":   r.piiType === "ip_address",
                      "badge-gray":   true,
                    })}>
                      {r.piiType}
                    </span>
                  </td>
                  <td className="table-cell font-mono text-xs">
                    {showValues ? r.value : "••••••••"}
                  </td>
                  <td className="table-cell font-mono text-xs text-green-400">{r.masked}</td>
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
