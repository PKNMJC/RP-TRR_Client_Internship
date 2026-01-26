"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  Wrench,
  User,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/services/api";

// Config labels for RepairTicketStatus
const statusLabels = {
  PENDING: {
    label: "รอดำเนินการ",
    icon: "Clock",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    icon: "Wrench",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  WAITING_PARTS: {
    label: "รออะไหล่",
    icon: "Package",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    icon: "CheckCircle",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
    icon: "XCircle",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

// Config labels for UrgencyLevel
const urgencyLabels = {
  NORMAL: {
    label: "ปกติ",
    color: "text-slate-600",
    bg: "bg-slate-100",
    dot: "bg-slate-400",
  },
  URGENT: {
    label: "ด่วน",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  CRITICAL: {
    label: "ด่วนมาก",
    color: "text-rose-700",
    bg: "bg-rose-50",
    dot: "bg-rose-600",
  },
};

export default function AdminRepairsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [repairs, setRepairs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredRepairs, setFilteredRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchRepairs = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        // Changed endpoint to /api/repairs
        const data = await apiFetch("/api/repairs");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRepairs((data as any[]) || []);
      } catch (err) {
        console.error("Error fetching repairs:", err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    // Initial fetch
    fetchRepairs();

    // Polling every 10 seconds
    const intervalId = setInterval(() => {
      fetchRepairs(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleDelete = async (id: string, ticketCode: string) => {
    if (!window.confirm(`คุณแน่ใจหรือว่าต้องการลบงานซ่อมแซม #${ticketCode}?`)) {
      return;
    }

    try {
      await apiFetch(`/api/repairs/${id}`, {
        method: "DELETE",
      });
      setRepairs(repairs.filter((repair) => repair.id !== id));
    } catch (err) {
      console.error("Error deleting repair:", err);
      alert("เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่");
    }
  };

  useEffect(() => {
    const filtered = repairs.filter((item) => {
      const matchesSearch =
        item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.problemTitle &&
          item.problemTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
    setFilteredRepairs(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [repairs, searchTerm, filterStatus]);

  if (loading && repairs.length === 0)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium animate-pulse">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </div>
    );

  // Calculate stats
  const stats = [
    {
      label: "งานทั้งหมด",
      value: repairs.length,
      icon: LayoutDashboard,
      color: "text-zinc-700",
      bg: "bg-white",
    },
    {
      label: "รอดำเนินการ",
      value: repairs.filter((r) => r.status === "PENDING").length,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50/50",
    },
    {
      label: "กำลังซ่อม",
      value: repairs.filter((r) => r.status === "IN_PROGRESS").length,
      icon: Wrench,
      color: "text-amber-600",
      bg: "bg-amber-50/50",
    },
    {
      label: "เสร็จสิ้น",
      value: repairs.filter((r) => r.status === "COMPLETED").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50/50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] pt-6 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            งานซ่อมแซม
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            จัดการคำขอแจ้งซ่อมทั้งหมดในระบบ
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`${stat.bg} p-4 rounded-xl border border-zinc-200/60 shadow-sm transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-lg bg-white shadow-sm border border-zinc-100 ${stat.color}`}
                >
                  {/* Using generic Icon component via lucide-react if needed, but here using specific imports */}
                  {/* Note: In a real scenario we'd dynamic render, but hardcoding for safety with imports */}
                  {i === 0 && <LayoutDashboard size={18} />}
                  {i === 1 && <Clock size={18} />}
                  {i === 2 && <Wrench size={18} />}
                  {i === 3 && <CheckCircle2 size={18} />}
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-zinc-900 block">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-lg overflow-x-auto max-w-full no-scrollbar">
            {[
              { key: "all", label: "ทั้งหมด" },
              { key: "PENDING", label: "รอรับงาน" },
              { key: "IN_PROGRESS", label: "กำลังซ่อม" },
              { key: "WAITING_PARTS", label: "รออะไหล่" },
              { key: "COMPLETED", label: "เสร็จสิ้น" },
              { key: "CANCELLED", label: "ยกเลิก" },
            ].map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 opacity-60 ${isActive ? "text-white" : "text-zinc-400"}`}
                  >
                    {tab.key === "all"
                      ? repairs.length
                      : repairs.filter((r) => r.status === tab.key).length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full xl:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาเลขตั๋ว, ปัญหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg leading-5 bg-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm transition-all hover:border-zinc-300"
            />
          </div>
        </div>

        {/* Content Table (Desktop) */}
        <div className="hidden md:block bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead className="bg-[#fcfcfc]">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  เลขใบงาน / วันที่
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  ปัญหา
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  สถานที่ / ผู้แจ้ง
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  สถานะ
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-100">
              {filteredRepairs
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage,
                )
                .map((repair) => (
                  <tr
                    key={repair.id}
                    className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/admin/repairs/${repair.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 font-mono">
                          #{repair.ticketCode}
                        </span>
                        <span className="text-xs text-zinc-500 mt-1">
                          {new Date(repair.createdAt).toLocaleDateString(
                            "th-TH",
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-sm">
                        <span className="text-sm font-medium text-zinc-900 line-clamp-1">
                          {repair.problemTitle}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-100 bg-zinc-50 text-[10px] font-medium text-zinc-500">
                            <Wrench size={10} />
                            {repair.problemCategory}
                          </span>
                          {/* Urgency Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              urgencyLabels[
                                repair.urgency as keyof typeof urgencyLabels
                              ]?.bg
                            } ${
                              urgencyLabels[
                                repair.urgency as keyof typeof urgencyLabels
                              ]?.color
                            }`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${urgencyLabels[repair.urgency as keyof typeof urgencyLabels]?.dot}`}
                            />
                            {
                              urgencyLabels[
                                repair.urgency as keyof typeof urgencyLabels
                              ]?.label
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-700">
                          {repair.location}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                          <User size={12} />
                          {repair.reporterName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusLabels[
                            repair.status as keyof typeof statusLabels
                          ]?.bg || "bg-zinc-100"
                        } ${
                          statusLabels[
                            repair.status as keyof typeof statusLabels
                          ]?.color || "text-zinc-700"
                        } ${
                          statusLabels[
                            repair.status as keyof typeof statusLabels
                          ]?.border || "border-zinc-200"
                        }`}
                      >
                        <span
                          className={`flex h-1.5 w-1.5 rounded-full ${
                            statusLabels[
                              repair.status as keyof typeof statusLabels
                            ]?.dot || "bg-zinc-400"
                          }`}
                        />
                        {statusLabels[
                          repair.status as keyof typeof statusLabels
                        ]?.label || repair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div
                        className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/repairs/${repair.id}`);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(repair.id, repair.ticketCode);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {filteredRepairs.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                <Search className="text-zinc-300" size={20} />
              </div>
              <p className="text-zinc-900 font-medium">ไม่พบรายการที่ค้นหา</p>
              <p className="text-zinc-500 text-sm mt-1">
                ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ
              </p>
            </div>
          )}
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-3">
          {filteredRepairs
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((repair) => (
              <div
                key={repair.id}
                onClick={() => router.push(`/admin/repairs/${repair.id}`)}
                className="bg-white border border-zinc-200 rounded-xl p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded">
                      #{repair.ticketCode}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(repair.createdAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      statusLabels[repair.status as keyof typeof statusLabels]
                        ?.bg
                    } ${
                      statusLabels[repair.status as keyof typeof statusLabels]
                        ?.color
                    } ${
                      statusLabels[repair.status as keyof typeof statusLabels]
                        ?.border
                    }`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full ${statusLabels[repair.status as keyof typeof statusLabels]?.dot}`}
                    />
                    {
                      statusLabels[repair.status as keyof typeof statusLabels]
                        ?.label
                    }
                  </span>
                </div>

                <h3 className="text-sm font-medium text-zinc-900 mb-2 line-clamp-2">
                  {repair.problemTitle}
                </h3>

                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {repair.reporterName}
                  </span>
                  <span className="w-px h-3 bg-zinc-200" />
                  <span>{repair.location}</span>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        {filteredRepairs.length > 0 && (
          <div className="flex items-center justify-between mt-6 px-1">
            <div className="text-xs text-zinc-500">
              แสดง {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredRepairs.length)} จาก{" "}
              {filteredRepairs.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-xs font-medium text-zinc-900 min-w-[3rem] text-center">
                {currentPage} /{" "}
                {Math.ceil(filteredRepairs.length / itemsPerPage)}
              </div>
              <button
                disabled={
                  currentPage >=
                  Math.ceil(filteredRepairs.length / itemsPerPage)
                }
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
