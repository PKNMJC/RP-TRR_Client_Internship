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
          <tr className="bg-gray-50 text-left">
            <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
              ตั๋วเลขที่
            </th>
            <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
              หัวข้อแจ้งซ่อม
            </th>
            <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
              ความสำคัญ
            </th>
            <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
              สถานะ
            </th>
            {activeTab !== "available" && activeTab !== "completed" && (
              <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                ผู้รับผิดชอบ
              </th>
            )}
            <th className="px-6 py-3 border-b border-gray-100"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              className="hover:bg-gray-50/50 transition-colors group"
            >
              <td className="px-6 py-4">
                <span className="text-xs font-semibold font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                  #{repair.ticketCode}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-semibold text-black">
                  {repair.problemTitle}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  แจ้งเมื่อ: {safeFormat(repair.createdAt, "dd/MM/yy HH:mm")}
                </div>
              </td>
              <td className="px-6 py-4">
                <UrgencyBadge urgency={repair.urgency} />
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={repair.status} />
              </td>
              {activeTab !== "available" && activeTab !== "completed" && (
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-black">
                    {repair.assignee?.name ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={repair.assignee.name} size="sm" />
                        <span className="truncate max-w-[100px]">
                          {repair.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">
                        - ไม่ระบุ -
                      </span>
                    )}
                  </div>
                </td>
              )}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {repair.status === "PENDING" && (
                    <button
                      onClick={() => onAccept(repair.id)}
                      disabled={submitting}
                      className="bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 text-xs font-medium"
                      title="รับเรื่อง"
                    >
                      รับเรื่อง
                    </button>
                  )}
                  {repair.status !== "COMPLETED" && (
                    <button
                      onClick={() => onTransfer(repair)}
                      className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                      title="โอนงาน"
                    >
                      <Share2 size={16} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    onClick={() => onView(repair)}
                    className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
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
