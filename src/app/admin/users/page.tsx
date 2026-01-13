"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  FilterX,
  Loader2,
  Shield,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";

import UserTable from "@/components/UserTable";
import UserModal from "@/components/UserModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { userService, User } from "@/services/userService";

type RoleFilter = "all" | "ADMIN" | "IT" | "USER";

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- States ---
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Initial State from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>((searchParams.get("role") as RoleFilter) || "all");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);

  // Modal & Notification States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const LIMIT = 10;
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Utilities ---
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateURL = useCallback((params: { q?: string; role?: string; page?: number }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (params.q !== undefined) params.q ? newParams.set("q", params.q) : newParams.delete("q");
    if (params.role !== undefined) params.role !== "all" ? newParams.set("role", params.role) : newParams.delete("role");
    if (params.page !== undefined) params.page > 1 ? newParams.set("page", String(params.page)) : newParams.delete("page");
    
    router.push(`${pathname}?${newParams.toString()}`);
  }, [searchParams, pathname, router]);

  // --- Data Fetching ---
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getAllUsers({
        page: currentPage,
        limit: LIMIT,
        search: searchQuery,
        role: roleFilter === "all" ? undefined : roleFilter,
      });
      setUsers(response.data);
      if (response.pagination) {
          setTotalUsers(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
      } else {
           // Fallback if pagination is missing in some API responses
           setTotalUsers(response.data.length);
      }

    } catch (err: any) {
      showNotification("error", "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, fetchUsers]);

  // Derived Stats (Calculated from current data or separate API if needed)
  // Note: For accurate total counts across the DB, we might need a separate API endpoint "/users/stats".
  // For now, we simulate or rely on pagination.total for Total Users.
  // Ideally, stats should come from the backend. Since we don't have that endpoint yet, 
  // we'll display what we can, or just the Total Users from pagination.
  // Wait, IT page does client-side filtering on a potentially limited dataset or fetches specific roles?
  // IT Page fetches `roles=USER,IT` and then filters. Admin fetches paginated.
  // We can't easily get counts for Admin/IT/User without a stats API if paginated.
  // I will assume for now we just show Total Users, or remove the accurate breakdown until backend supports it.
  // However, I will add the UI placeholders. *Self-correction*: I'll stick to Total Users for now to be safe,
  // or implies we need to fetch all for stats (bad for performance).
  // Let's implement the UI but maybe just show Total for now, or assume the backend *could* return stats.
  // Actually, I'll just use the `totalUsers` for the main card, and maybe hide the others or leave them as "-" if unknown.
  // Better yet, I will NOT render the specific counts if I don't have them, to avoid misleading info.
  // But wait, the IT page does `users.filter(...)`. It fetches *all* relevant users?
  // IT page: `apiFetch("/users?roles=USER,IT")`. It seems it might be fetching *all* of them if pagination isn't default?
  // userService.getAllUsers defaults to page=1, limit=10.
  // So IT page is likely only seeing the first page or the API behaves differently.
  // Let's stick to the Admin pattern: Server-side pagination.
  // I will create a stats section that just highlights the "Total Users" for now, styled nicely.

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    searchTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
      updateURL({ q: val, page: 1 });
      // fetchUsers triggered by useEffect
    }, 500);
  };

  const handleRoleChange = (role: RoleFilter) => {
    setRoleFilter(role);
    setCurrentPage(1);
    updateURL({ role, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page });
  };

  // --- CRUD Actions ---
  const handleOpenAddModal = () => {
    setSelectedUser(null);
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: Partial<User>) => {
    try {
      if (selectedUser) {
        // Update
        const { ...updateData } = data;
        await userService.updateUser(selectedUser.id, updateData);
        // Password change is separate in userService, or handled in updateUser API?
        // userService.ts has changePassword.
        // UserModal passes `password` in `data`.
        if (data.password) {
             await userService.changePassword(selectedUser.id, data.password);
        }
        showNotification("success", "อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว");
      } else {
        // Create
        await userService.createUser(data);
        showNotification("success", "สร้างผู้ใช้งานใหม่สำเร็จ");
      }
      fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      showNotification("error", err.message || "เกิดข้อผิดพลาดในการบันทึก");
      // throw err; // Don't throw to crash UI
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(deleteUser.id);
      showNotification("success", "ลบผู้ใช้งานสำเร็จ");
      fetchUsers();
      setDeleteUser(null);
    } catch (err: any) {
      showNotification("error", "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setCurrentPage(1);
    router.push(pathname);
    // fetchUsers triggers by useEffect
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">จัดการผู้ใช้งาน</h1>
            <p className="text-slate-500 mt-1">จัดการสิทธิ์และข้อมูลบัญชีในระบบทั้งหมด</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            <UserPlus size={20} />
            เพิ่มผู้ใช้งาน
          </button>
        </div>

        {/* Stats Section (Simplified for Pagination) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="ผู้ใช้งานทั้งหมด" count={totalUsers} icon={<Users className="text-blue-600" />} bgClass="bg-blue-50" />
            
            {/* These are placeholders as we don't have exact counts without fetching all. 
                We could hide them or fetch counts separately. For now, I'll hide specific role counts 
                to avoid inaccuracy, or just show them if we had the data. 
                Let's simplify to just one main card or maybe render them if we decide to fetch stats later.
                I will comment them out for truthfulness.
            */}
             {/* 
            <StatCard label="ผู้ดูแลระบบ" count={0} icon={<Shield className="text-rose-600" />} bgClass="bg-rose-50" />
            <StatCard label="IT Support" count={0} icon={<Shield className="text-purple-600" />} bgClass="bg-purple-50" />
            <StatCard label="ผู้ใช้งานทั่วไป" count={0} icon={<UserIcon className="text-emerald-600" />} bgClass="bg-emerald-50" />
            */}
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-top-4 ${
            notification.type === "success" ? "bg-white border-emerald-100 text-emerald-800" : "bg-white border-red-100 text-red-800"
          }`}>
            {notification.type === "success" ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Filters & Content Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล หรือไอดีผู้ใช้..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl outline-none transition-all text-slate-900 placeholder-slate-400 text-sm font-medium"
                />
             </div>
             <div className="flex gap-3">
                 <select
                  value={roleFilter}
                  onChange={(e) => handleRoleChange(e.target.value as RoleFilter)}
                  className="px-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none text-sm cursor-pointer"
                >
                  <option value="all">ทุกบทบาท</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                  <option value="IT">IT Support</option>
                  <option value="USER">ผู้ใช้งานทั่วไป</option>
                </select>
                <button
                  onClick={resetFilters}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="ล้างค่าการกรอง"
                >
                  <FilterX size={20} />
                </button>
                 <button
                  onClick={() => fetchUsers()}
                  disabled={isLoading}
                  className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
             </div>
          </div>

          {/* Table Section */}
          <div className="relative min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
              </div>
            )}
            
            <UserTable
              users={users}
              isLoading={isLoading}
              onView={(u) => { setSelectedUser(u); setIsViewOnly(true); setIsModalOpen(true); }}
              onEdit={(u) => { setSelectedUser(u); setIsViewOnly(false); setIsModalOpen(true); }}
              onDelete={setDeleteUser}
            />

            {/* Empty State */}
            {!isLoading && users.length === 0 && (
              <div className="py-24 text-center">
                <div className="inline-flex p-5 bg-slate-50 rounded-full mb-4">
                  <Search size={40} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 text-lg font-bold">ไม่พบข้อมูลผู้ใช้งาน</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาของคุณ
                </p>
                <button onClick={resetFilters} className="mt-6 text-indigo-600 font-semibold hover:underline">
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
            <p className="text-sm text-slate-500">
              กำลังแสดง <span className="font-semibold text-slate-900">{users.length > 0 ? (currentPage - 1) * LIMIT + 1 : 0}</span> ถึง{" "}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * LIMIT, totalUsers)}</span> จาก{" "}
              <span className="font-semibold text-slate-900">{totalUsers}</span> รายการ
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all hover:shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Simplified Logic: Show first, last, current, and surrounding
                  if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                     if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                     return null;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "hover:bg-white text-slate-600 border border-transparent hover:border-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all hover:shadow-sm"
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
          onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
          onSave={handleSaveUser}
        />

        <ConfirmDialog
          isOpen={!!deleteUser}
          title="ยืนยันการลบผู้ใช้งาน"
          message={`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${deleteUser?.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ยืนยันลบข้อมูล"
          isDanger
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteUser(null)}
        />
      </div>
    </div>
  );
}

function StatCard({ label, count, icon, bgClass }: { label: string; count: number; icon: React.ReactNode; bgClass: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{count}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
}