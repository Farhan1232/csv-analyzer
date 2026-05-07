import { useState } from "react";
import { GitCompare, Upload, Play } from "lucide-react";
import Papa from "papaparse";
import type { CsvData, DiffResult } from "../types";
import toast from "react-hot-toast";

function diffCsvs(a: CsvData, b: CsvData): DiffResult {
  const aKeys = new Set(a.rows.map(r => JSON.stringify(r)));
  const bKeys = new Set(b.rows.map(r => JSON.stringify(r)));
  const addedRows: number[] = [];
  const deletedRows: number[] = [];
  const modifiedCells: DiffResult["modifiedCells"] = [];

  b.rows.forEach((row, i) => { if (!aKeys.has(JSON.stringify(row))) addedRows.push(i); });
  a.rows.forEach((row, i) => { if (!bKeys.has(JSON.stringify(row))) deletedRows.push(i); });

  const minLen = Math.min(a.rows.length, b.rows.length);
  for (let i = 0; i < minLen; i++) {
    for (const col of a.headers) {
      if ((a.rows[i][col] ?? "") !== (b.rows[i][col] ?? "")) {
        modifiedCells.push({ row: i, column: col, oldValue: a.rows[i][col] ?? "", newValue: b.rows[i][col] ?? "" });
      }
    }
  }

  return { addedRows, deletedRows, modifiedCells, summary: { added: addedRows.length, deleted: deletedRows.length, modified: modifiedCells.length } };
}

export default function DiffPage({ csvData }: { csvData: CsvData | null }) {
  const [compareData, setCompareData] = useState<CsvData | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);

  const loadCompare = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        setCompareData({ headers: res.meta.fields ?? [], rows: res.data as Record<string, string>[], totalRows: (res.data as unknown[]).length, filePath: file.name, fileName: file.name, fileSize: file.size });
        toast.success(`Loaded ${file.name} for comparison`);
      },
    });
    e.target.value = "";
  };

  const runDiff = () => {
    if (!csvData || !compareData) { toast.error("Need two files to compare"); return; }
    setDiff(diffCsvs(csvData, compareData));
  };

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <GitCompare size={18} className="text-brand-400" /> Diff / Compare CSVs
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-white mb-2">Base File</p>
          {csvData ? <p className="text-gray-300 text-sm">{csvData.fileName} ({csvData.totalRows} rows)</p>
            : <p className="text-gray-500 text-sm">Load a CSV file first</p>}
        </div>
        <div className="card">
          <p className="text-sm font-medium text-white mb-2">Compare With</p>
          {compareData ? <p className="text-gray-300 text-sm">{compareData.fileName} ({compareData.totalRows} rows)</p> : (
            <label className="btn-secondary cursor-pointer inline-flex">
              <Upload size={14} /> Load CSV to Compare
              <input type="file" accept=".csv" className="hidden" onChange={loadCompare} />
            </label>
          )}
        </div>
      </div>

      <button className="btn-primary" onClick={runDiff} disabled={!csvData || !compareData}>
        <Play size={14} /> Run Diff
      </button>

      {diff && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card border-green-900/50"><p className="text-xs text-gray-500">Added Rows</p><p className="text-2xl font-bold text-green-400">{diff.summary.added}</p></div>
            <div className="stat-card border-red-900/50"><p className="text-xs text-gray-500">Deleted Rows</p><p className="text-2xl font-bold text-red-400">{diff.summary.deleted}</p></div>
            <div className="stat-card border-yellow-900/50"><p className="text-xs text-gray-500">Modified Cells</p><p className="text-2xl font-bold text-yellow-400">{diff.summary.modified}</p></div>
          </div>

          {diff.modifiedCells.length > 0 && (
            <div className="card overflow-auto">
              <p className="text-sm font-medium text-white mb-3">Modified Cells</p>
              <table className="w-full text-left">
                <thead><tr>
                  {["Row", "Column", "Old Value", "New Value"].map(h => <th key={h} className="table-header">{h}</th>)}
                </tr></thead>
                <tbody>
                  {diff.modifiedCells.slice(0, 100).map((c, i) => (
                    <tr key={i} className="hover:bg-dark-hover">
                      <td className="table-cell text-gray-500">{c.row + 1}</td>
                      <td className="table-cell text-white">{c.column}</td>
                      <td className="table-cell font-mono text-red-400 line-through text-xs">{c.oldValue}</td>
                      <td className="table-cell font-mono text-green-400 text-xs">{c.newValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
