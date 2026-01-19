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
      <div className="hidden lg:flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
        <p className="text-slate-400 font-medium">ไม่พบข้อมูลรายการแจ้งซ่อม</p>
      </div>
    );
  }

  return (
    <div className="hidden lg:block overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[120px]">
              ID CODE
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[150px]">
              STATUS
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              PROBLEM & REPORTER
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[180px]">
              ASSIGNEE
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[100px] text-right">
              ACTION
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              onClick={() => onView(repair)}
              className="group cursor-pointer hover:bg-slate-50 transition-all"
            >
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded w-fit">
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
                  <span className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:translate-x-1 transition-transform">
                    {repair.problemTitle}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">
                      {repair.reporterName || "Anonymous"}
                    </span>
                    <span className="text-slate-300">|</span>
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
                    <span className="text-[11px] font-bold text-slate-900">
                      {repair.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic font-medium">
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                    >
                      รับเรื่อง
                    </button>
                  )}
                  <div className="p-2 rounded-full border border-slate-100 text-slate-300 group-hover:text-blue-600 group-hover:border-blue-600 transition-all">
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
