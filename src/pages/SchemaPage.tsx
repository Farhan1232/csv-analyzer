import { useState, useMemo } from "react";
import { Code2, Copy, Check } from "lucide-react";
import type { CsvData } from "../types";
import { profileData, generateSchema } from "../utils/csvEngine";
import toast from "react-hot-toast";

const SCHEMA_TYPES = [
  { value: "sql",        label: "SQL",              lang: "sql" },
  { value: "jsonSchema", label: "JSON Schema",      lang: "json" },
  { value: "rustStruct", label: "Rust Struct",      lang: "rust" },
  { value: "typescript", label: "TypeScript",       lang: "typescript" },
];

export default function SchemaPage({ csvData }: { csvData: CsvData | null }) {
  const [schemaType, setSchemaType] = useState("sql");
  const [tableName, setTableName] = useState("my_table");
  const [copied, setCopied] = useState(false);

  const schema = useMemo(() => {
    if (!csvData) return null;
    const profile = profileData(csvData);
    return generateSchema(csvData, profile, tableName);
  }, [csvData, tableName]);

  const content = schema ? (schema as Record<string, string | undefined>)[schemaType] ?? "" : "";

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Schema copied!");
  };

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Code2 size={18} className="text-brand-400" /> Schema Generator
      </h2>

      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex gap-2">
          {SCHEMA_TYPES.map(t => (
            <button key={t.value} onClick={() => setSchemaType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${schemaType === t.value ? "bg-brand-600 text-white" : "bg-dark-surface text-gray-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Table/Type name:</label>
          <input className="input-field font-mono text-xs w-40" value={tableName} onChange={e => setTableName(e.target.value)} />
        </div>
        <button className="btn-secondary py-1.5" onClick={copy}>
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="card">
        <pre className="text-sm font-mono text-gray-200 overflow-auto max-h-[65vh] whitespace-pre leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
