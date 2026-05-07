import { useState } from "react";
import { FunctionSquare, Play, BookOpen } from "lucide-react";
import type { CsvData } from "../types";
import { applyFormula } from "../utils/csvEngine";
import toast from "react-hot-toast";

interface FormulaPageProps {
  csvData: CsvData | null;
  onDataUpdated: (data: CsvData) => void;
}

const EXAMPLES = [
  { label: "Price × Qty",       expr: "total = price * quantity" },
  { label: "Full Name",         expr: "full_name = first_name + ' ' + last_name" },
  { label: "Discount",          expr: "discount = price > 100 ? price * 0.1 : 0" },
  { label: "Tax",               expr: "tax = amount * 0.18" },
  { label: "Profit Margin",     expr: "margin = ((revenue - cost) / revenue) * 100" },
  { label: "Length of Field",   expr: "name_length = name.length" },
];

export default function FormulaPage({ csvData, onDataUpdated }: FormulaPageProps) {
  const [expression, setExpression] = useState("");
  const [preview, setPreview] = useState<string[]>([]);

  const run = () => {
    if (!csvData || !expression.trim()) { toast.error("Enter a formula first"); return; }
    const result = applyFormula(csvData, expression);
    if ("error" in result) { toast.error(result.error); return; }
    const previewVals = result.rows.slice(0, 5).map(r => r[result.newColumn]);
    setPreview(previewVals);
    onDataUpdated({ ...csvData, headers: [...csvData.headers, result.newColumn], rows: result.rows });
    toast.success(`Column "${result.newColumn}" added successfully`);
  };

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <FunctionSquare size={18} className="text-brand-400" /> Formula Engine
      </h2>

      <div className="card space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-2">Formula Expression</label>
          <div className="flex gap-3">
            <input
              className="input-field flex-1 font-mono text-sm"
              placeholder="e.g. total = price * quantity"
              value={expression}
              onChange={e => setExpression(e.target.value)}
              onKeyDown={e => e.key === "Enter" && run()}
            />
            <button className="btn-primary" onClick={run}><Play size={14} /> Apply</button>
          </div>
          <p className="text-xs text-gray-600 mt-1">Syntax: <code className="text-brand-400">new_column = expression</code> — Use column names as variables</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><BookOpen size={12} /> Available columns:</p>
          <div className="flex flex-wrap gap-2">
            {csvData.headers.map(h => (
              <button key={h} onClick={() => setExpression(e => e + h)}
                className="badge badge-blue cursor-pointer hover:bg-brand-700 transition-colors font-mono">
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <p className="text-sm font-medium text-white mb-3 flex items-center gap-2"><BookOpen size={14} /> Example Formulas</p>
        <div className="grid grid-cols-3 gap-3">
          {EXAMPLES.map(ex => (
            <button key={ex.label} onClick={() => setExpression(ex.expr)}
              className="text-left bg-dark-surface hover:bg-dark-hover border border-dark-border rounded-lg p-3 transition-colors group">
              <p className="text-xs text-gray-400 group-hover:text-brand-400">{ex.label}</p>
              <p className="text-xs font-mono text-gray-300 mt-1 group-hover:text-white">{ex.expr}</p>
            </button>
          ))}
        </div>
      </div>

      {preview.length > 0 && (
        <div className="card animate-slide-up">
          <p className="text-xs text-gray-400 mb-2">Preview (first 5 rows):</p>
          <div className="flex gap-2 flex-wrap">
            {preview.map((v, i) => (
              <span key={i} className="badge badge-green font-mono">{v}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
