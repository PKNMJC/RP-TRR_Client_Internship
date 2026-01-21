import React from "react";
import {
  X,
  Save,
  AlertCircle,
  MapPin,
  User as UserIcon,
  Building2,
} from "lucide-react";
import { User } from "./types/repair.types";

interface RepairEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (form: any) => void;
  editForm: {
    title: string;
    description: string;
    priority: string;
    assigneeId: string;
    location: string;
    reporterDepartment: string;
  };
  setEditForm: (form: any) => void;
  itStaff: User[];
  submitting: boolean;
}

export const RepairEditModal: React.FC<RepairEditModalProps> = ({
  show,
  onClose,
  onSave,
  editForm,
  setEditForm,
  itStaff,
  submitting,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              แก้ไขข้อมูลงานซ่อม
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Update Repair Ticket Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Title Field - Full Width */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              <AlertCircle size={12} className="text-blue-500" />
              หัวข้อแจ้งซ่อม
            </label>
            <input
              type="text"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
              value={editForm.title}
              placeholder="ระบุหัวข้อที่ต้องการแจ้งซ่อม"
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <Building2 size={12} className="text-blue-500" />
                แผนกผู้แจ้ง
              </label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                value={editForm.reporterDepartment}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    reporterDepartment: e.target.value,
                  })
                }
                placeholder="เช่น แผนกไอที, บัญชี"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                ความสำคัญ
              </label>
              <div className="relative">
                <select
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold appearance-none text-slate-900 transition-all"
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm({ ...editForm, priority: e.target.value })
                  }
                >
                  <option value="CRITICAL">ด่วนมาก (Critical)</option>
                  <option value="URGENT">ด่วน (Urgent)</option>
                  <option value="NORMAL">ปกติ (Normal)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <AlertCircle size={16} />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <MapPin size={12} className="text-blue-500" />
                สถานที่แจ้ง
              </label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                placeholder="เช่น ชั้น 2, ห้อง IT"
              />
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <UserIcon size={12} className="text-blue-500" />
                ผู้รับผิดชอบ
              </label>
              <div className="relative">
                <select
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold appearance-none text-slate-900 transition-all"
                  value={editForm.assigneeId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assigneeId: e.target.value })
                  }
                >
                  <option value="">- มอบหมายงานให้ -</option>
                  {itStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}{" "}
                      {staff.department ? `(${staff.department})` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <UserIcon size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              รายละเอียด
            </label>
            <textarea
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium h-36 resize-none text-slate-900 transition-all placeholder:text-slate-300"
              value={editForm.description}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 sm:px-8 border-t border-slate-50 bg-white flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="order-2 sm:order-1 flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-mono text-slate-500"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onSave(editForm)}
            disabled={submitting}
            className="order-1 sm:order-2 flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-blue-500/20"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>
    </div>
  );
};
