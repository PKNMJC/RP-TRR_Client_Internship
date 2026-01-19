import React from "react";
import { Clock, User } from "lucide-react";
import { RepairTicket } from "./types/repair.types";
import { StatusBadge, UrgencyBadge } from "./ui/Badge";
import { Avatar } from "./ui/Avatar";
import { safeFormat } from "@/lib/date-utils";

interface RepairCardProps {
  repair: RepairTicket;
  activeTab: string;
  onAccept: (id: number) => void;
  onTransfer: (repair: RepairTicket) => void;
  onView: (repair: RepairTicket) => void;
  submitting: boolean;
}

export const RepairCard: React.FC<RepairCardProps> = ({
  repair,
  activeTab,
  onAccept,
  onTransfer,
  onView,
  submitting,
}) => {
  return (
    <div
      onClick={() => onView(repair)}
      className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800 last:border-b-0 cursor-pointer group/card"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="max-w-[70%]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[9px] font-bold font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
              #{repair.ticketCode}
            </span>
            <StatusBadge status={repair.status} />
          </div>
          <h3 className="font-bold text-black dark:text-white text-sm md:text-base leading-snug line-clamp-2">
            {repair.problemTitle}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
            <Clock size={10} />
            <span className="text-[10px] md:text-xs">
              {safeFormat(repair.createdAt, "dd MMM yy HH:mm")}
            </span>
          </div>
        </div>
        <UrgencyBadge urgency={repair.urgency} />
      </div>

      <div className="flex items-center justify-between mb-4 bg-gray-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100/50 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Avatar name={repair.assignee?.name} size="md" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-tight">
              {repair.assignee?.name || "รอมอบหมาย"}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">
              ผู้รับผิดชอบ
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeTab === "available" ? (
          <div className="flex-1 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(repair.id);
              }}
              disabled={submitting}
              className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-all disabled:opacity-50 text-[11px] font-bold shadow-lg shadow-black/5 dark:shadow-none active:scale-[0.98]"
            >
              รับเรื่องดูแล
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(repair);
              }}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-[11px] font-bold active:scale-[0.98]"
            >
              รายละเอียด
            </button>
          </div>
        ) : (
          <>
            {repair.status !== "COMPLETED" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTransfer(repair);
                }}
                className="flex-1 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-[11px] font-bold active:scale-[0.98]"
              >
                โอนงาน
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(repair);
              }}
              className="flex-1 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-[11px] font-bold active:scale-[0.98]"
            >
              รายละเอียด
            </button>
          </>
        )}
      </div>
    </div>
  );
};
