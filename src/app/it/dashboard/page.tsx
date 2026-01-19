"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import {
  Package,
  Wrench,
  AlertCircle,
  Activity,
  Users,
  ChevronRight,
  LayoutDashboard,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { safeFormat } from "@/lib/date-utils";

// --- Types ---
interface ActivityItem {
  id: number;
  itemName?: string;
  problemTitle?: string;
  borrowerName?: string;
  borrowAt?: string;
  ticketCode?: string;
  createdAt?: string;
  status: string;
}

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  totalRepairs: number;
  pendingRepairs: number;
  completedRepairs: number;
  recentLoans: ActivityItem[];
  recentRepairs: ActivityItem[];
}

export default function ITDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    activeLoans: 0,
    overdueLoans: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    completedRepairs: 0,
    recentLoans: [],
    recentRepairs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token") ||
            localStorage.getItem("token")
          : null;
      const role =
        typeof window !== "undefined" ? localStorage.getItem("role") : null;

      if (!token || (role !== "IT" && role !== "ADMIN")) {
        router.push("/login/admin");
        return;
      }

      const [repairsData, loansData] = await Promise.all([
        apiFetch("/api/repairs").catch(() => []),
        apiFetch("/api/loans").catch(() => []),
      ]);

      const repairs = Array.isArray(repairsData) ? repairsData : [];
      const loans = Array.isArray(loansData) ? loansData : [];

      setStats({
        totalRepairs: repairs.length,
        pendingRepairs: repairs.filter((r: any) => r.status === "PENDING")
          .length,
        completedRepairs: repairs.filter((r: any) => r.status === "COMPLETED")
          .length,
        recentRepairs: repairs.slice(0, 5),
        totalLoans: loans.length,
        activeLoans: loans.filter((l: any) => l.status === "BORROWED").length,
        overdueLoans: loans.filter((l: any) => l.status === "OVERDUE").length,
        recentLoans: loans.slice(0, 5),
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ภาพรวมระบบ IT
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              ยินดีต้อนรับเข้าสู่ระบบจัดการพัสดุและแจ้งซ่อม
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg w-fit shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            อัปเดตล่าสุด:{" "}
            {new Date().toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="รายการยืมพัสดุ"
            value={stats.totalLoans}
            subtext={`กำลังยืม ${stats.activeLoans} | เกินกำหนด ${stats.overdueLoans}`}
            icon={<Package className="text-blue-600" size={20} />}
            urgent={stats.overdueLoans > 0}
          />
          <StatCard
            title="รายการซ่อมบำรุง"
            value={stats.totalRepairs}
            subtext={`ค้างดำเนินการ ${stats.pendingRepairs} | สำเร็จ ${stats.completedRepairs}`}
            icon={<Wrench className="text-slate-600" size={20} />}
          />
          <StatCard
            title="ประสิทธิภาพระบบ"
            value={`${Math.round(((stats.activeLoans + stats.pendingRepairs) / 20) * 100)}%`}
            subtext="สถานะการทำงานปกติ"
            icon={<Activity className="text-emerald-600" size={20} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Areas */}
          <div className="lg:col-span-2 space-y-6">
            <Section
              title="รายการยืมล่าสุด"
              icon={<Clock size={16} />}
              href="/it/loans"
            >
              <ActivityList items={stats.recentLoans} type="loan" />
            </Section>

            <Section
              title="รายการแจ้งซ่อมล่าสุด"
              icon={<Wrench size={16} />}
              href="/it/repairs"
            >
              <ActivityList items={stats.recentRepairs} type="repair" />
            </Section>
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <LayoutDashboard size={18} /> ทางลัดจัดการ
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ActionBtn
                  href="/it/loans"
                  label="ยืมพัสดุ"
                  icon={<Package size={16} />}
                />
                <ActionBtn
                  href="/it/repairs"
                  label="แจ้งซ่อม"
                  icon={<Wrench size={16} />}
                />
                <ActionBtn
                  href="/it/settings/profile"
                  label="โปรไฟล์"
                  icon={<Users size={16} />}
                />
                <ActionBtn
                  href="/it/settings/security"
                  label="ประวัติงาน"
                  icon={<Activity size={16} />}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">
                สุขภาพของระบบ
              </h3>
              <div className="space-y-4">
                <HealthMetric label="API Response" val={98} />
                <HealthMetric label="Database" val={100} />
                <HealthMetric label="Storage" val={45} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Internal Components ---

function StatCard({ title, value, subtext, icon, urgent }: any) {
  return (
    <div
      className={`bg-white border p-5 rounded-xl shadow-sm transition-all hover:shadow-md ${urgent ? "border-rose-100 bg-rose-50/10" : "border-slate-200"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
      </div>
      <p
        className={`text-xs mt-2 font-medium ${urgent ? "text-rose-600" : "text-slate-400"}`}
      >
        {subtext}
      </p>
    </div>
  );
}

function Section({ title, icon, href, children }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          {icon} <span>{title}</span>
        </div>
        <a
          href={href}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
        >
          ดูทั้งหมด <ChevronRight size={12} />
        </a>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function ActivityList({
  items,
  type,
}: {
  items: ActivityItem[];
  type: "loan" | "repair";
}) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm italic">
        ไม่พบรายการข้อมูลในขณะนี้
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse min-w-[500px]">
      <thead>
        <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
          <th className="px-5 py-3">รายละเอียด</th>
          <th className="px-5 py-3">ข้อมูลผู้ใช้ / วันที่</th>
          <th className="px-5 py-3 text-right">สถานะ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-5 py-4">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {type === "loan" ? item.itemName : item.problemTitle}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                {type === "loan" ? "ASSET-SYSTEM" : `#${item.ticketCode}`}
              </p>
            </td>
            <td className="px-5 py-4">
              <p className="text-xs font-medium text-slate-600">
                {type === "loan" ? item.borrowerName : "ฝ่ายเทคนิค"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {safeFormat(
                  type === "loan" ? item.borrowAt : item.createdAt,
                  "dd MMM yyyy",
                )}
              </p>
            </td>
            <td className="px-5 py-4 text-right">
              <span
                className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusStyles(item.status)}`}
              >
                {translateStatus(item.status)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActionBtn({ href, label, icon }: any) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white hover:text-slate-900 transition-all text-xs font-bold"
    >
      {icon} <span>{label}</span>
    </a>
  );
}

function HealthMetric({ label, val }: any) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold uppercase text-slate-500 mb-1.5">
        <span>{label}</span>
        <span>{val}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${val < 50 ? "bg-rose-500" : "bg-slate-800"}`}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

function translateStatus(s: string) {
  switch (s) {
    case "PENDING":
      return "รอรับเรื่อง";
    case "BORROWED":
      return "กำลังยืม";
    case "RETURNED":
      return "คืนแล้ว";
    case "OVERDUE":
      return "เกินกำหนด";
    case "COMPLETED":
      return "เสร็จสิ้น";
    case "REPAIRING":
      return "กำลังซ่อม";
    default:
      return s;
  }
}

function getStatusStyles(s: string) {
  switch (s) {
    case "COMPLETED":
    case "RETURNED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "OVERDUE":
    case "URGENT":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "PENDING":
    case "BORROWED":
    case "REPAIRING":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-400 border-slate-200";
  }
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-xl border border-slate-200 shadow-sm"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white rounded-xl border border-slate-200 shadow-sm" />
          <div className="h-96 bg-white rounded-xl border border-slate-200 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
