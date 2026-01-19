"use client";

import React from "react";
import { ArrowRight, User } from "lucide-react";
import { RepairTicket } from "./types/repair.types";
import { StatusBadge, UrgencyBadge } from "./ui/Badge";
import { Avatar } from "./ui/Avatar";

interface RepairTableProps {
  repairs: RepairTicket[];
  activeTab: string;
  onAccept: (id: number) => void;
  onTransfer: (repair: RepairTicket) => void;
  onView: (repair: RepairTicket) => void;
  submitting: boolean;
}

const DEPARTMENT_MAP: Record<string, string> = {
  ACCOUNTING: "บัญชี",
  SALES: "การขาย",
  PRODUCTION: "ฝ่ายผลิต",
  IT: "ไอที",
  HR: "บุคคล",
  MAINTENANCE: "ซ่อมบำรุง",
  OTHER: "อื่นๆ",
};

export const RepairTable: React.FC<RepairTableProps> = ({
  repairs,
  activeTab,
  onAccept,
  onTransfer,
  onView,
  submitting,
}) => {
  if (repairs.length === 0) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center py-20 bg-white dark:bg-black border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl">
        <p className="text-gray-400 dark:text-neutral-600 font-medium">
          ไม่พบข้อมูลรายการแจ้งซ่อม
        </p>
      </div>
    );
  }

  return (
    <div className="hidden lg:block overflow-hidden bg-white dark:bg-black border border-gray-100 dark:border-neutral-900 rounded-2xl shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 dark:border-neutral-900 bg-gray-50/50 dark:bg-neutral-900/50">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 w-[120px]">
              ID CODE
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 w-[150px]">
              STATUS
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">
              PROBLEM & REPORTER
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 w-[180px]">
              ASSIGNEE
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 w-[100px] text-right">
              ACTION
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-neutral-900/50">
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              onClick={() => onView(repair)}
              className="group cursor-pointer hover:bg-gray-50/80 dark:hover:bg-neutral-900/30 transition-all"
            >
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold font-mono text-black dark:text-white bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded w-fit">
                    #{repair.ticketCode}
                  </span>
                  <UrgencyBadge urgency={repair.urgency} />
                </div>
              </td>
              <td className="px-6 py-5">
                <StatusBadge status={repair.status} />
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-black dark:text-white line-clamp-1 group-hover:translate-x-1 transition-transform">
                    {repair.problemTitle}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400">
                    <span className="font-medium text-black dark:text-neutral-300">
                      {repair.reporterName || "Anonymous"}
                    </span>
                    <span className="text-gray-300 dark:text-neutral-700">
                      |
                    </span>
                    <span>
                      {DEPARTMENT_MAP[
                        repair.reporterDepartment?.toUpperCase() || ""
                      ] ||
                        repair.reporterDepartment ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                {repair.assignee ? (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={repair.assignee.name} size="sm" />
                    <span className="text-[11px] font-bold text-black dark:text-white">
                      {repair.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 dark:text-neutral-600 italic font-medium">
                    รอมอบหมายงาน
                  </span>
                )}
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2">
                  {repair.status === "PENDING" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAccept(repair.id);
                      }}
                      disabled={submitting}
                      className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-all disabled:opacity-50 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/5 active:scale-[0.98]"
                    >
                      รับเรื่อง
                    </button>
                  )}
                  <div className="p-2 rounded-full border border-gray-100 dark:border-neutral-800 text-gray-300 dark:text-neutral-700 group-hover:text-black dark:group-hover:text-white group-hover:border-black dark:group-hover:border-white transition-all">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
