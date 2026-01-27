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
  FileText,
  BarChart3,
  Settings,
  Shield,
  Download,
  Trash2,
  Bell,
  Database,
} from "lucide-react";
import { userService, User as UserType } from "../../services/userService";

interface SubItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ size: number }>;
}

interface MenuItem {
  icon: React.ComponentType<{
    size: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  href?: string;
  subItems?: SubItem[];
  isSection?: boolean;
}

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
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

  // Menu items with grouped sections
  const menuItems: MenuItem[] = [
    // Main Dashboard
    {
      icon: LayoutDashboard,
      label: "แดชบอร์ด",
      href: "/admin/dashboard",
    },

    // System Management Section
    {
      icon: Shield,
      label: "จัดการระบบ",
      isSection: true,
      subItems: [
        { label: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
        {
          label: "จัดการแผนก",
          href: "/admin/departments",
          icon: Package,
        },
        {
          label: "บันทึกการเข้าถึง",
          href: "/admin/audit-logs",
          icon: FileText,
        },
        { label: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings },
      ],
    },

    // Operations Management Section
    {
      icon: Wrench,
      label: "บริหารปฏิบัติการ",
      isSection: true,
      subItems: [
        { label: "งานซ่อมแซม", href: "/admin/repairs", icon: Wrench },
        { label: "ยืม-คืนอุปกรณ์", href: "/admin/loans", icon: Package },
        {
          label: "งานที่มอบหมาย",
          href: "/admin/assigned-tasks",
          icon: FileText,
        },
      ],
    },

    // Analytics & Reports Section
    {
      icon: BarChart3,
      label: "รายงานและวิเคราะห์",
      isSection: true,
      subItems: [
        { label: "สถิติภาพรวม", href: "/admin/analytics", icon: BarChart3 },
        { label: "นำออกข้อมูล", href: "/admin/export-data", icon: Download },
        {
          label: "การสำรองข้อมูล",
          href: "/admin/backup",
          icon: Database,
        },
      ],
    },

    // Admin Actions Section
    {
      icon: Trash2,
      label: "การจัดการขั้นสูง",
      isSection: true,
      subItems: [
        { label: "ลบรายการซ่อม", href: "/admin/delete-repairs", icon: Trash2 },
        { label: "ลบข้อมูลผู้ใช้", href: "/admin/delete-users", icon: Users },
        {
          label: "ล้างข้อมูลตามกำหนดเวลา",
          href: "/admin/cleanup",
          icon: Database,
        },
      ],
    },
  ];

  const isLinkActive = useCallback(
    (href: string) => {
      return pathname === href || pathname.startsWith(href);
    },
    [pathname],
  );

  // Close sidebar on route change (mobile) and handle auto-expand/collapse
  useEffect(() => {
    setIsOpen(false);

    // Auto expand section if current path matches any sub-item
    const activeItem = menuItems.find((item) =>
      item.subItems?.some((sub) => isLinkActive(sub.href)),
    );

    if (activeItem) {
      setExpandedMenu(activeItem.label);
    }
  }, [pathname, isLinkActive]);

  const toggleSubMenu = useCallback((label: string) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      localStorage.removeItem("userId");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 z-[50] px-4 flex items-center justify-between shadow-lg">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Shield size={24} className="text-blue-400" />
          <span className="font-bold text-white tracking-tight text-lg">
            ADMIN
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
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
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900 border-r border-slate-700 transition-transform duration-300 z-[60] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="h-20 flex items-center px-6 border-b border-slate-700">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Shield size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight">
                ADMIN
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider">
                PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenu === item.label;
            const isActive = item.href ? isLinkActive(item.href) : false;
            const hasActiveSub = item.subItems?.some((sub) =>
              isLinkActive(sub.href),
            );

            // Simple link item (no sub-items)
            if (!item.subItems) {
              return (
                <Link
                  key={item.label}
                  href={item.href || "#"}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    className={`${
                      isActive
                        ? "text-blue-400"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            }

            // Section with sub-items
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleSubMenu(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all group ${
                    hasActiveSub || isExpanded
                      ? "bg-slate-700/50 text-slate-100"
                      : "text-slate-300 hover:bg-slate-700/30 hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      className={`${
                        hasActiveSub || isExpanded
                          ? "text-blue-400"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 text-slate-400 ${
                      isExpanded ? "rotate-180 text-blue-400" : ""
                    }`}
                  />
                </button>

                {/* Submenu */}
                {item.subItems && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-6 space-y-1 py-1 border-l border-slate-600/50">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = isLinkActive(sub.href);
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all group ${
                              isSubActive
                                ? "text-blue-400 bg-blue-600/10 font-medium"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                            }`}
                          >
                            {SubIcon && (
                              <SubIcon
                                size={16}
                                className={`${
                                  isSubActive
                                    ? "text-blue-400"
                                    : "text-slate-500 group-hover:text-slate-300"
                                }`}
                              />
                            )}
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Area - Fixed Bottom */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            {adminProfile?.pictureUrl ? (
              <Image
                src={adminProfile.pictureUrl}
                alt={adminProfile.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border border-slate-600"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shrink-0 border border-slate-600">
                <User size={24} className="text-white" />
              </div>
            )}

            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-medium text-slate-100 truncate">
                {adminProfile?.name || "Admin"}
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-xs truncate">
                  {adminProfile?.email || "admin@trr.com"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center p-2 rounded-lg bg-slate-700/30 border border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-all group">
              <Bell size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-700/30 border border-slate-600 text-slate-300 hover:text-red-400 hover:bg-red-900/20 hover:border-red-700/50 transition-all"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
