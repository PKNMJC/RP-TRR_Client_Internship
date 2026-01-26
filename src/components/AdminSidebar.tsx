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
  ChevronDown,
  User,
  Package,
  Building2,
} from "lucide-react";
import { userService, User as UserType } from "../../services/userService";

interface SubItem {
  label: string;
  href: string;
}

interface MenuItem {
  icon: React.ComponentType<{
    size: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  href: string;
  subItems?: SubItem[];
}

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>("งานซ่อมแซม");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminProfile, setAdminProfile] = useState<UserType | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch admin profile on mount
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
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchAdminProfile();
  }, []);

  // Update menu items
  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/admin/dashboard" },
    {
      icon: Wrench,
      label: "งานซ่อมแซม",
      href: "/admin/repairs",
      subItems: [
        { label: "ภาพรวมงานซ่อม", href: "/admin/repairs" },
        { label: "รอรับงาน", href: "/admin/repairs?status=PENDING" },
        { label: "กำลังซ่อม", href: "/admin/repairs?status=IN_PROGRESS" },
        { label: "เสร็จสิ้น", href: "/admin/repairs?status=COMPLETED" },
      ],
    },
    { icon: Package, label: "ยืม-คืนอุปกรณ์", href: "/admin/loans" },
    { icon: Building2, label: "จัดการแผนก", href: "/admin/departments" },
    { icon: Users, label: "จัดการผู้ใช้", href: "/admin/users" },
  ];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSubMenu = useCallback((label: string) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    localStorage.clear();
    router.push("/login/admin");
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-[50] px-4 flex items-center justify-between shadow-md">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            TR
          </div>
          <span className="font-bold text-white tracking-tight">TRR Admin</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-[55]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 z-[60] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/60">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-900/20 group-hover:scale-105 transition-transform">
              TR
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight">
                TRR Admin
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Management
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedMenu === item.label;
              const isActive =
                item.href !== "#" &&
                (pathname === item.href ||
                  (item.href !== "/admin/dashboard" &&
                    pathname.startsWith(item.href)));

              // Check if any sub-item is active
              const hasActiveSub = item.subItems?.some(
                (sub) =>
                  pathname === sub.href ||
                  pathname + window.location.search === sub.href,
              );

              return (
                <div key={item.label} className="mb-2">
                  {item.subItems ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleSubMenu(item.label)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                          hasActiveSub || isExpanded
                            ? "bg-slate-800/50 text-white"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            size={20}
                            className={`${
                              hasActiveSub || isExpanded
                                ? "text-indigo-400"
                                : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            isExpanded
                              ? "rotate-180 text-indigo-400"
                              : "text-slate-600"
                          }`}
                        />
                      </button>

                      {/* Submenu */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded
                            ? "max-h-96 opacity-100 mt-1"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 py-1">
                          {item.subItems.map((sub) => {
                            const isSubActive =
                              pathname === sub.href ||
                              (sub.href.includes("?") &&
                                pathname + window.location.search === sub.href);
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                                  isSubActive
                                    ? "bg-indigo-500/10 text-indigo-400 font-medium"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                                }`}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                        isActive
                          ? "bg-indigo-600 shadow-md shadow-indigo-900/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`${
                          isActive
                            ? "text-indigo-200"
                            : "text-slate-500 group-hover:text-slate-300"
                        }`}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile Area - Fixed Bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 z-10">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            {isLoadingProfile ? (
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700" />
                <div className="1">
                  <div className="h-3 bg-slate-700 rounded w-20 mb-1" />
                  <div className="h-2 bg-slate-700 rounded w-28" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {adminProfile?.pictureUrl ? (
                  <Image
                    src={adminProfile.pictureUrl}
                    alt={adminProfile.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border border-slate-600"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {(adminProfile?.name || "A").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {adminProfile?.name || "Admin"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {adminProfile?.role || "Administrator"}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
