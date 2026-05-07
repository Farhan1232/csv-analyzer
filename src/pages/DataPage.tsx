import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { CsvData } from "../types";

interface DataPageProps {
  csvData: CsvData | null;
  onDataUpdated: (data: CsvData) => void;
}

const PAGE_SIZE = 50;

export default function DataPage({ csvData }: DataPageProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!csvData) return [];
    if (!search.trim()) return csvData.rows;
    const q = search.toLowerCase();
    return csvData.rows.filter(row => Object.values(row).some(v => (v ?? "").toLowerCase().includes(q)));
  }, [csvData, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!csvData) return <EmptyState />;

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Data Viewer</h2>
          <span className="badge badge-blue">{filtered.length.toLocaleString()} rows</span>
          <span className="badge badge-gray">{csvData.headers.length} cols</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-field pl-9 w-64"
            placeholder="Search all columns..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-dark-border">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="table-header w-12 text-center">#</th>
              {csvData.headers.map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="hover:bg-dark-hover transition-colors">
                <td className="table-cell text-center text-gray-600 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                {csvData.headers.map(h => (
                  <td key={h} className="table-cell max-w-[200px] overflow-hidden text-ellipsis" title={row[h]}>
                    {row[h] ?? <span className="text-gray-600 italic text-xs">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm text-gray-400">Page {page} / {totalPages}</span>
            <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">Load a CSV file to view data</p>
    </div>
  );
}
