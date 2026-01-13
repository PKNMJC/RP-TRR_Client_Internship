"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  User as UserIcon,
  Mail,
  Shield,
  Phone,
  Building2,
  MessageCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { User } from "@/services/userService";

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  isViewOnly?: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<void>;
}

export default function UserModal({
  user,
  isOpen,
  isViewOnly = false,
  onClose,
  onSave,
}: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        lineId: user.lineId,
      });
    }
    if (user && isOpen) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        lineId: user.lineId,
				displayName: user.displayName, // Hydrate extra fields for display
				lineUserId: user.lineUserId,
      });
    }
  }, [user, isOpen]);

  const validatePassword = (): boolean => {
    setPasswordError("");

    if (showPasswordSection && passwordData.newPassword) {
      if (passwordData.newPassword.length < 6) {
        setPasswordError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return false;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("รหัสผ่านไม่ตรงกัน");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      if (showPasswordSection && passwordData.newPassword) {
        dataToSave.password = passwordData.newPassword as any;
      }
      await onSave(dataToSave);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses =
    "w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500";
  const labelClasses =
    "text-sm font-bold text-slate-900 ml-1 mb-1.5 flex items-center gap-2";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserIcon size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                แก้ไขข้อมูลผู้ใช้งาน
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase">
                ID: {user?.id || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-7"
        >
          {/* Section 1: Identity */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />{" "}
              ข้อมูลตัวตน
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className={labelClasses}>ชื่อ-นามสกุล</label>
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    className={inputClasses}
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className={labelClasses}>อีเมลแอดเดรส</label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    required
                    className={inputClasses}
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Section 1.5: LINE Info (Read Only) */}
          {(formData.displayName || formData.lineUserId) && (
             <div className="space-y-4">
               <h3 className="text-[11px] font-bold text-[#06C755] uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-[#06C755] rounded-full" />{" "}
                 ข้อมูลจาก LINE
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  {formData.displayName && (
                    <div className="flex flex-col">
                      <label className={labelClasses}>ชื่อไลน์ (Display Name)</label>
                      <div className="relative">
                        <MessageCircle
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#06C755]"
                          size={18}
                        />
                        <input
                          type="text"
                          readOnly
                          className={`${inputClasses} bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed`}
                          value={formData.displayName}
                        />
                      </div>
                    </div>
                  )}
                   {formData.lineUserId && (
                    <div className="flex flex-col">
                      <label className={labelClasses}>LINE User ID</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#06C755] font-mono text-xs font-bold">ID</span>
                        <input
                          type="text"
                          readOnly
                          className={`${inputClasses} bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed font-mono text-xs`}
                          value={formData.lineUserId}
                        />
                      </div>
                    </div>
                  )}
               </div>
             </div>
          )}

          {/* Section 2: Role & Department */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />{" "}
              สิทธิ์และสังกัด
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className={labelClasses}>
                  <Shield size={16} /> บทบาท
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.role || "USER"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                >
                  <option value="USER">ผู้ใช้งานทั่วไป</option>
                  <option value="IT">ทีมไอที (Technician)</option>
                  <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className={labelClasses}>
                  <Building2 size={16} /> แผนก
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="เช่น IT, HR, Sales"
                  value={formData.department || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: Password (if not view-only) */}
          {!isViewOnly && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
              >
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                <Lock size={14} />
                เปลี่ยนรหัสผ่าน
              </button>

              {showPasswordSection && (
                <div className="space-y-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  {passwordError && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle size={16} />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <label className={labelClasses}>รหัสผ่านใหม่</label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="ระบุรหัสผ่านใหม่"
                        className={inputClasses}
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          });
                          setPasswordError("");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className={labelClasses}>ยืนยันรหัสผ่าน</label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="ระบุรหัสผ่านใหม่อีกครั้ง"
                        className={inputClasses}
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          });
                          setPasswordError("");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Contact */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />{" "}
              ช่องทางติดต่อ
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className={labelClasses}>เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="08x-xxx-xxxx"
                  value={formData.phoneNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col">
                <label className={labelClasses}>LINE ID</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Line ID"
                  value={formData.lineId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lineId: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[1.5] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}
