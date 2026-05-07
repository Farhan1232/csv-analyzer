import { useCallback, useState } from "react";
import { Upload, FileText, Zap, Shield, BarChart3, Search, Cpu } from "lucide-react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import type { CsvData } from "../types";

interface HomePageProps {
  onDataLoaded: (data: CsvData) => void;
  setIsLoading: (v: boolean) => void;
  setLoadingMessage: (v: string) => void;
}

const features = [
  { icon: BarChart3, label: "Data Profiling",       desc: "Auto type detection, health score, column stats" },
  { icon: Search,    label: "NL Queries",            desc: "Query CSV with plain English syntax" },
  { icon: Zap,       label: "Anomaly Detection",     desc: "Z-score & IQR statistical outlier detection" },
  { icon: Shield,    label: "PII Masking",           desc: "Detect & mask emails, SSNs, credit cards" },
  { icon: Cpu,       label: "Formula Engine",        desc: "Compute new columns with Excel-like formulas" },
  { icon: FileText,  label: "Multi-Format Export",   desc: "CSV, JSON, SQL, HTML, Markdown, Excel" },
];

export default function HomePage({ onDataLoaded, setIsLoading, setLoadingMessage }: HomePageProps) {
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv")) {
      toast.error("Please select a CSV or TSV file");
      return;
    }
    setIsLoading(true);
    setLoadingMessage(`Loading ${file.name}...`);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        onDataLoaded({
          headers, rows,
          totalRows: rows.length,
          filePath: file.name,
          fileName: file.name,
          fileSize: file.size,
        });
        toast.success(`Loaded ${rows.length.toLocaleString()} rows from ${file.name}`);
        setIsLoading(false);
      },
      error: (err) => {
        toast.error(`Parse error: ${err.message}`);
        setIsLoading(false);
      },
    });
  }, [onDataLoaded, setIsLoading, setLoadingMessage]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 gap-10">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">CSV Analyzer Pro</h1>
        <p className="text-gray-400 text-base max-w-md">
          A powerful desktop tool for analyzing, profiling, and transforming CSV data — built with Rust + React
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragging ? "border-brand-400 bg-brand-900/20" : "border-dark-border hover:border-brand-600 hover:bg-dark-card"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <Upload size={36} className={`mx-auto mb-3 ${dragging ? "text-brand-400" : "text-gray-500"}`} />
        <p className="text-white font-semibold text-lg">Drop your CSV file here</p>
        <p className="text-gray-500 text-sm mt-1">or click to browse</p>
        <p className="text-gray-600 text-xs mt-3">Supports .csv and .tsv files • Any size</p>
        <input id="file-input" type="file" accept=".csv,.tsv" className="hidden" onChange={onFileInput} />
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
        {features.map((f) => (
          <div key={f.label} className="card flex flex-col gap-2 hover:border-brand-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-brand-900 flex items-center justify-center">
              <f.icon size={16} className="text-brand-400" />
            </div>
            <p className="text-white text-sm font-semibold">{f.label}</p>
            <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
