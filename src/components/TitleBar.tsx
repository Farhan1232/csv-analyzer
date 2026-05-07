import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, BarChart3 } from "lucide-react";

export default function TitleBar() {
  const win = getCurrentWindow();

  return (
    <div className="tauri-drag-region h-10 bg-dark-surface border-b border-dark-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2 no-drag">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <BarChart3 size={14} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white">CSV Analyzer Pro</span>
        <span className="text-xs text-gray-500 ml-1">v1.0.0</span>
      </div>
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => win.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-dark-hover text-gray-400 hover:text-white transition-colors"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={() => win.toggleMaximize()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-dark-hover text-gray-400 hover:text-white transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => win.close()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
