import React from "react";
import { RepairStatus, RepairUrgency } from "../types/repair.types";

export const StatusBadge: React.FC<{ status: RepairStatus }> = ({ status }) => {
  const styles = {
    PENDING:
      "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700",
    IN_PROGRESS:
      "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    WAITING_PARTS:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    COMPLETED:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    CANCELLED:
      "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const labels = {
    PENDING: "รอรับเรื่อง",
    IN_PROGRESS: "กำลังซ่อม",
    WAITING_PARTS: "รออะไหล่",
    COMPLETED: "เสร็จสิ้น",
    CANCELLED: "ยกเลิก",
  };

  return (
    <span
      className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-xs font-bold border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ urgency: RepairUrgency }> = ({
  urgency,
}) => {
  const styles = {
    NORMAL:
      "bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-slate-800",
    URGENT:
      "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800",
    CRITICAL:
      "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const labels = {
    NORMAL: "ปกติ",
    URGENT: "ด่วน",
    CRITICAL: "ด่วนมาก",
  };

  return (
    <span
      className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-tight border ${styles[urgency]}`}
    >
      {labels[urgency]}
    </span>
  );
};
