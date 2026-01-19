import React from "react";
import {
  X,
  MapPin,
  Tag,
  Calendar,
  User,
  Phone,
  MessageCircle,
  Building2,
  ArrowRight,
  Check,
  Edit3,
} from "lucide-react";
import { RepairTicket, RepairStatus } from "./types/repair.types";
import { Avatar } from "./ui/Avatar";
import { safeFormat } from "@/lib/date-utils";

interface RepairDetailModalProps {
  repair: RepairTicket | null;
  onClose: () => void;
  onEdit: () => void;
  onComplete: (id: number) => void;
  submitting: boolean;
}

const STATUS_MAP: Record<RepairStatus, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังดำเนินการ",
  WAITING_PARTS: "รออะไหล่",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

const CATEGORY_MAP: Record<string, string> = {
  HARDWARE: "ฮาร์ดแวร์",
  SOFTWARE: "ซอฟต์แวร์",
  NETWORK: "เครือข่าย",
  PERIPHERAL: "อุปกรณ์ต่อพ่วง",
  EMAIL_OFFICE365: "Email / Office 365",
  ACCOUNT_PASSWORD: "Account / Password",
  OTHER: "อื่นๆ",
  GENERAL: "ทั่วไป",
};

export const RepairDetailModal: React.FC<RepairDetailModalProps> = ({
  repair,
  onClose,
  onEdit,
  onComplete,
  submitting,
}) => {
  if (!repair) return null;

  const translatedStatus = STATUS_MAP[repair.status] || repair.status;
  const translatedCategory =
    CATEGORY_MAP[repair.problemCategory?.toUpperCase() || ""] ||
    repair.problemCategory ||
    "ทั่วไป";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-neutral-200">
        {/* HEADER: Minimal & Clean */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs font-medium tracking-widest text-neutral-400 uppercase">
              รหัสรายการ: {repair.ticketCode}
            </span>
            <div
              className={`text-[10px] px-2 py-0.5 border font-bold uppercase tracking-wider ${
                repair.status === "COMPLETED"
                  ? "bg-black text-white border-black"
                  : "border-neutral-200 text-neutral-500"
              }`}
            >
              {translatedStatus}
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:rotate-90 transition-transform duration-200 text-neutral-400 hover:text-black"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* MAIN CONTENT (Col: 7) */}
            <div className="md:col-span-7 p-8 md:p-12 border-b md:border-b-0 md:border-r border-neutral-100">
              <div className="space-y-10">
                {/* Title & Description */}
                <section className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-light text-neutral-900 leading-tight tracking-tight">
                    {repair.problemTitle}
                  </h1>
                  <p className="text-neutral-500 leading-relaxed text-lg font-light">
                    {repair.problemDescription || "ไม่มีคำอธิบายเพิ่มเติม"}
                  </p>
                </section>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-8 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
                      หมวดหมู่
                    </p>
                    <div className="flex items-center gap-2 text-neutral-800">
                      <Tag size={14} className="text-neutral-300" />
                      <span className="text-sm font-medium">
                        {translatedCategory}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
                      สถานที่แจ้ง
                    </p>
                    <div className="flex items-center gap-2 text-neutral-800">
                      <MapPin size={14} className="text-neutral-300" />
                      <span className="text-sm font-medium">
                        {repair.location || "สำนักงาน"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Simple */}
                <div className="pt-8 border-t border-neutral-100 space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
                    ไทม์ไลน์
                  </p>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-neutral-400">
                        วันที่สร้าง
                      </span>
                      <span className="text-sm text-neutral-700">
                        {safeFormat(repair.createdAt, "dd MMM yyyy · HH:mm")}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-neutral-200" />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-neutral-400">
                        กิจกรรมล่าสุด
                      </span>
                      <span className="text-sm text-neutral-700">
                        {safeFormat(
                          repair.updatedAt || repair.createdAt,
                          "dd MMM yyyy · HH:mm",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SIDEBAR: Reporter Profile (Col: 5) */}
            <div className="md:col-span-5 bg-neutral-50/50 p-8 md:p-12">
              <div className="space-y-10">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
                    ผู้แจ้งซ่อม
                  </p>
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={repair.reporterName}
                      size="xl"
                      className="rounded-none border border-neutral-200 grayscale shadow-sm"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">
                        {repair.reporterName}
                      </h3>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">
                        {repair.reporterDepartment}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <div className="flex items-center gap-3 text-neutral-500">
                      <Phone size={14} strokeWidth={1.5} />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        เบอร์โทรศัพท์
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-800">
                      {repair.reporterPhone || "-"}
                    </span>
                  </div>
                 
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <div className="flex items-center gap-3 text-neutral-500">
                      <Building2 size={14} strokeWidth={1.5} />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        แผนก
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-800 text-right">
                      {repair.reporterDepartment || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Actions */}
        <div className="p-6 border-t border-neutral-100 bg-white flex flex-col sm:flex-row gap-3 justify-end items-center">
          {repair.status !== "COMPLETED" ? (
            <>
              <button
                onClick={onEdit}
                className="w-full sm:w-auto px-8 py-3 bg-white border border-neutral-200 text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 size={14} /> แก้ไขข้อมูล
              </button>
              <button
                onClick={() => onComplete(repair.id)}
                disabled={submitting}
                className="w-full sm:w-auto px-10 py-3 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 disabled:bg-neutral-300 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  "กำลังดำเนินการ..."
                ) : (
                  <>
                    <Check size={16} /> แก้ไขเสร็จสิ้น
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-10 py-3 border border-neutral-900 text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all"
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
