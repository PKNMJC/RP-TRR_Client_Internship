"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Play,
  Pause,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import * as XLSX from "xlsx";

interface Repair {
  id: string;
  ticketCode: string;
  problemTitle: string;
  problemDescription?: string;
  location: string;
  reporterName: string;
  reporterDepartment?: string;
  reporterPhone?: string;
  status: string;
  urgency: string;
  createdAt: string;
  assignee?: {
    id: number;
    name: string;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "รอรับงาน",
  ASSIGNED: "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  REPAIRING: "กำลังซ่อม",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  WAITING_PARTS: "รออะไหล่",
};

export function RepairsDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [countdown, setCountdown] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    // Get current user (IT Staff)
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("name") || "IT Staff";
    if (userId) {
      setCurrentUser({ id: parseInt(userId), name: userName });
    }
  }, []);

  const fetchRepairs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setIsRefreshing(true);

      // Fetch all repairs like Admin, but we will filter in UI for now
      // or if API supported /my-tasks we'd use that.
      // Assuming generic /api/repairs returns all.
      const data = await apiFetch("/api/repairs");
      setRepairs((data as Repair[]) || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching repairs:", err);
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  // Auto-refresh countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoRefreshEnabled) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchRepairs(false);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, fetchRepairs]);

  // Filter Logic:
  // Admin sees ALL.
  // IT sees ALL? Or just "My Repairs"?
  // The user request said "IT of themselves" (My IT).
  // But also said "model off repairs of admin" (which shows all).
  // AND the image shows "Jobs Waiting", "Urgent", "My Jobs", "Completed".
  // So likely the TABLE shows a mix or filtered view.
  // Let's implement filtering for "My Repairs" primarily but maybe allow toggle?
  // Actually, standard IT dashboard usually shows ALL tasks so they can PICK them (Pending)
  // OR work on their own (In Progress).
  // Let's filter slightly differently than AdminStats.

  const myRepairsCount = currentUser
    ? repairs.filter((r) => r.assignee?.id === currentUser.id).length
    : 0;
  const pendingCount = repairs.filter((r) => r.status === "PENDING").length;
  const urgentCount = repairs.filter(
    (r) => r.urgency === "URGENT" || r.urgency === "CRITICAL",
  ).length;
  const completedCount = repairs.filter((r) => r.status === "COMPLETED").length; // Maybe just today/week? Admin shows total.

  const stats = {
    waiting: pendingCount,
    urgent: urgentCount,
    mine: myRepairsCount,
    completed: completedCount,
  };

  const filteredRepairs = repairs.filter((item) => {
    // Search
    const matchesSearch =
      item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.problemTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reporterName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status Filter
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;

    // IMPORTANT: Should we filter by "My Repairs" only?
    // The prompt says "repaire of it... but it of themselves".
    // Usually means "My view".
    // If I select "My Tasks" in a filter?
    // Or is the whole page "My Repairs"?
    // The Dashboard had "My Repairs".
    // This page likely should show EVERYTHING available to IT (so they can pick up pending ones)
    // PLUS their own.
    // So "All" is probably correct for the table, but maybe highlight mine?
    // Or maybe the user WANTS only "My Repairs" here?
    // "IT of themselves" -> Likely "My Repairs Page".
    // BUT if it's "My Repairs", then "Pending" (Waiting for acceptance) implies global pending?
    // Let's stick to "Show All" but add a "My Tasks" filter option that is default?
    // Or just show all (Admin style) and let them filter.
    // The Admin style shows All.
    // Let's show All matches "Admin model".

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const paginatedRepairs = filteredRepairs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportExcel = () => {
    if (repairs.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    try {
      const exportData = filteredRepairs.map((repair) => ({
        เลขใบงาน: repair.ticketCode,
        วันที่แจ้ง: new Date(repair.createdAt).toLocaleDateString("th-TH"),
        เวลา: new Date(repair.createdAt).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        ปัญหา: repair.problemTitle,
        สถานที่: repair.location,
        ความสำคัญ: repair.urgency,
        สถานะ: statusLabels[repair.status] || repair.status,
        ผู้รับผิดชอบ: repair.assignee?.name || "-",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Repairs");
      XLSX.writeFile(
        wb,
        `Repairs_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (e) {
      console.error(e);
      alert("Export failed");
    }
  };

  if (loading && !isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Stats Row - Custom for IT context */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="งานรอรับเรื่อง" value={stats.waiting} />
          <StatCard label="งานด่วน" value={stats.urgent} />
          <StatCard label="งานของฉัน" value={stats.mine} />
          <StatCard label="เสร็จสิ้น" value={stats.completed} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้แจ้ง/เลขรหัส"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">
                ค้นหา
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="PENDING">รอรับงาน</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
            </select>

            {/* Priority Filter - Visual only for now or implement if needed */}
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none">
              <option value="all">ทุกความสำคัญ</option>
              <option value="NORMAL">ปกติ</option>
              <option value="URGENT">ด่วน</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                {autoRefreshEnabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${autoRefreshEnabled ? "bg-green-500" : "bg-gray-400"}`}
                ></span>
              </span>
              เรียลไทม์
              <span className="text-green-300 mx-1">|</span>
              <span className="font-mono">{countdown}s</span>
              <span className="text-green-300 mx-1">|</span>
              {lastUpdated.toLocaleTimeString("th-TH")}
            </div>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 font-medium"
            >
              Export report
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="hidden md:block bg-white rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  เลข/รหัส
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  ปัญหา
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  สถานที่ / ผู้แจ้ง
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRepairs.map((repair) => (
                <tr
                  key={repair.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/it/repairs/${repair.id}`)}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-900">
                      {repair.ticketCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {repair.problemTitle}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">
                        {repair.location}
                      </span>
                      <span className="text-xs text-gray-400">
                        {repair.reporterName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {statusLabels[repair.status] || repair.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => router.push(`/it/repairs/${repair.id}`)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedRepairs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    ไม่พบรายการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {paginatedRepairs.map((repair) => (
            <div
              key={repair.id}
              className="bg-white rounded-lg p-4 shadow-sm"
              onClick={() => router.push(`/it/repairs/${repair.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-gray-500">
                  {repair.ticketCode}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                  {statusLabels[repair.status] || repair.status}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {repair.problemTitle}
              </p>
              <p className="text-xs text-gray-500">
                {repair.location} • {repair.reporterName}
              </p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage}/{totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-200 p-4 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="mt-2 text-center">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
