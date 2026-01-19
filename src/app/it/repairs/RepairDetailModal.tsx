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

const DEPARTMENT_MAP: Record<string, string> = {
  ACCOUNTING: "บัญชี",
  SALES: "การขาย",
  PRODUCTION: "ฝ่ายผลิต",
  IT: "ไอที",
  HR: "บุคคล",
  MAINTENANCE: "ซ่อมบำรุง",
  OTHER: "อื่นๆ",
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

  const translatedDepartment =
    DEPARTMENT_MAP[repair.reporterDepartment?.toUpperCase() || ""] ||
    repair.reporterDepartment ||
    "-";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-4xl max-h-[95vh] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* HEADER: Minimal & Clean */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs font-medium tracking-widest text-slate-400 uppercase">
              รหัสรายการ: {repair.ticketCode}
            </span>
            <div
              className={`text-[10px] px-2 py-0.5 border font-bold uppercase tracking-wider ${
                repair.status === "COMPLETED"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {translatedStatus}
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:rotate-90 transition-transform duration-200 text-slate-400 hover:text-slate-900"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* MAIN CONTENT (Col: 7) */}
            <div className="md:col-span-7 p-6 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100">
              <div className="space-y-10">
                {/* Title & Description */}
                <section className="space-y-4">
                  <h1 className="text-3xl md:text-4xl font-light text-slate-900 leading-tight tracking-tight">
                    {repair.problemTitle}
                  </h1>
                  <p className="text-slate-500 leading-relaxed text-lg font-light">
                    {repair.problemDescription || "ไม่มีคำอธิบายเพิ่มเติม"}
                  </p>
                </section>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-8 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                      สถานที่แจ้ง
                    </p>
                    <div className="flex items-center gap-2 text-slate-800">
                      <MapPin size={14} className="text-slate-300" />
                      <span className="text-sm font-medium">
                        {translatedDepartment}{" "}
                        {repair.location ? `· ${repair.location}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                      หมวดหมู่ปัญหา
                    </p>
                    <div className="flex items-center gap-2 text-slate-800">
                      <Tag size={14} className="text-slate-300" />
                      <span className="text-sm font-medium">
                        {translatedCategory}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Simple */}
                <div className="pt-8 border-t border-slate-100 space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    ไทม์ไลน์
                  </p>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">
                        วันที่สร้าง
                      </span>
                      <span className="text-sm text-slate-700">
                        {safeFormat(repair.createdAt, "dd MMM yyyy · HH:mm")}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-slate-200" />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">
                        กิจกรรมล่าสุด
                      </span>
                      <span className="text-sm text-slate-700">
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
            <div className="md:col-span-5 bg-white p-6 sm:p-8 md:p-12">
              <div className="space-y-10">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    ผู้แจ้งซ่อม
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  {/* ชื่อผู้แจ้งซ่อม */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-50">
                    <div className="flex items-center gap-3 text-slate-400">
                      <User size={14} strokeWidth={1.5} />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        ชื่อผู้แจ้งซ่อม
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {repair.reporterName || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-50">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Phone size={14} strokeWidth={1.5} />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        เบอร์โทรศัพท์
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {repair.reporterPhone || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-50">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Building2 size={14} strokeWidth={1.5} />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        แผนก
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 text-right">
                      {translatedDepartment}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-3 justify-end items-center">
          {repair.status !== "COMPLETED" ? (
            <>
              <button
                onClick={onEdit}
                className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-900 text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 size={14} /> แก้ไขข้อมูล
              </button>
              <button
                onClick={() => onComplete(repair.id)}
                disabled={submitting}
                className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
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
              className="px-10 py-3 border border-slate-900 text-slate-900 text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all"
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
