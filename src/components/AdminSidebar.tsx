"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Users,
  LogOut,
  Menu,
  X,
  User,
  Package,
  Shield,
  Download,
  Trash2,
} from "lucide-react";
import { userService, User as UserType } from "@/services/userService";

interface MenuItem {
  icon: React.ComponentType<{ size: number; strokeWidth?: number }>;
  label: string;
  href: string;
}

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminProfile, setAdminProfile] = useState<UserType | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const user = await userService.getUserById(parseInt(userId));
          setAdminProfile(user);
        }
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
      }
    };
    fetchAdminProfile();
  }, []);

  // Simple flat menu - no dropdowns
  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/admin/dashboard" },
    { icon: Users, label: "จัดการผู้ใช้", href: "/admin/users" },
    { icon: Wrench, label: "งานซ่อมแซม", href: "/admin/repairs" },
    { icon: Package, label: "ยืม-คืนอุปกรณ์", href: "/admin/loans" },
    { icon: Download, label: "นำออกข้อมูล", href: "/admin/export-data" },
    { icon: Trash2, label: "ลบรายการซ่อม", href: "/admin/delete-repairs" },
  ];

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );

  useEffect(() => setIsOpen(false), [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      localStorage.removeItem("userId");
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50 px-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Shield size={22} className="text-blue-500" />
          <span className="font-bold text-white text-lg">ADMIN</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 lg:hidden z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 z-[60] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white">ADMIN</span>
              <span className="text-[10px] text-slate-500 block -mt-0.5">
                PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            {adminProfile?.pictureUrl ? (
              <Image
                src={adminProfile.pictureUrl}
                alt={adminProfile.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {adminProfile?.name || "Admin"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {adminProfile?.email || "admin@trr.com"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
