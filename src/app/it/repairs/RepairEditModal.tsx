import React from "react";
import { X, Save } from "lucide-react";
import { RepairTicket, User } from "./types/repair.types";

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
    problemCategory: string;
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
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            แก้ไขข้อมูลงานซ่อม
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              หัวข้อแจ้งซ่อม
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              แผนกผู้แจ้ง
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
              value={editForm.reporterDepartment}
              onChange={(e) =>
                setEditForm({ ...editForm, reporterDepartment: e.target.value })
              }
              placeholder="เช่น แผนกไอที, บัญชี"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              ความสำคัญ
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none text-slate-900"
              value={editForm.priority}
              onChange={(e) =>
                setEditForm({ ...editForm, priority: e.target.value })
              }
            >
              <option value="CRITICAL">ด่วนมาก (Critical)</option>
              <option value="URGENT">ด่วน (Urgent)</option>
              <option value="NORMAL">ปกติ (Normal)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              หมวดหมู่ปัญหา (ประเภท)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
              value={editForm.problemCategory}
              onChange={(e) =>
                setEditForm({ ...editForm, problemCategory: e.target.value })
              }
              placeholder="เช่น Hardware, Software, Network"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              สถานที่แจ้ง
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-bold dark:text-white"
              value={editForm.location}
              onChange={(e) =>
                setEditForm({ ...editForm, location: e.target.value })
              }
              placeholder="เช่น ชั้น 2, ห้อง IT"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              ผู้รับผิดชอบ
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none text-slate-900"
              value={editForm.assigneeId}
              onChange={(e) =>
                setEditForm({ ...editForm, assigneeId: e.target.value })
              }
            >
              <option value="">- มอบหมายงานให้ -</option>
              {itStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} {staff.department ? `(${staff.department})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              รายละเอียด
            </label>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium h-32 resize-none text-slate-900"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-mono text-slate-700"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onSave(editForm)}
            disabled={submitting}
            className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            <Save size={18} />
            {submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>
    </div>
  );
};
