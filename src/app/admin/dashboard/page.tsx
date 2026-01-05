"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
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
    []
  );
  const [statusDistribution, setStatusDistribution] = useState({
    completed: 0,
    inProgress: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching dashboard data...");

        const [dashboardStats, monthlyData, activities, distribution] =
          await Promise.all([
            getDashboardStats(),
            getMonthlyRepairData(),
            getRecentActivities(),
            getStatusDistribution(),
          ]);

        console.log("Dashboard stats received:", dashboardStats);
        console.log("Chart data received:", monthlyData);
        console.log("Activities received:", activities);

        setStats(dashboardStats);
        setChartData(monthlyData);
        setRecentActivities(activities);
        setStatusDistribution(distribution);
      } catch (error: any) {
        console.error("Error loading dashboard data:", error);
        setError(error?.message || "ไม่สามารถโหลดข้อมูลแดชบอร์ด");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    bgColor,
    iconColor,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    bgColor: string;
    iconColor: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>{Icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
          <p className="font-semibold">เกิดข้อผิดพลาด</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-600 mt-2">ยินดีต้อนรับสู่ระบบจัดการซ่อมแซม</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
          label="งานซ่อมทั้งหมด"
          value={stats.totalRepairs}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6 text-yellow-600" />}
          label="การยืม"
          value={stats.totalLoans}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          label="กำลังดำเนินการ"
          value={stats.inProgressRepairs}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="เสร็จสิ้น"
          value={stats.completedRepairs}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-purple-600" />}
          label="ผู้ใช้งานทั้งหมด"
          value={stats.totalUsers}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-pink-600" />}
          label="อัตราการเสร็จสิ้น"
          value={`${stats.completionRate}%`}
          bgColor="bg-pink-100"
          iconColor="text-pink-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            งานซ่อมรายเดือน
          </h2>
          <div className="h-64 flex items-end gap-2">
            {chartData.map((data, index) => {
              const maxValue = Math.max(...chartData.map((d) => d.repairs));
              const height = (data.repairs / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-200 rounded-t-lg relative group hover:bg-blue-400 transition-colors"
                    style={{ height: `${height}%`, minHeight: "20px" }}
                  >
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.repairs}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{data.month}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            สถานะการดำเนินการ
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  เสร็จสิ้น
                </span>
                <span className="text-sm font-bold text-green-600">
                  {statusDistribution.completed}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${statusDistribution.completed}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  กำลังดำเนินการ
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {statusDistribution.inProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-600 h-3 rounded-full"
                  style={{ width: `${statusDistribution.inProgress}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  รอดำเนินการ
                </span>
                <span className="text-sm font-bold text-yellow-600">
                  {statusDistribution.pending}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-600 h-3 rounded-full"
                  style={{ width: `${statusDistribution.pending}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">กิจกรรมล่าสุด</h2>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => {
              const isCompleted = activity.status === "DONE";
              const isInProgress = activity.status === "IN_PROGRESS";
              const statusLabel = isCompleted
                ? "สำเร็จ"
                : isInProgress
                ? "กำลังดำเนินการ"
                : "รอการอนุมัติ";
              const statusColor = isCompleted
                ? "bg-green-100 text-green-700"
                : isInProgress
                ? "bg-orange-100 text-orange-700"
                : "bg-yellow-100 text-yellow-700";
              const iconColor = isCompleted
                ? "text-green-600"
                : isInProgress
                ? "text-orange-600"
                : "text-yellow-600";
              const bgColor = isCompleted
                ? "bg-green-100"
                : isInProgress
                ? "bg-orange-100"
                : "bg-yellow-100";

              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}
                    >
                      <CheckCircle className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.ticketCode}: {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        เมื่อ{" "}
                        {new Date(activity.createdAt).toLocaleDateString(
                          "th-TH"
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs ${statusColor} px-3 py-1 rounded-full`}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              ไม่มีกิจกรรมล่าสุด
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
