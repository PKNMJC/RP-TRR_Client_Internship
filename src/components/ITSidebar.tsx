"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
  Users,
} from "lucide-react";

interface MenuItem {
  icon: React.ComponentType<{ size: number; strokeWidth?: number }>;
  label: string;
  href: string;
  subItems?: Array<{ label: string; href: string }>;
}

export default function ITSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/it/dashboard" },
    { icon: Package, label: "ระบบยืมของ", href: "/it/loans" },
    { icon: Wrench, label: "งานซ่อมแซม", href: "/it/repairs" },
    { icon: Users, label: "จัดการผู้ใช้", href: "/it/users" },
    {
      icon: Settings,
      label: "ตั้งค่า",
      href: "/it/settings",
      subItems: [
        { label: "โปรไฟล์", href: "/it/settings/profile" },
        { label: "ความปลอดภัย", href: "/it/settings/security" },
      ],
    },
  ];

  useEffect(() => setIsOpen(false), [pathname]);

  const toggleSubMenu = useCallback((label: string) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-900 tracking-tight">
            IT SUPPORT
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-zinc-200 transition-transform duration-300 z-[60] ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="h-20 flex items-center px-8">
          <Link href="/it/dashboard" className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-md font-bold text-zinc-900 tracking-tight">
                IT
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider">
                SUPPORT
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenu === item.label;
            const isActive = pathname.startsWith(item.href);

            return (
              <div key={item.label}>
                {item.subItems ? (
                  <button
                    onClick={() => toggleSubMenu(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all group ${
                      isExpanded || isActive
                        ? "bg-zinc-50 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          isActive || isExpanded
                            ? "text-zinc-900"
                            : "text-zinc-400 group-hover:text-zinc-900"
                        }
                      >
                        <Icon size={18} strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div
                      className={`transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : "opacity-40"
                      }`}
                    >
                      <ChevronDown size={14} />
                    </div>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${
                      isActive
                        ? "bg-zinc-200 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <div
                      className={
                        isActive
                          ? "text-zinc-900"
                          : "text-zinc-400 group-hover:text-zinc-900"
                      }
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}

                {/* Submenu */}
                {item.subItems && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-zinc-200">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={`block py-2 px-6 text-xs font-medium transition-colors ${
                          pathname === sub.href
                            ? "text-zinc-900"
                            : "text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Area */}
        <div className="absolute bottom-0 w-full p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
              <User size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-800 truncate">
                IT Support
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-tight">
                IT Team
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button className="flex items-center justify-center p-2 rounded-md bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 transition-all">
              <Bell size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-md bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
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
