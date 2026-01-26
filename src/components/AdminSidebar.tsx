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
  const [expandedMenu, setExpandedMenu] = useState<string | null>("งานซ่อมแซม");
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
    { icon: Building2, label: "จัดการแผนก", href: "/admin/departments" },
    { icon: Users, label: "จัดการผู้ใช้", href: "/admin/users" },
  ];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]); // Also close on params change if needed

  const toggleSubMenu = useCallback((label: string) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    localStorage.clear();
    router.push("/login/admin");
  };

  const isLinkActive = (href: string) => {
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
  };

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
        className={`fixed left-0 top-0 h-screen w-64 bg-[#ECECEC] border-r border-zinc-200 transition-transform duration-300 z-[60] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="h-24 flex items-center px-8">
          <Link href="/admin/dashboard" className="flex items-center">
            <span className="text-2xl font-medium text-zinc-800 tracking-tight">
              TRR-RP
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
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
                        className={`w-full flex items-center justify-between py-2 transition-all group ${
                          hasActiveSub || isExpanded
                            ? "text-zinc-800"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Icon
                            size={22}
                            strokeWidth={1.5}
                            className={`${
                              hasActiveSub || isExpanded
                                ? "text-zinc-800"
                                : "text-zinc-500 group-hover:text-zinc-700"
                            }`}
                          />
                          <span className="text-base font-normal">
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
                        <div className="ml-10 space-y-2 py-1">
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
                      className={`flex items-center gap-4 py-2 transition-all group ${
                        isActive
                          ? "text-zinc-800"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Icon
                        size={22}
                        strokeWidth={1.5}
                        className={`${
                          isActive
                            ? "text-zinc-800"
                            : "text-zinc-500 group-hover:text-zinc-700"
                        }`}
                      />
                      <span className="text-base font-normal">
                        {item.label}
                      </span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile Area - Fixed Bottom */}
        <div className="p-6">
          <div className="border-t border-zinc-400/40 mb-6" />

          <div className="flex items-center gap-4 mb-6">
            {adminProfile?.pictureUrl ? (
              <Image
                src={adminProfile.pictureUrl}
                alt={adminProfile.name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#6D4242] flex items-center justify-center shadow-sm shrink-0">
                {/* Mockup shows plain circle, maybe no text or simple text */}
              </div>
            )}

            <div className="flex flex-col overflow-hidden">
              <span className="text-base font-normal text-zinc-800 truncate">
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
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#E0E0E0] hover:bg-[#d4d4d4] border border-zinc-400/50 rounded-lg text-zinc-700 transition-all font-medium"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
