import React from "react";
import { RefreshCw } from "lucide-react";

export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-12">
    <RefreshCw className="animate-spin text-blue-600" size={32} />
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-sm font-bold text-slate-900 animate-pulse uppercase tracking-widest">
        กำลังโหลดข้อมูล...
      </p>
    </div>
  </div>
);
