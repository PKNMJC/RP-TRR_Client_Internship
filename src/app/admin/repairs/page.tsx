"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/services/api";

interface Repair {
  id: string;
  ticketCode: string;
  problemTitle: string;
  location: string;
  reporterName: string;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "รอรับงาน",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  WAITING_PARTS: "รออะไหล่",
};

function AdminRepairsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats
  const stats = {
    total: repairs.length,
    pending: repairs.filter((r) => r.status === "PENDING").length,
    inProgress: repairs.filter((r) => r.status === "IN_PROGRESS").length,
    completed: repairs.filter((r) => r.status === "COMPLETED").length,
  };

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setFilterStatus(status);
  }, [searchParams]);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/repairs");
        setRepairs((data as Repair[]) || []);
      } catch (err) {
        console.error("Error fetching repairs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, []);

  const handleDelete = async (id: string, ticketCode: string) => {
    if (!window.confirm(`ลบงานซ่อม #${ticketCode}?`)) return;
    try {
      await apiFetch(`/api/repairs/${id}`, { method: "DELETE" });
      setRepairs(repairs.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting repair:", err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  const filteredRepairs = repairs.filter((item) => {
    const matchesSearch =
      item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.problemTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reporterName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const paginatedRepairs = filteredRepairs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="รายการซ่อมทั้งหมด" value={stats.total} />
          <StatCard label="รอรับงาน" value={stats.pending} />
          <StatCard label="กำลังดำเนินการ" value={stats.inProgress} />
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
              <option value="CANCELLED">ยกเลิก</option>
            </select>

            {/* Priority Filter */}
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none">
              <option value="all">ทุกความสำคัญ</option>
              <option value="NORMAL">ปกติ</option>
              <option value="URGENT">ด่วน</option>
              <option value="CRITICAL">ด่วนมาก</option>
            </select>
          </div>

          {/* Export Button */}
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50">
            Export reprot
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
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
                  onClick={() => router.push(`/admin/repairs/${repair.id}`)}
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
                    <span className="text-sm text-gray-700">
                      {repair.location}
                    </span>
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
                        onClick={() =>
                          router.push(`/admin/repairs/${repair.id}`)
                        }
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(repair.id, repair.ticketCode)
                        }
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
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
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}

export default function AdminRepairsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          กำลังโหลด...
        </div>
      }
    >
      <AdminRepairsContent />
    </Suspense>
  );
}
