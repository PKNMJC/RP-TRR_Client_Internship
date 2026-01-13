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

        {/* Users List - Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-100 rounded"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserIcon className="text-slate-300" size={32} />
              </div>
              <h3 className="text-slate-900 font-medium">ไม่พบข้อมูลผู้ใช้งาน</h3>
              <p className="text-slate-500 text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div 
                key={user.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm
                      ${user.role === 'ADMIN' ? 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600' : 
                        user.role === 'IT' ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600' : 
                        'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600'}`}>
                      {(user.displayName || user.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{user.displayName || user.name}</span>
                        {getRoleBadge(user.role)}
                      </div>
                      {user.department && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-500 border border-slate-200">
                          {user.department}
                        </span>
                      )}
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                        {user.displayName && user.name !== user.displayName && (
                          <div className="text-slate-400">ชื่อระบบ: {user.name}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsViewOnly(false);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => setDeleteUser(user)}
                    className="flex-1 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Users Table - Desktop View */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 rounded-tl-2xl w-full">ชื่อผู้แจ้ง (Name)</th>
                  <th className="px-6 py-4 whitespace-nowrap">สถานะ</th>
                   <th className="px-6 py-4 text-right rounded-tr-2xl whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-12 w-64 bg-slate-100 rounded-lg"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-8 w-16 bg-slate-100 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center">
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
                          <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm ring-4 ring-white
                            ${user.role === 'ADMIN' ? 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600' : 
                              user.role === 'IT' ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600' : 
                              'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600'}`}>
                            {(user.displayName || user.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-base">{user.displayName || user.name}</span>
                                {user.department && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-500 border border-slate-200">
                                        {user.department}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5 ">
                                    <Mail size={12} className="text-slate-400" />
                                    {user.email}
                                </span>
                                {user.phoneNumber && (
                                    <span className="flex items-center gap-1.5 opacity-75">
                                        <Phone size={12} className="text-slate-400" />
                                        {user.phoneNumber}
                                    </span>
                                )}
                            </div>

                            {user.displayName && user.name !== user.displayName && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-xs text-slate-400">ชื่อระบบ: {user.name}</span>
                                </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsViewOnly(false);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="แก้ไข"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteUser(user)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
        </div>

        {/* Pagination - Responsive */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-slate-500 text-center sm:text-left">
            <span className="hidden sm:inline">แสดง </span>
            <span className="font-medium text-slate-900">{(currentPage - 1) * LIMIT + 1}</span>
            <span className="hidden sm:inline"> ถึง </span>
            <span className="sm:hidden">-</span>
            <span className="font-medium text-slate-900">{Math.min(currentPage * LIMIT, totalUsers)}</span>
            <span className="hidden sm:inline"> จาก </span>
            <span className="sm:hidden"> / </span>
            <span className="font-medium text-slate-900">{totalUsers}</span>
            <span className="hidden sm:inline"> รายการ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
               {/* Show fewer page buttons on mobile */}
               {[...Array(Math.min(3, totalPages))].map((_, i) => {
                  let pageNum = i + 1;
                  if(totalPages > 3 && currentPage > 2) {
                     pageNum = currentPage - 1 + i;
                     if (pageNum > totalPages) pageNum = totalPages - (3 - i - 1);
                  }
                  
                  return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all sm:hidden ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                  )
               })}
               {/* Show more page buttons on desktop */}
               {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = i + 1;
                  if(totalPages > 5 && currentPage > 3) {
                     pageNum = currentPage - 3 + i;
                     if (pageNum > totalPages) pageNum = totalPages - (5 - i - 1);
                  }
                  
                  return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all hidden sm:block ${
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
