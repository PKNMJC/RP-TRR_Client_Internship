"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Shield,
  Trash2,
  Edit2,
  Filter,
  RefreshCw,
  MessageCircle,
  Mail,
  Phone,
  User as UserIcon,
  Users
} from "lucide-react";
import UserModal from "@/components/UserModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { userService, User } from "@/services/userService";

type RoleFilter = "all" | "ADMIN" | "IT" | "USER";

export default function AdminUsersPage() {
  // --- States ---
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const LIMIT = 10;

  // --- Actions ---
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const response = await userService.getAllUsers(page, LIMIT);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalUsers(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err: any) {
      showNotification("error", err.message || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.lineUserId && user.lineUserId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleSaveUser = async (data: Partial<User>) => {
    if (!selectedUser) return;
    try {
      const { password, ...userDataWithoutPassword } = data;

      // Update user information
      await userService.updateUser(selectedUser.id, userDataWithoutPassword);

      // Change password if provided
      if (password) {
        await userService.changePassword(selectedUser.id, password);
      }

      showNotification("success", "อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว");
      fetchUsers(currentPage);
      setIsModalOpen(false);
    } catch (err: any) {
      showNotification("error", err.message || "ไม่สามารถบันทึกข้อมูลได้");
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(deleteUser.id);
      showNotification("success", "ลบผู้ใช้งานสำเร็จ");
      fetchUsers(currentPage);
      setDeleteUser(null);
    } catch (err: any) {
      showNotification("error", "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
            <Shield size={12} />
            ผู้ดูแลระบบ
          </span>
        );
      case "IT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Users size={12} />
            ฝ่ายไอที
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <UserIcon size={12} />
            ผู้ใช้งานทั่วไป
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center text-white transform hover:scale-105 transition-transform duration-300">
              <Users size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                จัดการผู้ใช้งาน
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                จัดการข้อมูลสมาชิกและสิทธิ์การเข้าถึงระบบ
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
             {/* Future Add User Button can go here if needed, currently reusing logic from IT page or keeping it simple */}
          </div>
        </div>

        {/* Floating Notification */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md ${
              notification.type === "success"
                ? "bg-white/90 border-emerald-100 text-emerald-800"
                : "bg-white/90 border-red-100 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <div className="bg-emerald-100 p-1.5 rounded-full">
                <CheckCircle2 className="text-emerald-600" size={18} />
              </div>
            ) : (
              <div className="bg-red-100 p-1.5 rounded-full">
                <AlertCircle className="text-red-600" size={18} />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{notification.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"}</p>
              <p className="text-xs opacity-90">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Filters & Actions Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm sticky top-4 z-20 backdrop-blur-xl bg-white/80">
          <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 hover:bg-white"
                placeholder="ค้นหาชื่อไลน์, ไอดีไลน์, อีเมล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "ADMIN", label: "ผู้ดูแล" },
                  { id: "IT", label: "ไอที" },
                  { id: "USER", label: "ทั่วไป" },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setRoleFilter(role.id as RoleFilter)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      roleFilter === role.id
                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
              
              <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

              <button
                onClick={() => fetchUsers(currentPage)}
                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw
                  size={20}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 rounded-tl-2xl">ชื่อไลน์ (Display Name)</th>
                  <th className="px-6 py-4">ไอดีไลน์ (LINE ID)</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4">ข้อมูลติดต่ออื่นๆ</th>
                   <th className="px-6 py-4 text-right rounded-tr-2xl">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded-lg"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-8 w-32 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-8 w-16 bg-slate-100 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="text-slate-300" size={40} />
                      </div>
                      <h3 className="text-slate-900 font-medium text-lg">ไม่พบข้อมูลผู้ใช้งาน</h3>
                      <p className="text-slate-500 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="group hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white
                            ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-600' : 
                              user.role === 'IT' ? 'bg-indigo-100 text-indigo-600' : 
                              'bg-emerald-100 text-emerald-600'}`}>
                            {(user.name || user.displayName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{user.name}</div>
                            {user.displayName && user.name !== user.displayName && (
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <span className="opacity-70">Line:</span>
                                    <span>{user.displayName}</span>
                                </div>
                            )}
                            <div className="text-xs text-slate-500 font-medium mt-0.5">Department: {user.department || "-"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {user.lineId && (
                             <div className="flex items-center gap-2 mb-1">
                               <MessageCircle size={16} className="text-[#06C755]" />
                               <span className="font-semibold text-slate-700">{user.lineId}</span>
                             </div>
                          )}
                          {user.lineUserId ? (
                             <span className={`text-xs font-mono px-2 py-0.5 rounded w-fit ${user.lineId ? 'text-slate-400 bg-slate-50' : 'text-[#06C755] bg-[#06C755]/10 font-semibold'}`}>
                               {user.lineUserId}
                             </span>
                          ) : (
                             !user.lineId && <span className="text-slate-400 text-sm italic">ยังไม่ระบุ</span>
                          )}
                        </div>
                      </td>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                               <Mail size={14} className="text-slate-400" />
                               <span>{user.email}</span>
                            </div>
                            {user.phoneNumber && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Phone size={14} className="text-slate-400" />
                                  <span>{user.phoneNumber}</span>
                                </div>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsViewOnly(false);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="แก้ไข"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteUser(user)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="ลบ"
                              >
                                <Trash2 size={18} />
                              </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-sm">
            <div className="text-slate-500">
              แสดง <span className="font-medium text-slate-900">{(currentPage - 1) * LIMIT + 1}</span> ถึง <span className="font-medium text-slate-900">{Math.min(currentPage * LIMIT, totalUsers)}</span> จาก <span className="font-medium text-slate-900">{totalUsers}</span> รายการ
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                 {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    // Simple pagination logic for display
                    let pageNum = i + 1;
                    if(totalPages > 5 && currentPage > 3) {
                       pageNum = currentPage - 3 + i;
                       if (pageNum > totalPages) pageNum = totalPages - (5 - i - 1); // Adjust if near end
                    }
                    
                    return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                    )
                 })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <UserModal
          user={selectedUser}
          isOpen={isModalOpen}
          isViewOnly={isViewOnly}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
        />

        <ConfirmDialog
          isOpen={!!deleteUser}
          title="ยืนยันการลบสมาชิก"
          message={`คุณต้องการลบผู้ใช้ "${deleteUser?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้`}
          confirmText="ลบสมาชิก"
          isDanger
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteUser(null)}
        />
      </div>
    </div>
  );
}
