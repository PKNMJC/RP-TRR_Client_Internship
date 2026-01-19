import React from "react";
import { Clock, User, CheckCircle } from "lucide-react";
import { Stats } from "./types/repair.types";

interface RepairTabsProps {
  activeTab: string;
  setActiveTab: (tab: "available" | "my-tasks" | "completed") => void;
  stats: Stats;
}

export const RepairTabs: React.FC<RepairTabsProps> = ({
  activeTab,
  setActiveTab,
  stats,
}) => {
  const tabs = [
    {
      id: "available",
      label: "งานรอรับ",
      icon: <Clock size={14} />,
      count: stats.available,
    },
    {
      id: "my-tasks",
      label: "งานของฉัน",
      icon: <User size={14} />,
      count: stats.myTasks,
    },
    {
      id: "completed",
      label: "งานเสร็จสิ้น",
      icon: <CheckCircle size={14} />,
      count: stats.completed,
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-slate-800/30 p-1 rounded-2xl w-full md:w-fit border border-gray-200 dark:border-slate-800 shadow-sm mt-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex flex-1 md:flex-none items-center justify-center md:justify-start gap-1.5 md:gap-2 px-2 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm transition-all duration-300 ${
            activeTab === tab.id
              ? "bg-black dark:bg-white text-white dark:text-black shadow-lg scale-[1.02] md:scale-105"
              : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <div className="flex items-center gap-1">
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </div>
          <span
            className={`flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[8px] md:text-[10px] ${
              activeTab === tab.id
                ? "bg-white/20 dark:bg-black/20 text-white dark:text-black"
                : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};
