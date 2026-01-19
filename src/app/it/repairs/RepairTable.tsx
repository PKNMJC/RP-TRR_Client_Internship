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
      <div className="hidden lg:flex flex-col items-center justify-center py-32 bg-white border border-slate-100 rounded-3xl">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <User className="text-slate-300" size={24} />
        </div>
        <p className="text-slate-400 font-medium">ไม่พบข้อมูลรายการแจ้งซ่อมในขณะนี้</p>
      </div>
    );
  }

  return (
    <div className="hidden lg:block overflow-hidden bg-white border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-white">
            <th className="px-6 py-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Ticket ID
            </th>
            <th className="px-6 py-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-6 py-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Details & Reporter
            </th>
            <th className="px-6 py-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Assignee
            </th>
            <th className="px-6 py-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              onClick={() => onView(repair)}
              className="group cursor-pointer hover:bg-slate-50/50 transition-colors duration-200"
            >
              {/* Ticket ID & Urgency */}
              <td className="px-6 py-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50/50 px-2 py-1 rounded-md w-fit">
                    #{repair.ticketCode}
                  </span>
                  <UrgencyBadge urgency={repair.urgency} />
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-6">
                <StatusBadge status={repair.status} />
              </td>

              {/* Problem Details */}
              <td className="px-6 py-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[15px] font-semibold text-slate-800 line-clamp-1">
                    {repair.problemTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="font-medium">{repair.reporterName || "Anonymous"}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400">
                        {DEPARTMENT_MAP[repair.reporterDepartment?.toUpperCase() || ""] ||
                          repair.reporterDepartment || "ทั่วไป"}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              {/* Assignee */}
              <td className="px-6 py-6">
                {repair.assignee ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={repair.assignee.name} size="sm" className="ring-2 ring-white shadow-sm" />
                    <span className="text-sm font-medium text-slate-700">
                      {repair.assignee.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-8 h-8 rounded-full border border-dashed border-slate-200 flex items-center justify-center">
                      <User size={14} />
                    </div>
                    <span className="text-xs italic">ยังไม่มีผู้รับผิดชอบ</span>
                  </div>
                )}
              </td>

              {/* Action Buttons */}
              <td className="px-6 py-6 text-right">
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
                  <button className="p-2.5 rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-200">
                    <ArrowRight size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};