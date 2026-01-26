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
  ChevronUp,
  User,
  Package,
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

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/admin/dashboard" },
    {
      icon: Wrench,
      label: "งานซ่อมแซม",
      href: "/admin/repairs",
      subItems: [
        { label: "งานซ่อมทั้งหมด", href: "/admin/repairs" },
        { label: "รอรับงาน", href: "/admin/repairs?status=PENDING" },
        { label: "กำลังซ่อม", href: "/admin/repairs?status=IN_PROGRESS" },
        { label: "เสร็จแล้ว", href: "/admin/repairs?status=COMPLETED" },
      ],
    },
    { icon: Package, label: "ยืมของ", href: "/admin/loans" },
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-[50] px-4 sm:px-6 flex items-center justify-between shadow-sm">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900 tracking-tight">
            TRR-RP
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
          aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-56 bg-[#fafafa] border-r border-zinc-200 transition-transform duration-300 z-[60] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-100">
          <Link href="/admin/dashboard" className="flex items-center">
            <span className="text-base font-semibold text-zinc-800 tracking-tight">
              TRR-RP
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenu === item.label;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              (item.href === "/admin/repairs" &&
                pathname.includes("/admin/repairs"));

            return (
              <div key={item.label} className="mb-1">
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleSubMenu(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
                        isActive
                          ? "text-zinc-900"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={1.5}
                          className={
                            isActive ? "text-[#8B4513]" : "text-zinc-500"
                          }
                        />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      <ChevronUp
                        size={16}
                        className={`text-zinc-400 transition-transform duration-200 ${
                          isExpanded ? "" : "rotate-180"
                        }`}
                      />
                    </button>

                    {/* Submenu */}
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isExpanded
                          ? "max-h-48 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="ml-9 mt-1 space-y-1">
                        {item.subItems.map((sub) => {
                          const isSubActive =
                            pathname === sub.href ||
                            (sub.href.includes("?") &&
                              pathname + window.location.search === sub.href);
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              className={`block py-1.5 text-sm transition-colors ${
                                isSubActive
                                  ? "text-zinc-900 font-medium"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "text-zinc-900"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      className={isActive ? "text-[#8B4513]" : "text-zinc-500"}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Area - Bottom */}
        <div className="border-t border-zinc-200 p-4 bg-white">
          {isLoadingProfile ? (
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200" />
                <div className="flex-1">
                  <div className="h-3 bg-zinc-200 rounded w-16 mb-1.5" />
                  <div className="h-2.5 bg-zinc-200 rounded w-24" />
                </div>
              </div>
            </div>
          ) : adminProfile ? (
            <div>
              {/* Profile Info */}
              <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                {adminProfile.pictureUrl ? (
                  <Image
                    src={adminProfile.pictureUrl}
                    alt={adminProfile.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#8B4513] flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {adminProfile.name?.charAt(0)?.toUpperCase() || "A"}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 truncate">
                      {adminProfile.name || "admin"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Users size={12} />
                    <span className="text-xs truncate">
                      {adminProfile.email || "admin@trr.com"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-50"
              >
                <LogOut
                  size={16}
                  className={isLoggingOut ? "animate-spin" : ""}
                />
                <span className="text-sm">ออกจากระบบ</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Fallback Profile */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#8B4513] flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-zinc-900">
                    admin
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Users size={12} />
                    <span className="text-xs">admin@trr.com</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-50"
              >
                <LogOut
                  size={16}
                  className={isLoggingOut ? "animate-spin" : ""}
                />
                <span className="text-sm">ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] lg:hidden z-[55]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
