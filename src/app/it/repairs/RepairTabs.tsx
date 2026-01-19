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
    <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl w-full md:w-fit border border-gray-200 shadow-sm mt-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex flex-1 md:flex-none items-center justify-center md:justify-start gap-1.5 md:gap-2 px-2 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm transition-all duration-300 ${
            activeTab === tab.id
              ? "bg-black text-white shadow-lg scale-[1.02] md:scale-105"
              : "text-gray-500 hover:text-black hover:bg-white/50"
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
                ? "bg-white/20 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};
