import React from "react";
import { Eye, Share2 } from "lucide-react";
import { RepairTicket } from "./types/repair.types";
import { StatusBadge, UrgencyBadge } from "./ui/Badge";
import { Avatar } from "./ui/Avatar";
import { safeFormat } from "@/lib/date-utils";
import { EmptyState } from "./ui/EmptyState";

interface RepairTableProps {
  repairs: RepairTicket[];
  activeTab: string;
  onAccept: (id: number) => void;
  onTransfer: (repair: RepairTicket) => void;
  onView: (repair: RepairTicket) => void;
  submitting: boolean;
}

export const RepairTable: React.FC<RepairTableProps> = ({
  repairs,
  activeTab,
  onAccept,
  onTransfer,
  onView,
  submitting,
}) => {
  if (repairs.length === 0) return <EmptyState />;

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
            <th className="px-6 py-3 text-xs font-bold text-black dark:text-white uppercase border-b border-gray-100 dark:border-slate-800">
              ตั๋วเลขที่
            </th>
            <th className="px-6 py-3 text-xs font-bold text-black dark:text-white uppercase border-b border-gray-100 dark:border-slate-800">
              หัวข้อแจ้งซ่อม
            </th>
            <th className="px-6 py-3 text-xs font-bold text-black dark:text-white uppercase border-b border-gray-100 dark:border-slate-800">
              ความสำคัญ
            </th>
            <th className="px-6 py-3 text-xs font-bold text-black dark:text-white uppercase border-b border-gray-100 dark:border-slate-800">
              สถานะ
            </th>
            {activeTab !== "available" && activeTab !== "completed" && (
              <th className="px-6 py-3 text-xs font-bold text-black dark:text-white uppercase border-b border-gray-100 dark:border-slate-800">
                ผู้รับผิดชอบ
              </th>
            )}
            <th className="px-6 py-3 border-b border-gray-100 dark:border-slate-800"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              className="bg-white dark:bg-black hover:bg-gray-50/80 dark:hover:bg-neutral-900/50 transition-colors group border-b border-gray-100 dark:border-neutral-900 last:border-0"
            >
              <td className="px-6 py-5">
                <span className="text-[10px] font-bold font-mono text-black dark:text-white bg-gray-100 dark:bg-neutral-900 px-2 py-1 rounded border border-gray-200 dark:border-neutral-800">
                  #{repair.ticketCode}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="text-sm font-bold text-black dark:text-white group-hover:translate-x-1 transition-transform">
                  {repair.problemTitle}
                </div>
                <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-neutral-800"></span>
                  แจ้งเมื่อ: {safeFormat(repair.createdAt, "dd/MM/yy HH:mm")}
                </div>
              </td>
              <td className="px-6 py-5">
                <UrgencyBadge urgency={repair.urgency} />
              </td>
              <td className="px-6 py-5">
                <StatusBadge status={repair.status} />
              </td>
              {activeTab !== "available" && activeTab !== "completed" && (
                <td className="px-6 py-5">
                  <div className="text-sm font-medium text-black dark:text-white">
                    {repair.assignee?.name ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={repair.assignee.name} size="sm" />
                        <span className="truncate max-w-[120px] font-bold">
                          {repair.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs italic">
                        - ไม่ระบุ -
                      </span>
                    )}
                  </div>
                </td>
              )}
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {repair.status === "PENDING" && (
                    <button
                      onClick={() => onAccept(repair.id)}
                      disabled={submitting}
                      className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-all disabled:opacity-50 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/5"
                      title="รับเรื่อง"
                    >
                      รับเรื่อง
                    </button>
                  )}
                  {repair.status !== "COMPLETED" && (
                    <button
                      onClick={() => onTransfer(repair)}
                      className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                      title="โอนงาน"
                    >
                      <Share2 size={16} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    onClick={() => onView(repair)}
                    className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                    title="ดูรายละเอียด"
                  >
                    <Eye size={16} strokeWidth={2} />
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
