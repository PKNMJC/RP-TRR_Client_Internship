import React from "react";
import { RefreshCw } from "lucide-react";

interface StatusIndicatorProps {
  isAutoRefresh: boolean;
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isAutoRefresh,
  lastUpdated,
  loading,
  onRefresh,
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
      <div
        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
          isAutoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-400"
        }`}
        aria-hidden="true"
      ></div>
      <span className="text-[8px] md:text-xs text-gray-500 font-mono">
        Updated: {lastUpdated ? lastUpdated.toLocaleTimeString("th-TH") : "..."}
      </span>
      <button
        onClick={onRefresh}
        className="p-0.5 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black"
        title="Refresh Now"
        aria-label="Refresh data now"
      >
        <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
};
