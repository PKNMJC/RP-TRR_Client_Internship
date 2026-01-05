"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import ITSidebar from "@/components/ITSidebar";
import { apiFetch } from "@/services/api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Loader2,
  Users,
  Mail,
  Building2,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "USER" | "IT";
  department: string;
  phoneNumber: string;
  lineId: string;
  createdAt: string;
}

export default function ITUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER" as "USER" | "IT" | "ADMIN",
    department: "",
    phoneNumber: "",
    lineId: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/users");
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchStr =
        `${user.name} ${user.email} ${user.department}`.toLowerCase();
      return (
        searchStr.includes(searchTerm.toLowerCase()) &&
        (filterRole === "all" || user.role === filterRole)
      );
    });
  }, [users, searchTerm, filterRole]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      its: users.filter((u) => u.role === "IT").length,
      users: users.filter((u) => u.role === "USER").length,
    }),
    [users]
  );

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
      department: "",
      phoneNumber: "",
      lineId: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordError("");
  };

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
    }
    if (!/[A-Z]/.test(password)) {
      return "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่";
    }
    if (!/[a-z]/.test(password)) {
      return "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก";
    }
    if (!/[0-9]/.test(password)) {
      return "รหัสผ่านต้องมีตัวเลข";
    }
    return "";
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("กรุณากรอกข้อมูลจำเป็น: ชื่อ, อีเมล, รหัสผ่าน");
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          phoneNumber: formData.phoneNumber,
          lineId: formData.lineId,
        }),
      });

      alert("เพิ่มผู้ใช้สำเร็จ");
      resetForm();
      setShowModal(false);
      await fetchUsers();
    } catch (err) {
      console.error("Error:", err);
      alert("เกิดข้อผิดพลาดในการเพิ่มผู้ใช้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      alert("กรุณากรอกข้อมูลจำเป็น");
      return;
    }

    // หากมีการป้อนรหัสผ่านใหม่ ให้ validate
    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (passwordValidation) {
        setPasswordError(passwordValidation);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setPasswordError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
    }

    try {
      setSubmitting(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        lineId: formData.lineId,
      };

      // เพิ่มรหัสผ่านใหม่เฉพาะเมื่อมีการป้อน
      if (formData.password) {
        updateData.password = formData.password;
      }

      await apiFetch(`/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      alert("อัปเดตผู้ใช้สำเร็จ");
      resetForm();
      setShowDetailModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("ลบผู้ใช้นี้ใช่หรือไม่?")) return;

    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      fetchUsers();
      alert("ลบผู้ใช้สำเร็จ");
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      department: user.department,
      phoneNumber: user.phoneNumber,
      lineId: user.lineId,
    });
    setPasswordError("");
    setShowDetailModal(true);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-white flex">
      <ITSidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-black">จัดการผู้ใช้</h1>
              <p className="text-gray-600 font-medium mt-2">
                ดูแลและจัดการบัญชีผู้ใช้ในระบบทั้งหมด
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-black hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Plus size={20} strokeWidth={2} />
              เพิ่มผู้ใช้ใหม่
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="ผู้ใช้ทั้งหมด"
              count={stats.total}
              icon={<Users />}
            />
            <StatCard label="ผู้ดูแล" count={stats.admins} icon={<Users />} />
            <StatCard label="ทีม IT" count={stats.its} icon={<Users />} />
            <StatCard
              label="ผู้ใช้ทั่วไป"
              count={stats.users}
              icon={<Users />}
            />
          </div>

          {/* Search & Table Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล, แผนก..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-black focus:outline-none focus:ring-2 focus:ring-gray-400/20 text-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">ทุกบทบาท</option>
                <option value="ADMIN">ผู้ดูแล</option>
                <option value="IT">ทีม IT</option>
                <option value="USER">ผู้ใช้ทั่วไป</option>
              </select>
              <button
                onClick={fetchUsers}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      ชื่อ
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      อีเมล
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      บทบาท
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      แผนก
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      เบอร์โทร
                    </th>
                    <th className="px-6 py-3 border-b border-gray-100"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-black">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {user.department || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {user.phoneNumber || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(user)}
                            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                            title="แก้ไข"
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <EmptyState />}
            </div>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">
                เพิ่มผู้ใช้ใหม่
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="ชื่อ-นามสกุล"
                  required
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  placeholder="ชื่อผู้ใช้"
                />
                <FormInput
                  label="อีเมล"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                  placeholder="example@email.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setPasswordError("");
                      }}
                      placeholder="ตั้งรหัสผ่าน"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
                        setPasswordError("");
                      }}
                      placeholder="ยืนยันรหัสผ่าน"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{passwordError}</p>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-semibold mb-2">
                  ✓ ข้อกำหนดรหัสผ่าน:
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• ความยาวอย่างน้อย 8 ตัวอักษร</li>
                  <li>• มีตัวอักษรพิมพ์ใหญ่ (A-Z)</li>
                  <li>• มีตัวอักษรพิมพ์เล็ก (a-z)</li>
                  <li>• มีตัวเลข (0-9)</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    บทบาท
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium text-sm"
                  >
                    <option value="USER">ผู้ใช้ทั่วไป</option>
                    <option value="IT">ทีม IT</option>
                    <option value="ADMIN">ผู้ดูแล</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="แผนก"
                  value={formData.department}
                  onChange={(v) => setFormData({ ...formData, department: v })}
                  placeholder="IT, Marketing, etc."
                />
                <FormInput
                  label="เบอร์โทรศัพท์"
                  value={formData.phoneNumber}
                  onChange={(v) => setFormData({ ...formData, phoneNumber: v })}
                  placeholder="08x-xxx-xxxx"
                />
              </div>

              <FormInput
                label="Line ID"
                value={formData.lineId}
                onChange={(v) => setFormData({ ...formData, lineId: v })}
                placeholder="@username"
              />
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleAddUser}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Plus size={16} />
                )}
                เพิ่มผู้ใช้
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">แก้ไขผู้ใช้</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="ชื่อ-นามสกุล"
                  required
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                />
                <FormInput
                  label="อีเมล"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    รหัสผ่านใหม่ (ไม่บังคับ)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setPasswordError("");
                      }}
                      placeholder="ป้อนรหัสผ่านใหม่เพื่อเปลี่ยน"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    ยืนยันรหัสผ่าน (ไม่บังคับ)
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
                        setPasswordError("");
                      }}
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{passwordError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    บทบาท
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium text-sm"
                  >
                    <option value="USER">ผู้ใช้ทั่วไป</option>
                    <option value="IT">ทีม IT</option>
                    <option value="ADMIN">ผู้ดูแล</option>
                  </select>
                </div>
                <FormInput
                  label="แผนก"
                  value={formData.department}
                  onChange={(v) => setFormData({ ...formData, department: v })}
                  placeholder="IT, Marketing, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="เบอร์โทรศัพท์"
                  value={formData.phoneNumber}
                  onChange={(v) => setFormData({ ...formData, phoneNumber: v })}
                  placeholder="08x-xxx-xxxx"
                />
                <FormInput
                  label="Line ID"
                  value={formData.lineId}
                  onChange={(v) => setFormData({ ...formData, lineId: v })}
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleEditUser}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Edit2 size={16} />
                )}
                บันทึก
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- UI Components ---

function FormInput({
  label,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-black mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm"
      />
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const config: any = {
    ADMIN: { label: "ผู้ดูแล", class: "bg-red-50 text-red-700 border-red-200" },
    IT: { label: "ทีม IT", class: "bg-blue-50 text-blue-700 border-blue-200" },
    USER: {
      label: "ผู้ใช้ทั่วไป",
      class: "bg-gray-50 text-gray-700 border-gray-200",
    },
  };
  const active = config[role] || config.USER;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${active.class}`}
    >
      {active.label}
    </span>
  );
}

function StatCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col">
        <span className="text-gray-600 text-xs font-semibold uppercase">
          {label}
        </span>
        <span className="text-3xl font-bold text-black mt-2">{count}</span>
      </div>
      <div className="absolute -right-2 -bottom-2 opacity-10 scale-[2] pointer-events-none">
        {icon}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-4">
      <div className="w-10 h-10 border-3 border-gray-200 border-t-black rounded-full animate-spin"></div>
      <p className="font-semibold text-black text-sm uppercase">
        Loading Records...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <Users size={48} className="text-gray-300 mb-4" />
      <h3 className="text-black font-bold text-lg">ไม่พบผู้ใช้</h3>
      <p className="text-gray-600 font-medium mt-2 text-sm">
        เริ่มต้นโดยการคลิกปุ่ม 'เพิ่มผู้ใช้ใหม่'
      </p>
    </div>
  );
}
