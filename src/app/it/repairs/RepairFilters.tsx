import React from "react";
import { Search } from "lucide-react";

interface RepairFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterPriority: string;
  setFilterPriority: (val: string) => void;
}

export const RepairFilters: React.FC<RepairFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
}) => {
  const selectStyles = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "1rem",
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
      <div className="relative flex-1">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="ค้นหาชื่อผู้แจ้ง, รหัสตั๋ว..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="ค้นหาการแจ้งซ่อม"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:flex md:w-auto">
        <select
          className="px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs appearance-none pr-10 transition-all cursor-pointer"
          style={selectStyles}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="กรองข้อมูลตามสถานะ"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="PENDING">รอรับเรื่อง</option>
          <option value="IN_PROGRESS">กำลังดำเนินการ</option>
          <option value="WAITING_PARTS">รออะไหล่</option>
        </select>
        <select
          className="px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs appearance-none pr-10 transition-all cursor-pointer"
          style={selectStyles}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          aria-label="กรองข้อมูลตามความสำคัญ"
        >
          <option value="all">ทุกความสำคัญ</option>
          <option value="CRITICAL">ด่วนมาก</option>
          <option value="URGENT">ด่วน</option>
          <option value="NORMAL">ปกติ</option>
        </select>
      </div>
    </div>
  );
};
