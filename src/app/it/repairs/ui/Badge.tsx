import React from "react";
import { RepairStatus, RepairUrgency } from "../types/repair.types";

export const StatusBadge: React.FC<{ status: RepairStatus }> = ({ status }) => {
  const styles = {
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    WAITING_PARTS: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
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
    NORMAL: "bg-gray-50 text-gray-600 border-gray-100",
    URGENT: "bg-orange-50 text-orange-600 border-orange-100",
    CRITICAL: "bg-red-50 text-red-600 border-red-200",
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
