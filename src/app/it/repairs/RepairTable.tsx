"use client";

import React from "react";
import { ArrowRight, User, MoreHorizontal } from "lucide-react";
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
  onAccept,
  onView,
  submitting,
}) => {
  if (repairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <User className="text-slate-300" size={24} />
        </div>
        <p className="text-slate-500 font-medium">
          ไม่พบข้อมูลรายการแจ้งซ่อมในขณะนี้
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile View (Cards) */}
      <div className="lg:hidden space-y-4">
        {repairs.map((repair) => (
          <div
            key={repair.id}
            onClick={() => onView(repair)}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md w-fit">
                  #{repair.ticketCode}
                </span>
                <h4 className="font-bold text-slate-800 text-base line-clamp-2">
                  {repair.problemTitle}
                </h4>
              </div>
              <StatusBadge status={repair.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-slate-50">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Urgency
                </span>
                <UrgencyBadge urgency={repair.urgency} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Reporter
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                    {repair.reporterName || "Anonymous"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {repair.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={repair.assignee.name}
                      size="sm"
                      className="w-7 h-7"
                    />
                    <span className="text-xs font-medium text-slate-600">
                      {repair.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    ยังไม่มีผู้รับผิดชอบ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {repair.status === "PENDING" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept(repair.id);
                    }}
                    disabled={submitting}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-bold disabled:opacity-50"
                  >
                    รับเรื่อง
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden lg:block overflow-hidden bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Ticket Details
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Reporter & Department
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Assignee
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {repairs.map((repair) => (
              <tr
                key={repair.id}
                onClick={() => onView(repair)}
                className="group cursor-pointer hover:bg-slate-50/50 transition-all duration-200"
              >
                {/* Ticket ID & Title */}
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md w-fit">
                        #{repair.ticketCode}
                      </span>
                      <UrgencyBadge urgency={repair.urgency} />
                    </div>
                    <span className="text-[14px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {repair.problemTitle}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    <StatusBadge status={repair.status} />
                  </div>
                </td>

                {/* Reporter */}
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">
                      {repair.reporterName || "Anonymous"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {DEPARTMENT_MAP[
                        repair.reporterDepartment?.toUpperCase() || ""
                      ] ||
                        repair.reporterDepartment ||
                        "ทั่วไป"}
                    </span>
                  </div>
                </td>

                {/* Assignee */}
                <td className="px-6 py-5">
                  {repair.assignee ? (
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={repair.assignee.name}
                        size="sm"
                        className="ring-2 ring-white shadow-sm"
                      />
                      <span className="text-sm font-medium text-slate-600">
                        {repair.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-7 h-7 rounded-full border border-dashed border-slate-200 flex items-center justify-center">
                        <User size={12} />
                      </div>
                      <span className="text-[11px] italic">No assignee</span>
                    </div>
                  )}
                </td>

                {/* Action */}
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end items-center gap-3">
                    {repair.status === "PENDING" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAccept(repair.id);
                        }}
                        disabled={submitting}
                        className="px-5 py-2 bg-slate-900 text-white rounded-full hover:bg-blue-600 transition-all duration-200 text-xs font-bold disabled:opacity-50 active:scale-95 shadow-sm"
                      >
                        รับเรื่อง
                      </button>
                    )}
                    <div className="p-2 rounded-full bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
