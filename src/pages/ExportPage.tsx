import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import type { CsvData } from "../types";
import { exportToCsv, exportToJson, exportToMarkdown, exportToSql, exportToHtml } from "../utils/csvEngine";
import toast from "react-hot-toast";

const FORMATS = [
  { value: "csv",      label: "CSV",      ext: ".csv",  desc: "Standard comma-separated values" },
  { value: "json",     label: "JSON",     ext: ".json", desc: "JSON array of objects" },
  { value: "sql",      label: "SQL",      ext: ".sql",  desc: "INSERT statements for any DB" },
  { value: "html",     label: "HTML",     ext: ".html", desc: "Styled HTML table" },
  { value: "markdown", label: "Markdown", ext: ".md",   desc: "GitHub flavored markdown table" },
];

export default function ExportPage({ csvData }: { csvData: CsvData | null }) {
  const [format, setFormat] = useState("csv");
  const [tableName, setTableName] = useState("my_table");
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);

  const generateContent = (fmt = format): string => {
    if (!csvData) return "";
    switch (fmt) {
      case "csv":      return exportToCsv(csvData);
      case "json":     return exportToJson(csvData);
      case "sql":      return exportToSql(csvData, tableName);
      case "html":     return exportToHtml(csvData);
      case "markdown": return exportToMarkdown(csvData);
      default:         return "";
    }
  };

  const handlePreview = () => {
    const content = generateContent();
    setPreview(content.slice(0, 3000) + (content.length > 3000 ? "\n\n... (truncated)" : ""));
  };

  const handleDownload = () => {
    if (!csvData) return;
    const content = generateContent();
    const ext = FORMATS.find(f => f.value === format)?.ext ?? ".txt";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvData.fileName.replace(".csv", "") + ext;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${ext}`);
  };

  const handleCopy = () => {
    const content = generateContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  if (!csvData) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Download size={18} className="text-brand-400" /> Export Data
      </h2>

      <div className="grid grid-cols-5 gap-3">
        {FORMATS.map(f => (
          <button key={f.value} onClick={() => { setFormat(f.value); setPreview(""); }}
            className={`card text-left transition-all hover:border-brand-600 ${format === f.value ? "border-brand-500 bg-brand-900/20" : ""}`}>
            <p className="text-xs font-mono text-brand-400 mb-1">{f.ext}</p>
            <p className="text-sm font-semibold text-white">{f.label}</p>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </button>
        ))}
      </div>

      {format === "sql" && (
        <div className="card max-w-xs">
          <label className="text-xs text-gray-400 block mb-2">Table Name</label>
          <input className="input-field w-full font-mono" value={tableName} onChange={e => setTableName(e.target.value)} />
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn-secondary" onClick={handlePreview}><Check size={14} /> Preview</button>
        <button className="btn-primary" onClick={handleDownload}><Download size={14} /> Download</button>
        <button className="btn-secondary" onClick={handleCopy}>
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {preview && (
        <div className="card animate-slide-up">
          <p className="text-xs text-gray-400 mb-2">Preview:</p>
          <pre className="text-xs text-gray-300 font-mono overflow-auto max-h-80 whitespace-pre-wrap break-all">{preview}</pre>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
