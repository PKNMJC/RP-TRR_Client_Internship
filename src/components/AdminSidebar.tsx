"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminProfile, setAdminProfile] = useState<UserType | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    { icon: Users, label: "จัดการผู้ใช้", href: "/admin/users" },
  ];

  // Helper to check link active status (moved up for use in effect)
  const isLinkActive = useCallback(
    (href: string) => {
      // Check if href has params
      if (href.includes("?")) {
        const [path, query] = href.split("?");
        if (pathname !== path) return false;
        const params = new URLSearchParams(query);
        // Check if all params match
        for (const [key, value] of params.entries()) {
          if (searchParams.get(key) !== value) return false;
        }
        return true;
      }
      // Exact match for base paths or subpaths
      return (
        pathname === href ||
        (href !== "/admin/dashboard" &&
          pathname.startsWith(href) &&
          !searchParams.toString())
      );
    },
    [pathname, searchParams],
  );

  // Close sidebar on route change (mobile) and handle auto-expand/collapse
  useEffect(() => {
    setIsOpen(false);

    // Auto expand/collapse Based on current path
    const activeItem = menuItems.find((item) =>
      item.subItems?.some((sub) => isLinkActive(sub.href)),
    );

    if (activeItem) {
      setExpandedMenu(activeItem.label);
    } else {
      // Collapse if no sub-item matches (navigating to another main page)
      setExpandedMenu(null);
    }
  }, [pathname, searchParams, isLinkActive]);

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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#F5F5F5] border-b border-zinc-200 z-[50] px-4 flex items-center justify-between shadow-sm">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="font-bold text-zinc-800 tracking-tight text-xl">
            TRR-RP
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 rounded-lg transition-all"
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
        className={`fixed left-0 top-0 h-screen w-56 bg-[#ECECEC] border-r border-zinc-200 transition-transform duration-300 z-[60] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="h-20 flex items-center px-6">
          <Link href="/admin/dashboard" className="flex items-center">
            <span className="text-xl font-normal text-zinc-700 tracking-tight">
              TRR-RP
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-3 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedMenu === item.label;
              const isActive = isLinkActive(item.href);

              // Check if any sub-item is active
              const hasActiveSub = item.subItems?.some((sub) =>
                isLinkActive(sub.href),
              );

              return (
                <div key={item.label}>
                  {item.subItems ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleSubMenu(item.label)}
                        className={`w-full flex items-center justify-between py-1.5 transition-all group ${
                          hasActiveSub || isExpanded
                            ? "text-zinc-800"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            size={20}
                            strokeWidth={1.5}
                            className={`${
                              hasActiveSub || isExpanded
                                ? "text-zinc-800"
                                : "text-zinc-500 group-hover:text-zinc-700"
                            }`}
                          />
                          <span className="text-sm font-normal">
                            {item.label}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          strokeWidth={1.5}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
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
                        <div className="ml-8 space-y-1 py-1">
                          {item.subItems.map((sub) => {
                            const isSubActive = isLinkActive(sub.href);
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                className={`block text-sm transition-all ${
                                  isSubActive
                                    ? "text-zinc-800 font-medium"
                                    : "text-zinc-500 hover:text-zinc-800"
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
                      className={`flex items-center gap-3 py-1.5 transition-all group ${
                        isActive
                          ? "text-zinc-800"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Icon
                        size={20}
                        strokeWidth={1.5}
                        className={`${
                          isActive
                            ? "text-zinc-800"
                            : "text-zinc-500 group-hover:text-zinc-700"
                        }`}
                      />
                      <span className="text-sm font-normal">{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile Area - Fixed Bottom */}
        <div className="p-4">
          <div className="border-t border-zinc-400/40 mb-4" />

          <div className="flex items-center gap-3 mb-4">
            {adminProfile?.pictureUrl ? (
              <Image
                src={adminProfile.pictureUrl}
                alt={adminProfile.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#6D4242] flex items-center justify-center shadow-sm shrink-0">
                {/* Mockup shows plain circle, maybe no text or simple text */}
              </div>
            )}

            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-normal text-zinc-800 truncate">
                {adminProfile?.name || "admin"}
              </span>
              <div className="flex items-center gap-1.5 text-zinc-600">
                <User size={14} className="shrink-0" />
                <span className="text-sm truncate">
                  {adminProfile?.email || "admin@trr.com"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 bg-transparent hover:bg-zinc-200/50 border border-zinc-500 rounded-lg text-zinc-700 transition-all font-medium text-sm"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
