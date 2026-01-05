"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Filter,
  RefreshCcw,
  UserPlus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import UserTable from "@/components/UserTable";
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

  // Logic การกรองข้อมูล (Client-side filtering ตัวอย่าง)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                จัดการการผู้ใช้งาน
              </h1>
              <p className="text-slate-500 text-sm">
                จัดการสิทธิ์และข้อมูลผู้ใช้งานในระบบ
              </p>
            </div>
          </div>
        </div>

        {/* Floating Notification */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-top-4 ${
              notification.type === "success"
                ? "bg-white border-emerald-100 text-emerald-800"
                : "bg-white border-red-100 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="text-emerald-500" size={20} />
            ) : (
              <AlertCircle className="text-red-500" size={20} />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px] relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                {[
                  { value: "all" as RoleFilter, label: "ทั้งหมด" },
                  { value: "ADMIN" as RoleFilter, label: "แอดมิน" },
                  { value: "IT" as RoleFilter, label: "IT" },
                  { value: "USER" as RoleFilter, label: "ผู้ใช้งาน" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setRoleFilter(value)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      roleFilter === value
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchUsers(currentPage)}
                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCcw
                  size={20}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            <UserTable
              users={filteredUsers}
              isLoading={isLoading}
              onView={(u) => {
                setSelectedUser(u);
                setIsViewOnly(true);
                setIsModalOpen(true);
              }}
              onEdit={(u) => {
                setSelectedUser(u);
                setIsViewOnly(false);
                setIsModalOpen(true);
              }}
              onDelete={setDeleteUser}
            />

            {/* Empty State */}
            {!isLoading && filteredUsers.length === 0 && (
              <div className="py-20 text-center">
                <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                  <Search size={32} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-semibold">
                  ไม่พบข้อมูลผู้ใช้งาน
                </h3>
                <p className="text-slate-500">
                  ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่อีกครั้ง
                </p>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              แสดง{" "}
              <span className="font-semibold text-slate-900">
                {(currentPage - 1) * LIMIT + 1}
              </span>{" "}
              ถึง{" "}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * LIMIT, totalUsers)}
              </span>{" "}
              จาก{" "}
              <span className="font-semibold text-slate-900">{totalUsers}</span>{" "}
              ผู้ใช้งาน
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={20} />
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
          title="ยืนยันการลบผู้ใช้งาน"
          message={`คุณต้องการลบผู้ใช้ "${deleteUser?.name}" ใช่หรือไม่? ข้อมูลนี้จะหายไปจากระบบทันที`}
          confirmText="ลบข้อมูล"
          isDanger
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteUser(null)}
        />
      </div>
    </div>
  );
}
