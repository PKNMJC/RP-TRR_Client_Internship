"use client";

import { User } from "@/services/userService";
import { Trash2, ChevronRight, Loader2 } from "lucide-react";

interface UserTableProps {
  users: User[];
  onView?: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
}

export default function UserTable({
  users,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl border border-slate-100">
        <Loader2 className="animate-spin text-slate-300 mb-2" size={32} />
        <p className="text-slate-400 text-sm font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-slate-100">
        <p className="text-slate-400 font-medium">
          ไม่พบรายชื่อผู้ใช้งานในระบบ
        </p>
      </div>
    );
  }

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "IT":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "ผู้ดูแลระบบ",
      IT: "ทีมไอที",
      USER: "ผู้ใช้งาน",
    };
    return labels[role] || role;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              ชื่อ-นามสกุล
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              ข้อมูลติดต่อ
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              บทบาท
            </th>
            <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              ส่ง/รับงาน
            </th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {users.map((user) => (
            <tr
              key={user.id}
              className="group hover:bg-slate-50/80 transition-all duration-200"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-semibold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-400">
                  {user.department || "ไม่ระบุแผนก"}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-600">{user.email}</div>
                <div className="text-xs text-slate-400">
                  {user.phoneNumber || "-"}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${getRoleStyle(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="text-sm font-semibold text-slate-700">
                  {user._count?.tickets || 0} /{" "}
                  <span className="text-indigo-600">
                    {user._count?.assigned || 0}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-medium text-sm"
                  >
                    {/* จัดการ */}
                    <ChevronRight
                      size={18}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="ลบ"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
