"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Activity,
  ArrowRight,
  Package,
} from "lucide-react";
import {
  getDashboardStats,
  getMonthlyRepairData,
  getRecentActivities,
  getStatusDistribution,
  DashboardStats,
  ChartData,
  RecentActivity,
} from "@/services/dashboardService";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRepairs: 0,
    pendingRepairs: 0,
    inProgressRepairs: 0,
    completedRepairs: 0,
    totalUsers: 0,
    totalLoans: 0,
    completionRate: 0,
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [statusDistribution, setStatusDistribution] = useState({
    completed: 0,
    inProgress: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async (isBackground = false) => {
      try {
        if (!isBackground) {
          setLoading(true);
          setError(null);
        }

        const [dashboardStats, monthlyData, activities, distribution] =
          await Promise.all([
            getDashboardStats(),
            getMonthlyRepairData(),
            getRecentActivities(),
            getStatusDistribution(),
          ]);

        setStats(dashboardStats);
        setChartData(monthlyData);
        setRecentActivities(activities);
        setStatusDistribution(distribution);
      } catch (error: unknown) {
        console.error("Error loading dashboard data:", error);
        if (!isBackground)
          setError(
            error instanceof Error
              ? error.message
              : "ไม่สามารถโหลดข้อมูลแดชบอร์ด",
          );
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchDashboardData();

    // Polling every 30 seconds for dashboard
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
    colorFrom,
    colorTo,
    iconColor,
    textColor,
  }: {
    icon: React.ComponentType<{ size: number; className?: string }>;
    label: string;
    value: number | string;
    trend?: string;
    colorFrom: string;
    colorTo: string;
    iconColor: string;
    textColor: string;
  }) => (
    <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${colorFrom} ${colorTo} shadow-inner`}
          >
            <Icon size={24} className="text-white" />
          </div>
          {trend && (
            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <TrendingUp size={12} className="mr-1" />
              {trend}
            </span>
          )}
        </div>

        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
          <h3 className={`text-3xl font-bold ${textColor} tracking-tight`}>
            {value}
          </h3>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">
            กำลังโหลดข้อมูลแดชบอร์ด...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="bg-white border border-rose-200 text-rose-700 px-8 py-6 rounded-2xl shadow-sm text-center max-w-md">
          <AlertCircle
            size={48}
            className="mx-auto mb-4 text-rose-500 opacity-50"
          />
          <h3 className="font-bold text-lg mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-sm opacity-90">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold transition-colors"
          >
            รีโหลดหน้าเว็บ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            ภาพรวมระบบและการดำเนินงานล่าสุด
          </p>
        </div>
        <div className="text-right text-xs text-slate-400 font-medium">
          ข้อมูลอัปเดตล่าสุด: {new Date().toLocaleTimeString("th-TH")}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          icon={Activity}
          label="งานซ่อมทั้งหมด"
          value={stats.totalRepairs}
          trend="+12% เดือนนี้"
          colorFrom="from-slate-700"
          colorTo="to-slate-900"
          iconColor="text-white"
          textColor="text-slate-900"
        />
        <StatCard
          icon={Clock}
          label="กำลังดำเนินการ"
          value={stats.inProgressRepairs}
          colorFrom="from-amber-400"
          colorTo="to-orange-500"
          iconColor="text-white"
          textColor="text-slate-900"
        />
        <StatCard
          icon={CheckCircle}
          label="เสร็จสิ้นแล้ว"
          value={stats.completedRepairs}
          trend={`${stats.completionRate}% Success`}
          colorFrom="from-emerald-400"
          colorTo="to-teal-500"
          iconColor="text-white"
          textColor="text-slate-900"
        />
        <StatCard
          icon={Package}
          label="การยืมอุปกรณ์"
          value={stats.totalLoans}
          colorFrom="from-indigo-400"
          colorTo="to-blue-600"
          iconColor="text-white"
          textColor="text-slate-900"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-500" />
              สถิติงานซ่อมรายเดือน
            </h2>
          </div>

          <div className="flex items-end justify-between gap-4 flex-1 pb-2">
            {chartData.map((data, index) => {
              const maxValue = Math.max(...chartData.map((d) => d.repairs), 10); // avoid div by zero
              const height = (data.repairs / maxValue) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group h-full justify-end"
                >
                  <div className="w-full max-w-[40px] relative flex flex-col justify-end transition-all h-[85%]">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all duration-300 relative group-hover:bg-indigo-600 group-hover:scale-y-[1.02]"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
                        {data.repairs}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-3">
                    {data.month}
                  </p>
                </div>
              );
            })}
            {chartData.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                ไม่มีข้อมูลกราฟ
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-0 flex flex-col h-[400px]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">กิจกรรมล่าสุด</h2>
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
              ดูทั้งหมด <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {recentActivities.map((activity) => {
              const isCompleted = activity.status === "COMPLETED";
              const isPending = activity.status === "PENDING";

              let iconBg = "bg-slate-100";
              let iconColor = "text-slate-500";
              let statusDot = "bg-slate-400";

              if (isCompleted) {
                iconBg = "bg-emerald-100";
                iconColor = "text-emerald-600";
                statusDot = "bg-emerald-500";
              } else if (activity.status === "IN_PROGRESS") {
                iconBg = "bg-amber-100";
                iconColor = "text-amber-600";
                statusDot = "bg-amber-500";
              } else if (activity.status === "CANCELLED") {
                iconBg = "bg-rose-100";
                iconColor = "text-rose-600";
                statusDot = "bg-rose-500";
              } else if (activity.status === "WAITING_PARTS") {
                iconBg = "bg-orange-100";
                iconColor = "text-orange-600";
                statusDot = "bg-orange-500";
              }

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
                >
                  <div
                    className={`w-9 h-9 shrink-0 ${iconBg} rounded-full flex items-center justify-center ${iconColor}`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        #{activity.ticketCode}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(activity.createdAt).toLocaleDateString(
                          "th-TH",
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${statusDot}`}
                      />
                      <span className="text-xs text-slate-500 capitalize">
                        {activity.status.replace("_", " ").toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {recentActivities.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Package size={32} className="mb-2 opacity-50" />
                <p className="text-sm">ไม่มีกิจกรรมล่าสุด</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
