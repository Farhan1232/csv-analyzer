import { useMemo } from "react";
import { Activity, AlertCircle, Shield, CheckCircle } from "lucide-react";
import type { CsvData } from "../types";
import { profileData } from "../utils/csvEngine";
import clsx from "clsx";

const TYPE_COLORS: Record<string, string> = {
  integer: "badge-blue", float: "badge-blue", boolean: "badge-purple",
  date: "badge-green", datetime: "badge-green", email: "badge-yellow",
  phone: "badge-yellow", url: "badge-gray", ip_address: "badge-red",
  credit_card: "badge-red", ssn: "badge-red", text: "badge-gray", empty: "badge-gray",
};

export default function ProfilePage({ csvData }: { csvData: CsvData | null }) {
  const profile = useMemo(() => csvData ? profileData(csvData) : null, [csvData]);

  if (!csvData || !profile) return <EmptyState />;

  const scoreColor = profile.healthScore >= 80 ? "text-green-400" : profile.healthScore >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={18} className="text-brand-400" /> Data Profile
        </h2>
        <p className="text-xs text-gray-500">Generated: {new Date(profile.generatedAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card col-span-1">
          <p className="text-xs text-gray-500">Health Score</p>
          <p className={clsx("text-3xl font-bold", scoreColor)}>{profile.healthScore}</p>
          <p className="text-xs text-gray-600">/ 100</p>
        </div>
        {[
          { label: "Total Rows", value: profile.totalRows.toLocaleString() },
          { label: "Columns", value: profile.totalColumns },
          { label: "Null Values", value: profile.totalNulls.toLocaleString() },
          { label: "Duplicate Rows", value: profile.duplicateRows.toLocaleString() },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Column Analysis</h3>
        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                {["Column", "Type", "Null %", "Unique %", "Min", "Max", "Mean", "Sample Values", "Flags"].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profile.columns.map(col => (
                <tr key={col.name} className="hover:bg-dark-hover transition-colors">
                  <td className="table-cell font-semibold text-white">{col.name}</td>
                  <td className="table-cell">
                    <span className={clsx("badge", TYPE_COLORS[col.dataType] ?? "badge-gray")}>
                      {col.dataType}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${col.nullPercent}%` }} />
                      </div>
                      <span className={col.nullPercent > 20 ? "text-red-400" : "text-gray-400"}>
                        {col.nullPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${col.uniquePercent}%` }} />
                      </div>
                      <span className="text-gray-400">{col.uniquePercent}%</span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-400">{col.min ?? "—"}</td>
                  <td className="table-cell text-gray-400">{col.max ?? "—"}</td>
                  <td className="table-cell text-gray-400">{col.mean?.toFixed(2) ?? "—"}</td>
                  <td className="table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {col.sampleValues.slice(0, 2).map((v, i) => (
                        <span key={i} className="bg-dark-surface text-gray-400 text-xs px-1.5 py-0.5 rounded font-mono max-w-[80px] truncate">
                          {v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {col.hasPii && (
                        <span className="badge badge-red" title={`PII: ${col.piiType}`}>
                          <Shield size={9} className="mr-1" /> PII
                        </span>
                      )}
                      {col.hasAnomaly && (
                        <span className="badge badge-yellow" title="Anomalies detected">
                          <AlertCircle size={9} className="mr-1" /> Outlier
                        </span>
                      )}
                      {!col.hasPii && !col.hasAnomaly && col.nullPercent === 0 && (
                        <span className="badge badge-green">
                          <CheckCircle size={9} className="mr-1" /> OK
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">Load a CSV file to see the data profile</p>
    </div>
  );
}
