import { useState } from "react";
import { Filter, Plus, Trash2, Play, RotateCcw } from "lucide-react";
import type { CsvData, FilterRule, FilterOperator } from "../types";
import { applyFilters } from "../utils/csvEngine";
import toast from "react-hot-toast";

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "equals",       label: "Equals" },
  { value: "not_equals",   label: "Not equals" },
  { value: "contains",     label: "Contains" },
  { value: "not_contains", label: "Not contains" },
  { value: "starts_with",  label: "Starts with" },
  { value: "ends_with",    label: "Ends with" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than",    label: "Less than" },
  { value: "greater_eq",   label: ">= (gte)" },
  { value: "less_eq",      label: "<= (lte)" },
  { value: "is_null",      label: "Is empty" },
  { value: "is_not_null",  label: "Is not empty" },
  { value: "regex",        label: "Regex match" },
];

interface FilterPageProps {
  csvData: CsvData | null;
  onDataUpdated: (data: CsvData) => void;
}

export default function FilterPage({ csvData, onDataUpdated }: FilterPageProps) {
  const [rules, setRules] = useState<FilterRule[]>([{ column: "", operator: "equals", value: "", logicalOp: "AND" }]);

  const addRule = () => setRules(r => [...r, { column: "", operator: "contains", value: "", logicalOp: "AND" }]);
  const removeRule = (i: number) => setRules(r => r.filter((_, idx) => idx !== i));
  const updateRule = (i: number, patch: Partial<FilterRule>) => setRules(r => r.map((rule, idx) => idx === i ? { ...rule, ...patch } : rule));

  const applyRules = () => {
    if (!csvData) return;
    const validRules = rules.filter(r => r.column && (r.operator === "is_null" || r.operator === "is_not_null" || r.value));
    if (!validRules.length) { toast.error("Add at least one valid filter rule"); return; }
    const result = applyFilters(csvData, validRules);
    onDataUpdated(result);
    toast.success(`Filtered to ${result.totalRows.toLocaleString()} rows`);
  };

  const resetFilter = () => {
    if (!csvData) return;
    onDataUpdated({ ...csvData, rows: csvData.rows, totalRows: csvData.rows.length });
    toast.success("Filters cleared");
  };

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Filter size={18} className="text-brand-400" /> Filter & Sort
      </h2>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white">Filter Rules</p>
          <button className="btn-secondary py-1.5" onClick={addRule}><Plus size={14} /> Add Rule</button>
        </div>

        {rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-2 flex-wrap">
            {i > 0 && (
              <select className="select-field w-20" value={rule.logicalOp} onChange={e => updateRule(i, { logicalOp: e.target.value as "AND" | "OR" })}>
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            )}
            <select className="select-field flex-1 min-w-[140px]" value={rule.column} onChange={e => updateRule(i, { column: e.target.value })}>
              <option value="">Select column</option>
              {csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <select className="select-field w-40" value={rule.operator} onChange={e => updateRule(i, { operator: e.target.value as FilterOperator })}>
              {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
            </select>
            {rule.operator !== "is_null" && rule.operator !== "is_not_null" && (
              <input className="input-field flex-1 min-w-[120px]" placeholder="Value..." value={rule.value} onChange={e => updateRule(i, { value: e.target.value })} />
            )}
            <button className="p-2 text-gray-500 hover:text-red-400 transition-colors" onClick={() => removeRule(i)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" onClick={applyRules}><Play size={14} /> Apply Filters</button>
          <button className="btn-secondary" onClick={resetFilter}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
