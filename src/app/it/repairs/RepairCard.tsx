import React from "react";
import { Clock, User, ArrowRight } from "lucide-react";
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
      className="p-4 bg-white hover:bg-slate-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer group/card"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
              #{repair.ticketCode}
            </span>
            <UrgencyBadge urgency={repair.urgency} />
          </div>
          <h4 className="font-bold text-slate-900 text-sm group-hover/card:translate-x-1 transition-transform">
            {repair.problemTitle}
          </h4>
        </div>
        <StatusBadge status={repair.status} />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {repair.assignee?.name ? (
            <div className="flex items-center gap-2">
              <Avatar name={repair.assignee.name} size="sm" />
              <span className="text-[11px] font-bold text-slate-900">
                {repair.assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic">
              ยังไม่มีผู้รับผิดชอบ
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
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
          <div className="p-2 rounded-full border border-slate-100 text-slate-300 group-hover/card:text-blue-600 group-hover/card:border-blue-600 transition-all">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};
