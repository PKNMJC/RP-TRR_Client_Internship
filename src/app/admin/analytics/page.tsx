"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Wrench,
  Users,
  Package,
  Activity,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/services/api";

// Types
interface AnalyticsData {
  totalRepairs: number;
  activeRepairs: number;
  pendingRepairs: number;
  inProgressRepairs: number;
  completedRepairs: number;
  completionRate: number;
  avgResolutionTime: number;
  totalUsers: number;
  totalLoans: number;
  activeLoans: number;
  trend: {
    repairs: number; // percentage change
    loans: number;
  };
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch various data
      const [repairs, users, loans] = await Promise.all([
        apiFetch("/api/repairs"),
        apiFetch("/api/users"),
        apiFetch("/api/loans"),
      ]);

      // Calculate analytics
      const totalRepairs = repairs.length;
      const pendingRepairs = repairs.filter(
        (r: { status: string }) => r.status === "PENDING",
      ).length;
      const inProgressRepairs = repairs.filter(
        (r: { status: string }) => r.status === "IN_PROGRESS",
      ).length;
      const activeRepairs = pendingRepairs + inProgressRepairs;

      const completedRepairs = repairs.filter(
        (r: { status: string }) => r.status === "COMPLETED",
      ).length;
      const completionRate =
        totalRepairs > 0 ? (completedRepairs / totalRepairs) * 100 : 0;

      // Calculate average resolution time (mock for now)
      const avgResolutionTime = 24; // hours

      const totalLoans = loans.length;
      const activeLoans = loans.filter(
        (l: { status: string }) => l.status === "BORROWED",
      ).length;

      setAnalytics({
        totalRepairs,
        activeRepairs,
        pendingRepairs,
        inProgressRepairs,
        completedRepairs,
        completionRate,
        avgResolutionTime,
        totalUsers: users.length,
        totalLoans,
        activeLoans,
        trend: {
          repairs: 12.5, // Mock data - percentage increase
          loans: -3.2, // Mock data - percentage decrease
        },
      });
    } catch (err: unknown) {
      console.error("Failed to fetch analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-zinc-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-zinc-500">
                ข้อมูลเชิงลึกและสถิติของระบบ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-8 py-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="งานซ่อมทั้งหมด"
            value={analytics?.totalRepairs ?? 0}
            trend={analytics?.trend?.repairs}
            icon={Wrench}
            color="blue"
            subtext={`${analytics?.activeRepairs ?? 0} กำลังดำเนินการ`}
          />

          <KPICard
            title="อัตราการเสร็จสิ้น"
            value={`${analytics?.completionRate?.toFixed(1) ?? 0}%`}
            icon={CheckCircle}
            color="green"
            subtext={`${analytics?.completedRepairs ?? 0} เสร็จสมบูรณ์`}
          />

          <KPICard
            title="เวลาเฉลี่ยการแก้ไข"
            value={`${analytics?.avgResolutionTime ?? 0}h`}
            icon={Clock}
            color="orange"
            subtext="เฉลี่ยต่องาน"
          />

          <KPICard
            title="ผู้ใช้งานทั้งหมด"
            value={analytics?.totalUsers ?? 0}
            icon={Users}
            color="purple"
            subtext="บัญชีในระบบ"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Repairs Activity */}
          <div className="bg-white rounded-xl shadow-md border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                สถิติงานซ่อม
              </h3>
              <Activity size={20} className="text-blue-500" />
            </div>

            <div className="space-y-4">
              <StatRow
                label="รอดำเนินการ"
                value={analytics?.pendingRepairs ?? 0}
                total={analytics?.totalRepairs ?? 0}
                color="bg-yellow-500"
              />
              <StatRow
                label="กำลังดำเนินการ"
                value={analytics?.inProgressRepairs ?? 0}
                total={analytics?.totalRepairs ?? 0}
                color="bg-blue-500"
              />
              <StatRow
                label="เสร็จสมบูรณ์"
                value={analytics?.completedRepairs ?? 0}
                total={analytics?.totalRepairs ?? 0}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Loans Activity */}
          <div className="bg-white rounded-xl shadow-md border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                สถิติยืม-คืนอุปกรณ์
              </h3>
              <Package size={20} className="text-indigo-500" />
            </div>

            <div className="space-y-4">
              <StatRow
                label="กำลังยืม"
                value={analytics?.activeLoans ?? 0}
                total={analytics?.totalLoans ?? 0}
                color="bg-indigo-500"
              />
              <StatRow
                label="คืนแล้ว"
                value={
                  (analytics?.totalLoans ?? 0) - (analytics?.activeLoans ?? 0)
                }
                total={analytics?.totalLoans ?? 0}
                color="bg-green-500"
              />
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-600">
                    รวมทั้งหมด
                  </span>
                  <span className="text-lg font-bold text-zinc-900">
                    {analytics?.totalLoans ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                💡 Analytics Insights
              </h4>
              <p className="text-sm text-blue-700">
                Dashboard นี้แสดงข้อมูลสถิติแบบเรียลไทม์จากระบบ
                คุณสามารถใช้ข้อมูลเหล่านี้ในการวิเคราะห์และปรับปรุงประสิทธิภาพการทำงาน
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: "blue" | "green" | "orange" | "purple";
  subtext?: string;
}

function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  subtext,
}: KPICardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-zinc-200 overflow-hidden group">
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4`}>
        <div className="flex items-center justify-between">
          <Icon size={24} className="text-white opacity-90" />
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                trend >= 0 ? "bg-white/20 text-white" : "bg-black/10 text-white"
              }`}
            >
              {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm font-medium text-zinc-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-zinc-900 mb-1">{value}</p>
        {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
      </div>
    </div>
  );
}

// Stat Row Component (for progress bars)
interface StatRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function StatRow({ label, value, total, color }: StatRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-zinc-700">{label}</span>
        <span className="text-sm font-bold text-zinc-900">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
