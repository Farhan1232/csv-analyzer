import { useState } from "react";
import { Merge, Upload, Play } from "lucide-react";
import Papa from "papaparse";
import type { CsvData } from "../types";
import toast from "react-hot-toast";

interface JoinPageProps {
  csvData: CsvData | null;
  onDataLoaded: (data: CsvData) => void;
}

type JoinType = "inner" | "left" | "right" | "outer";

function joinDatasets(left: CsvData, right: CsvData, onCol: string, joinType: JoinType): CsvData {
  const rightHeaders = right.headers.filter(h => h !== onCol);
  const headers = [...left.headers, ...rightHeaders.map(h => `${h}_right`)];
  const rightMap = new Map<string, Record<string, string>>();
  for (const row of right.rows) rightMap.set(row[onCol] ?? "", row);
  const emptyRight = Object.fromEntries(rightHeaders.map(h => [`${h}_right`, ""]));

  const rows: Record<string, string>[] = [];
  const usedRight = new Set<string>();

  for (const lRow of left.rows) {
    const key = lRow[onCol] ?? "";
    const rRow = rightMap.get(key);
    if (rRow) {
      usedRight.add(key);
      rows.push({ ...lRow, ...Object.fromEntries(rightHeaders.map(h => [`${h}_right`, rRow[h] ?? ""])) });
    } else if (joinType === "left" || joinType === "outer") {
      rows.push({ ...lRow, ...emptyRight });
    }
  }

  if (joinType === "right" || joinType === "outer") {
    for (const rRow of right.rows) {
      const key = rRow[onCol] ?? "";
      if (!usedRight.has(key)) {
        const emptyLeft = Object.fromEntries(left.headers.map(h => [h, ""]));
        rows.push({ ...emptyLeft, [onCol]: key, ...Object.fromEntries(rightHeaders.map(h => [`${h}_right`, rRow[h] ?? ""])) });
      }
    }
  }

  return { headers, rows, totalRows: rows.length, filePath: "joined.csv", fileName: "joined.csv", fileSize: 0 };
}

export default function JoinPage({ csvData, onDataLoaded }: JoinPageProps) {
  const [rightData, setRightData] = useState<CsvData | null>(null);
  const [joinCol, setJoinCol] = useState("");
  const [joinType, setJoinType] = useState<JoinType>("inner");

  const loadRight = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        setRightData({ headers: res.meta.fields ?? [], rows: res.data as Record<string, string>[], totalRows: (res.data as unknown[]).length, filePath: file.name, fileName: file.name, fileSize: file.size });
        toast.success(`Loaded ${file.name}`);
      },
    });
    e.target.value = "";
  };

  const doJoin = () => {
    if (!csvData || !rightData || !joinCol) { toast.error("Select both files and a join column"); return; }
    const result = joinDatasets(csvData, rightData, joinCol, joinType);
    onDataLoaded(result);
    toast.success(`Join complete: ${result.totalRows.toLocaleString()} rows`);
  };

  const commonCols = csvData && rightData
    ? csvData.headers.filter(h => rightData.headers.includes(h))
    : [];

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Merge size={18} className="text-brand-400" /> Join CSV Files
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-white mb-2">Left File (current)</p>
          {csvData ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-gray-300 text-sm">{csvData.fileName} <span className="text-gray-500">({csvData.totalRows} rows)</span></p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No file loaded</p>
          )}
        </div>
        <div className="card">
          <p className="text-sm font-medium text-white mb-2">Right File</p>
          {rightData ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-gray-300 text-sm">{rightData.fileName} <span className="text-gray-500">({rightData.totalRows} rows)</span></p>
            </div>
          ) : (
            <label className="btn-secondary cursor-pointer">
              <Upload size={14} /> Load Right CSV
              <input type="file" accept=".csv" className="hidden" onChange={loadRight} />
            </label>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-2">Join On Column</label>
            <select className="select-field w-full" value={joinCol} onChange={e => setJoinCol(e.target.value)}>
              <option value="">-- Select column --</option>
              {commonCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {csvData && rightData && commonCols.length === 0 && (
              <p className="text-xs text-red-400 mt-1">No common columns found between files</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-2">Join Type</label>
            <select className="select-field w-full" value={joinType} onChange={e => setJoinType(e.target.value as JoinType)}>
              <option value="inner">INNER JOIN (matching rows only)</option>
              <option value="left">LEFT JOIN (all left rows)</option>
              <option value="right">RIGHT JOIN (all right rows)</option>
              <option value="outer">FULL OUTER JOIN (all rows)</option>
            </select>
          </div>
        </div>
        <button className="btn-primary" onClick={doJoin} disabled={!csvData || !rightData || !joinCol}>
          <Play size={14} /> Execute Join
        </button>
      </div>
    </div>
  );
}
