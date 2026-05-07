import { useState, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import type { CsvData, ActiveTab } from "./types";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";
import HomePage from "./pages/HomePage";
import DataPage from "./pages/DataPage";
import ProfilePage from "./pages/ProfilePage";
import StatsPage from "./pages/StatsPage";
import FilterPage from "./pages/FilterPage";
import AnomalyPage from "./pages/AnomalyPage";
import DuplicatesPage from "./pages/DuplicatesPage";
import PiiPage from "./pages/PiiPage";
import FormulaPage from "./pages/FormulaPage";
import JoinPage from "./pages/JoinPage";
import DiffPage from "./pages/DiffPage";
import ChartsPage from "./pages/ChartsPage";
import ExportPage from "./pages/ExportPage";
import SchemaPage from "./pages/SchemaPage";
import QueryPage from "./pages/QueryPage";

export default function App() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleDataLoaded = useCallback((data: CsvData) => {
    setCsvData(data);
    setActiveTab("data");
  }, []);

  const handleDataUpdated = useCallback((data: CsvData) => {
    setCsvData(data);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case "home":       return <HomePage onDataLoaded={handleDataLoaded} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} />;
      case "data":       return <DataPage csvData={csvData} onDataUpdated={handleDataUpdated} />;
      case "profile":    return <ProfilePage csvData={csvData} />;
      case "stats":      return <StatsPage csvData={csvData} />;
      case "filter":     return <FilterPage csvData={csvData} onDataUpdated={handleDataUpdated} />;
      case "anomaly":    return <AnomalyPage csvData={csvData} />;
      case "duplicates": return <DuplicatesPage csvData={csvData} />;
      case "pii":        return <PiiPage csvData={csvData} onDataUpdated={handleDataUpdated} />;
      case "formula":    return <FormulaPage csvData={csvData} onDataUpdated={handleDataUpdated} />;
      case "join":       return <JoinPage csvData={csvData} onDataLoaded={handleDataLoaded} />;
      case "diff":       return <DiffPage csvData={csvData} />;
      case "charts":     return <ChartsPage csvData={csvData} />;
      case "export":     return <ExportPage csvData={csvData} />;
      case "schema":     return <SchemaPage csvData={csvData} />;
      case "query":      return <QueryPage csvData={csvData} onDataUpdated={handleDataUpdated} />;
      default:           return <HomePage onDataLoaded={handleDataLoaded} setIsLoading={setIsLoading} setLoadingMessage={setLoadingMessage} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasData={!!csvData}
          fileName={csvData?.fileName}
        />
        <main className="flex-1 overflow-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">{loadingMessage || "Processing..."}</p>
              </div>
            </div>
          )}
          <div className="animate-fade-in">{renderPage()}</div>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#21253a", color: "#e2e8f0", border: "1px solid #2d3250", fontSize: "13px" },
          success: { iconTheme: { primary: "#0ea5e9", secondary: "#0c4a6e" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#450a0a" } },
        }}
      />
    </div>
  );
}
