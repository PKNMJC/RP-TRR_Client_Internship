"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "แดชบอร์ด",
    description: "ดูสถิติและรายงานอ้างอิง",
    href: "/admin/dashboard",
    color: "bg-blue-500",
  },
  {
    icon: Wrench,
    label: "งานซ่อมแซม",
    description: "บริหารรายการงานซ่อมทั้งหมด",
    href: "/admin/repairs",
    color: "bg-amber-600",
  },
  {
    icon: Package,
    label: "ยืมของ",
    description: "จัดการระบบยืม-คืนอุปกรณ์",
    href: "/admin/loans",
    color: "bg-emerald-500",
  },
  {
    icon: Users,
    label: "จัดการผู้ใช้",
    description: "บริหารบัญชีผู้ใช้และสิทธิ์การเข้าถึง",
    href: "/admin/users",
    color: "bg-purple-500",
  },
];

export default function AdminHome() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/repairs/statistics/overview`,
      );
      if (!res.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      // Don't show error to user immediately if it's just a network blip, maybe retry?
      // For now, just set error state
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900">
          ยินดีต้อนรับ Admin
        </h1>
        <p className="text-sm md:text-base text-zinc-500 mt-1">
          เลือกส่วนที่คุณต้องการจัดการ
        </p>
      </div>

      {/* Quick Menu Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group bg-white rounded-xl p-4 md:p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all"
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 ${item.color} rounded-lg flex items-center justify-center mb-3 md:mb-4 group-hover:scale-105 transition-transform`}
              >
                <Icon size={20} className="text-white md:w-6 md:h-6" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-zinc-900 mb-1">
                {item.label}
              </h3>
              <p className="text-xs md:text-sm text-zinc-500 line-clamp-2 hidden sm:block">
                {item.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-zinc-400 mt-2 group-hover:text-zinc-600 transition-colors">
                <span className="hidden md:inline">เปิด</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-zinc-900 mb-4">
          สรุปภาพรวม
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <button
              onClick={fetchStats}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-zinc-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench size={16} className="text-blue-600" />
                </div>
                <span className="text-xs text-zinc-500">งานทั้งหมด</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-zinc-900">
                {stats?.total || 0}
              </div>
            </div>

            <div className="bg-zinc-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="text-amber-600" />
                </div>
                <span className="text-xs text-zinc-500">รอรับงาน</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-amber-600">
                {stats?.pending || 0}
              </div>
            </div>

            <div className="bg-zinc-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} className="text-orange-600" />
                </div>
                <span className="text-xs text-zinc-500">กำลังซ่อม</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-orange-600">
                {stats ? stats.inProgress + stats.waitingParts : 0}
              </div>
            </div>

            <div className="bg-zinc-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} className="text-emerald-600" />
                </div>
                <span className="text-xs text-zinc-500">เสร็จแล้ว</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-emerald-600">
                {stats?.completed || 0}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-6 bg-white rounded-xl border border-zinc-200 p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-zinc-900 mb-4">
          กิจกรรมล่าสุด
        </h2>
        <div className="text-center py-8 text-zinc-400">
          <Clock size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">ยังไม่มีกิจกรรมล่าสุด</p>
        </div>
      </div>
    </div>
  );
}
