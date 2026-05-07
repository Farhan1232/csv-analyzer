import { useState, useMemo } from "react";
import { PieChart } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import type { CsvData } from "../types";

const COLORS = ["#0ea5e9","#38bdf8","#7dd3fc","#bae6fd","#0284c7","#0369a1","#38a169","#f59e0b","#ef4444","#a855f7"];

type ChartType = "bar" | "line" | "area" | "pie";

export default function ChartsPage({ csvData }: { csvData: CsvData | null }) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");

  const numericCols = useMemo(() => {
    if (!csvData) return [];
    return csvData.headers.filter(h => {
      const vals = csvData.rows.slice(0, 50).map(r => r[h]);
      return vals.filter(v => !isNaN(Number(v)) && v !== "").length > vals.length * 0.5;
    });
  }, [csvData]);

  const chartData = useMemo(() => {
    if (!csvData || !xCol || !yCol) return [];
    return csvData.rows.slice(0, 50).map(r => ({ name: r[xCol] ?? "", value: Number(r[yCol]) || 0 }));
  }, [csvData, xCol, yCol]);

  const freqData = useMemo(() => {
    if (!csvData || !xCol) return [];
    const freq: Record<string, number> = {};
    for (const row of csvData.rows) freq[row[xCol] ?? ""] = (freq[row[xCol] ?? ""] || 0) + 1;
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, value]) => ({ name, value }));
  }, [csvData, xCol]);

  if (!csvData) return <EmptyState />;

  const data = yCol ? chartData : freqData;
  const CHART_TYPES: { value: ChartType; label: string }[] = [
    { value: "bar", label: "Bar Chart" },
    { value: "line", label: "Line Chart" },
    { value: "area", label: "Area Chart" },
    { value: "pie", label: "Pie Chart" },
  ];

  const renderChart = () => {
    const commonProps = { data, margin: { top: 5, right: 30, left: 20, bottom: 60 } };
    const xProps = { dataKey: "name", tick: { fill: "#9ca3af", fontSize: 11 }, angle: -30, textAnchor: "end" as const };
    const yProps = { tick: { fill: "#9ca3af", fontSize: 11 } };
    const tooltipStyle = { backgroundColor: "#21253a", border: "1px solid #2d3250", color: "#e2e8f0", fontSize: 12 };

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3250" />
            <XAxis {...xProps} />
            <YAxis {...yProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#0ea5e9" radius={[4,4,0,0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        );
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3250" />
            <XAxis {...xProps} />
            <YAxis {...yProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: "#0ea5e9", r: 4 }} />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3250" />
            <XAxis {...xProps} />
            <YAxis {...yProps} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0c4a6e" strokeWidth={2} />
          </AreaChart>
        );
      case "pie":
        return (
          <RechartsPie>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`} labelLine={false}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
          </RechartsPie>
        );
    }
  };

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <PieChart size={18} className="text-brand-400" /> Charts & Visualization
      </h2>

      <div className="card flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-2">Chart Type</label>
          <div className="flex gap-2">
            {CHART_TYPES.map(ct => (
              <button key={ct.value} onClick={() => setChartType(ct.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${chartType === ct.value ? "bg-brand-600 text-white" : "bg-dark-surface text-gray-400 hover:text-white"}`}>
                {ct.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-2">X Axis (Category)</label>
          <select className="select-field" value={xCol} onChange={e => setXCol(e.target.value)}>
            <option value="">-- Select --</option>
            {csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-2">Y Axis (Numeric, optional)</label>
          <select className="select-field" value={yCol} onChange={e => setYCol(e.target.value)}>
            <option value="">-- Count by X --</option>
            {numericCols.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {xCol && data.length > 0 ? (
        <div className="card" style={{ height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() as React.ReactElement}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          Select at least an X axis column to render a chart
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Load a CSV file first</p></div>;
}
