import React from "react";
import { Wrench, AlertCircle, User, CheckCircle } from "lucide-react";
import { Stats } from "./types/repair.types";

interface StatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, icon }) => (
  <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-2xl md:text-3xl font-black text-black tracking-tighter">
        {count}
      </span>
    </div>
    <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
      {label}
    </p>
  </div>
);

interface RepairStatsProps {
  stats: Stats;
  activeTab: string;
  totalThisWeek: number;
}

export const RepairStats: React.FC<RepairStatsProps> = ({
  stats,
  activeTab,
  totalThisWeek,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
      <StatCard
        label={
          activeTab === "available"
            ? "งานรอรับสิทธิ์"
            : activeTab === "my-tasks"
              ? "งานที่กำลังทำ"
              : "จบงานแล้ว"
        }
        count={
          activeTab === "available"
            ? stats.available
            : activeTab === "my-tasks"
              ? stats.myTasks
              : stats.completed
        }
        icon={<Wrench size={20} />}
      />
      <StatCard
        label="งานเร่งด่วน"
        count={stats.urgent}
        icon={
          <AlertCircle
            className="text-red-500 group-hover:text-red-400"
            size={20}
          />
        }
      />
      <StatCard
        label="งานของฉัน"
        count={stats.myTasks}
        icon={
          <User className="text-blue-500 group-hover:text-blue-400" size={20} />
        }
      />
      <StatCard
        label="งานทั้งหมดอาทิตย์นี้"
        count={totalThisWeek}
        icon={
          <CheckCircle
            className="text-emerald-500 group-hover:text-emerald-400"
            size={20}
          />
        }
      />
    </div>
  );
};
