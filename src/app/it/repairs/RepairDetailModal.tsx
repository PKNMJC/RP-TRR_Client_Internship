import React from "react";
import {
  X,
  Wrench,
  FileText,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Building2,
  MessageCircle,
} from "lucide-react";
import { RepairTicket } from "./types/repair.types";
import { Avatar } from "./ui/Avatar";
import { safeFormat } from "@/lib/date-utils";

interface RepairDetailModalProps {
  repair: RepairTicket | null;
  onClose: () => void;
  onEdit: () => void;
  onComplete: (id: number) => void;
  submitting: boolean;
}

export const RepairDetailModal: React.FC<RepairDetailModalProps> = ({
  repair,
  onClose,
  onEdit,
  onComplete,
  submitting,
}) => {
  if (!repair) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md transition-all duration-500"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-100 animate-in fade-in zoom-in duration-300">
        {/* TOP NAV */}
        <div className="px-6 md:px-10 py-6 md:py-8 flex justify-between items-center bg-white border-b border-neutral-50 shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-black items-center justify-center shadow-2xl rotate-3">
              <Wrench className="text-white" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] md:text-[11px] font-mono font-black bg-neutral-100 text-neutral-500 px-3 py-1 rounded-full uppercase tracking-tighter">
                  #{repair.ticketCode}
                </span>
                <div
                  className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${
                    repair.status === "COMPLETED"
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-neutral-200"
                  }`}
                >
                  {repair.status}
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-black tracking-tight">
                Case Overview
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-neutral-50 hover:bg-black transition-all duration-300"
          >
            <X
              size={20}
              className="text-neutral-400 group-hover:text-white transition-colors"
            />
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            {/* LEFT: Core Problem */}
            <div className="lg:col-span-7 space-y-8 md:space-y-12">
              <section className="space-y-6 text-center lg:text-left">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em]">
                    Subject
                  </p>
                  <h3 className="text-3xl md:text-4xl font-black text-black leading-[1.1] tracking-tight">
                    {repair.problemTitle}
                  </h3>
                </div>

                <div className="p-6 md:p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100/50">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em] mb-4 text-center">
                    รายละเอียด
                  </p>
                  <p className="text-base md:text-lg text-neutral-600 leading-relaxed font-medium italic text-center">
                    "{repair.problemDescription || "ไม่มีคำอธิบายเพิ่มเติม"}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 md:p-6 border border-neutral-100 rounded-[2rem] flex flex-col gap-1">
                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">
                      ประเภท
                    </span>
                    <div className="flex items-center gap-2 font-bold text-black text-xs md:text-sm">
                      <FileText size={14} />{" "}
                      {repair.problemCategory || "General"}
                    </div>
                  </div>
                  <div className="p-4 md:p-6 border border-neutral-100 rounded-[2rem] flex flex-col gap-1">
                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">
                      Location
                    </span>
                    <div className="flex items-center gap-2 font-bold text-black text-xs md:text-sm">
                      <MapPin size={14} /> {repair.location || "Office"}
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Tabs for Tech */}
              {repair.status !== "COMPLETED" && (
                <div className="flex gap-4 p-4 bg-neutral-900 rounded-[2.5rem] shadow-2xl">
                  <button
                    onClick={onEdit}
                    className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95"
                  >
                    Update Case
                  </button>
                  <button
                    onClick={() => onComplete(repair.id)}
                    disabled={submitting}
                    className="flex-1 bg-black text-white border border-neutral-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 active:scale-95"
                  >
                    Finalize Job
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: Reporter & Metadata */}
            <div className="lg:col-span-5 space-y-6 md:space-y-8">
              {/* Reporter Card */}
              <div className="p-6 md:p-8 rounded-[2.5rem] border-2 border-neutral-50 space-y-6 bg-white/50">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                  Reporter Profile
                </p>
                <div className="flex items-center gap-6">
                  <Avatar
                    name={repair.reporterName}
                    pictureUrl={repair.user?.lineOALink?.pictureUrl}
                    size="lg"
                  />
                  <div>
                    <h4 className="text-xl font-black text-black">
                      {repair.reporterName || "Unknown"}
                    </h4>
                    <p className="text-xs font-bold text-neutral-400">
                      {repair.reporterDepartment || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-4 text-xs font-bold text-neutral-600 bg-neutral-50/50 p-4 rounded-2xl">
                    <Phone size={14} /> {repair.reporterPhone || "-"}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-neutral-600 bg-neutral-50/50 p-4 rounded-2xl">
                    <MessageCircle size={14} /> {repair.reporterLineId || "-"}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-neutral-600 bg-neutral-50/50 p-4 rounded-2xl">
                    <Building2 size={14} /> {repair.reporterDepartment || "-"}
                  </div>
                </div>
              </div>

              {/* Timeline Info */}
              <div className="px-8 space-y-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-neutral-300 uppercase tracking-widest">
                    Reported
                  </span>
                  <span className="font-bold text-neutral-600">
                    {safeFormat(repair.createdAt, "MMM dd, HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-neutral-300 uppercase tracking-widest">
                    Last Activity
                  </span>
                  <span className="font-bold text-neutral-600">
                    {safeFormat(
                      repair.updatedAt || repair.createdAt,
                      "MMM dd, HH:mm",
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
