"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Plus,
  Calendar,
  User,
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/services/api";

// Config labels for monochrome style
const statusLabels = {
  OPEN: {
    label: "รอดำเนินการ",
    color: "border-zinc-200 text-zinc-600",
    dot: "bg-zinc-400",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    color: "border-zinc-900 text-zinc-900",
    dot: "bg-zinc-900",
  },
  DONE: {
    label: "เสร็จสิ้น",
    color: "border-zinc-200 text-zinc-400",
    dot: "bg-zinc-200",
  },
};

const priorityLabels = {
  LOW: { label: "ต่ำ", dot: "bg-zinc-300" },
  MEDIUM: { label: "กลาง", dot: "bg-zinc-600" },
  HIGH: { label: "สูง", dot: "bg-black" },
};

export default function AdminRepairsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/tickets");
        setRepairs(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, []);

  const handleDelete = async (id: string, ticketCode: string) => {
    if (!window.confirm(`คุณแน่ใจหรือว่าต้องการลบงานซ่อมแซม #${ticketCode}?`)) {
      return;
    }

    try {
      await apiFetch(`/api/tickets/${id}`, {
        method: "DELETE",
      });
      setRepairs(repairs.filter((repair) => repair.id !== id));
    } catch (err) {
      console.error("Error deleting repair:", err);
      alert("เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่");
    }
  };

  useEffect(() => {
    let filtered = repairs.filter((item) => {
      const matchesSearch =
        item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
    setFilteredRepairs(filtered);
  }, [repairs, searchTerm, filterStatus]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400 animate-pulse">
        Loading System...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">งานซ่อมแซม</h1>
            <p className="text-sm text-zinc-500 mt-2">
              จัดการและติดตามสถานะงานซ่อมบำรุงทั้งหมดในระบบ
            </p>
          </div>
        </div>

        {/* Mini Stats (Clean) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "งานทั้งหมด", value: repairs.length },
            {
              label: "รอดำเนินการ",
              value: repairs.filter((r) => r.status === "OPEN").length,
            },
            {
              label: "กำลังดำเนินการ",
              value: repairs.filter((r) => r.status === "IN_PROGRESS").length,
            },
            {
              label: "เสร็จสิ้น",
              value: repairs.filter((r) => r.status === "DONE").length,
              icon: "✓",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-zinc-200 p-4 rounded-lg hover:border-zinc-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-2">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {stat.value}
                  </p>
                </div>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-zinc-200">
          {[
            {
              key: "all",
              label: "ทุกสถานะ",
              count: repairs.length,
              color: "text-zinc-600",
            },
            {
              key: "OPEN",
              label: "รอดำเนินการ",
              count: repairs.filter((r) => r.status === "OPEN").length,
              color: "text-amber-600",
            },
            {
              key: "IN_PROGRESS",
              label: "กำลังดำเนินการ",
              count: repairs.filter((r) => r.status === "IN_PROGRESS").length,
              color: "text-blue-600",
            },
            {
              key: "DONE",
              label: "เสร็จสิ้น",
              count: repairs.filter((r) => r.status === "DONE").length,
              color: "text-green-600",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterStatus === tab.key
                  ? `${tab.color} bg-opacity-10 border-b-2 border-current`
                  : "text-zinc-500 hover:text-zinc-600"
              }`}
            >
              {tab.label}{" "}
              <span className={`${tab.color} font-bold`}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-grow">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="ค้นหาเลขตั๋ว หรือชื่อเรื่อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-zinc-200 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 transition-all text-sm"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  เลขตั๋ว
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  รายละเอียด
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  ความสำคัญ
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-zinc-600">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredRepairs
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((repair) => (
                  <tr
                    key={repair.id}
                    className="hover:bg-zinc-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-500">
                      #{repair.ticketCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-zinc-900">
                        {repair.title}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <Wrench size={13} className="text-zinc-400" />
                          <span>{repair.equipmentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-zinc-400" />
                          <span>{repair.assignee?.name || "ยังไม่กำหนด"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold ${
                          repair.status === "OPEN"
                            ? "bg-blue-50 text-blue-700"
                            : repair.status === "IN_PROGRESS"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            repair.status === "OPEN"
                              ? "bg-blue-500"
                              : repair.status === "IN_PROGRESS"
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                        />
                        {
                          statusLabels[
                            repair.status as keyof typeof statusLabels
                          ]?.label
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            priorityLabels[
                              repair.priority as keyof typeof priorityLabels
                            ]?.dot
                          }`}
                        />
                        <span className="text-xs font-medium text-zinc-600">
                          {
                            priorityLabels[
                              repair.priority as keyof typeof priorityLabels
                            ]?.label
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            router.push(`/admin/repairs/${repair.id}`)
                          }
                          className="p-2.5 text-zinc-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                          title="ดู & แก้ไข"
                        >
                          <ChevronRight size={18} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(repair.id, repair.ticketCode)
                          }
                          className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                          title="ลบ"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredRepairs.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-400 text-sm">
                ไม่พบรายการที่ตรงกับการค้นหา
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredRepairs.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-500">
              แสดง <b>{(currentPage - 1) * itemsPerPage + 1}</b> ถึง{" "}
              <b>
                {Math.min(currentPage * itemsPerPage, filteredRepairs.length)}
              </b>{" "}
              จาก <b>{filteredRepairs.length}</b> รายการ
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 border border-zinc-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 transition-all"
              >
                <ChevronLeft size={16} className="text-zinc-600" />
              </button>
              <span className="text-sm font-medium text-zinc-600 px-3">
                หน้า {currentPage} /{" "}
                {Math.ceil(filteredRepairs.length / itemsPerPage)}
              </span>
              <button
                disabled={
                  currentPage >=
                  Math.ceil(filteredRepairs.length / itemsPerPage)
                }
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 border border-zinc-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 transition-all"
              >
                <ChevronRight size={16} className="text-zinc-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
