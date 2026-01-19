"use client";

import React from "react";
import {
  X,
  MapPin,
  User,
  Phone,
  Building2,
  ArrowRight,
  Check,
  Edit3,
} from "lucide-react";
import { RepairTicket, RepairStatus } from "./types/repair.types";
import { safeFormat } from "@/lib/date-utils";

/* ------------------ MAPS ------------------ */

const STATUS_MAP: Record<RepairStatus, string> = {
  [RepairStatus.PENDING]: "รอดำเนินการ",
  [RepairStatus.IN_PROGRESS]: "กำลังดำเนินการ",
  [RepairStatus.WAITING_PARTS]: "รออะไหล่",
  [RepairStatus.COMPLETED]: "เสร็จสิ้น",
  [RepairStatus.CANCELLED]: "ยกเลิก",
};

const CATEGORY_MAP: Record<string, string> = {
  HARDWARE: "ฮาร์ดแวร์",
  SOFTWARE: "ซอฟต์แวร์",
  NETWORK: "เครือข่าย",
  PERIPHERAL: "อุปกรณ์ต่อพ่วง",
  EMAIL_OFFICE365: "Email / Office 365",
  ACCOUNT_PASSWORD: "Account / Password",
  OTHER: "ทั่วไป / อื่นๆ",
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

/* ------------------ UTILS ------------------ */

const normalizeKey = (value?: string) =>
  value?.trim().toUpperCase().replace(/[\s-]/g, "_");

/* ------------------ SUB COMPONENT ------------------ */

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50">
    <div className="flex items-center gap-3 text-slate-400">
      <Icon size={14} strokeWidth={1.5} />
      <span className="text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
    <span className="text-sm font-semibold text-slate-900 text-right">
      {value || "-"}
    </span>
  </div>
);

/* ------------------ MAIN COMPONENT ------------------ */

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

  const translatedStatus = STATUS_MAP[repair.status];
  const translatedCategory =
    CATEGORY_MAP[normalizeKey(repair.problemCategory) || ""] || "ทั่วไป";

  const translatedDepartment =
    DEPARTMENT_MAP[normalizeKey(repair.reporterDepartment) || ""] || "-";

  const isCompleted = repair.status === RepairStatus.COMPLETED;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-widest text-slate-400">
              รหัสรายการ: {repair.ticketCode}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 font-bold tracking-wider border ${
                isCompleted
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {translatedStatus}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 hover:rotate-90 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
          {/* MAIN */}
          <div className="md:col-span-7 p-8 border-b md:border-b-0 md:border-r border-slate-100 space-y-10">
            <section className="space-y-4">
              <h1 className="text-3xl font-light text-slate-900">
                {repair.problemTitle}
              </h1>
              <p className="text-slate-500 text-lg">
                {repair.problemDescription || "ไม่มีคำอธิบายเพิ่มเติม"}
              </p>
            </section>

            <section className="grid grid-cols-2 gap-y-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                  สถานที่
                </p>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <MapPin size={14} className="text-slate-300" />
                  {repair.location}
                </div>
              </div>
            </section>

            <section className="pt-6 border-t border-slate-100 flex gap-8">
              <div>
                <p className="text-xs text-slate-400">วันที่สร้าง</p>
                <p className="text-sm">
                  {safeFormat(repair.createdAt, "dd MMM yyyy · HH:mm")}
                </p>
              </div>
              <ArrowRight size={16} className="text-slate-200 mt-5" />
              <div>
                <p className="text-xs text-slate-400">อัปเดตล่าสุด</p>
                <p className="text-sm">
                  {safeFormat(
                    repair.updatedAt || repair.createdAt,
                    "dd MMM yyyy · HH:mm",
                  )}
                </p>
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <div className="md:col-span-5 p-8 space-y-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
              ผู้แจ้งซ่อม
            </p>
            <InfoRow
              icon={User}
              label="ชื่อผู้แจ้ง"
              value={repair.reporterName}
            />
            <InfoRow
              icon={Phone}
              label="เบอร์โทร"
              value={repair.reporterPhone}
            />
            <InfoRow
              icon={Building2}
              label="แผนก"
              value={translatedDepartment}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          {!isCompleted ? (
            <>
              <button
                onClick={onEdit}
                className="px-8 py-3 border text-xs font-bold tracking-widest hover:bg-slate-50"
              >
                <Edit3 size={14} className="inline mr-2" />
                แก้ไข
              </button>
              <button
                onClick={() => onComplete(repair.id)}
                disabled={submitting}
                className="px-10 py-3 bg-blue-600 text-white text-xs font-bold tracking-widest disabled:bg-slate-300"
              >
                {submitting ? "กำลังบันทึก..." : "ปิดงาน"}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-10 py-3 border font-bold text-xs tracking-widest hover:bg-slate-900 hover:text-white"
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
