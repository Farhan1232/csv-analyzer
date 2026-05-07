import {
  Home, Table2, Activity, BarChart2, Filter, AlertTriangle,
  Copy, Shield, FunctionSquare, Merge, GitCompare, PieChart,
  Download, Code2, Search, ChevronRight
} from "lucide-react";
import type { ActiveTab } from "../types";
import clsx from "clsx";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasData: boolean;
  fileName?: string;
}

const navGroups = [
  {
    label: "General",
    items: [
      { id: "home" as ActiveTab,    icon: Home,           label: "Home",          requiresData: false },
      { id: "data" as ActiveTab,    icon: Table2,         label: "Data Viewer",   requiresData: true  },
      { id: "query" as ActiveTab,   icon: Search,         label: "NL Query",      requiresData: true  },
    ],
  },
  {
    label: "Analysis",
    items: [
      { id: "profile" as ActiveTab,    icon: Activity,       label: "Data Profile",      requiresData: true },
      { id: "stats" as ActiveTab,      icon: BarChart2,      label: "Statistics",         requiresData: true },
      { id: "charts" as ActiveTab,     icon: PieChart,       label: "Charts",             requiresData: true },
      { id: "filter" as ActiveTab,     icon: Filter,         label: "Filter & Sort",      requiresData: true },
    ],
  },
  {
    label: "Advanced",
    items: [
      { id: "anomaly" as ActiveTab,    icon: AlertTriangle,  label: "Anomaly Detection",  requiresData: true },
      { id: "duplicates" as ActiveTab, icon: Copy,           label: "Fuzzy Duplicates",   requiresData: true },
      { id: "pii" as ActiveTab,        icon: Shield,         label: "PII Detection",      requiresData: true },
      { id: "formula" as ActiveTab,    icon: FunctionSquare, label: "Formula Engine",     requiresData: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "join" as ActiveTab,    icon: Merge,    label: "Join Files",    requiresData: false },
      { id: "diff" as ActiveTab,    icon: GitCompare,  label: "Diff Files",    requiresData: false },
      { id: "export" as ActiveTab,  icon: Download, label: "Export",        requiresData: true  },
      { id: "schema" as ActiveTab,  icon: Code2,    label: "Schema Gen",    requiresData: true  },
    ],
  },
];

export default function Sidebar({ activeTab, onTabChange, hasData, fileName }: SidebarProps) {
  return (
    <aside className="w-56 bg-dark-surface border-r border-dark-border flex flex-col shrink-0 overflow-y-auto">
      {fileName && (
        <div className="px-3 py-3 border-b border-dark-border">
          <div className="flex items-center gap-2 bg-dark-card rounded-lg px-2 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow shrink-0" />
            <span className="text-xs text-gray-300 truncate font-medium">{fileName}</span>
          </div>
        </div>
      )}
      <nav className="flex-1 px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const disabled = item.requiresData && !hasData;
                return (
                  <button
                    key={item.id}
                    onClick={() => !disabled && onTabChange(item.id)}
                    disabled={disabled}
                    className={clsx(
                      "sidebar-item w-full",
                      activeTab === item.id && "active",
                      disabled && "opacity-30 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <item.icon size={15} className="shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && <ChevronRight size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-dark-border">
        <p className="text-[10px] text-gray-600 text-center">Built with Rust + React</p>
      </div>
    </aside>
  );
}
