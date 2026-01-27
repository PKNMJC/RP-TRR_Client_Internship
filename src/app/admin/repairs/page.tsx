"use client";

import { useState, useEffect, Suspense } from "react";
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
import { useCurrentRole } from "@/hooks/useRoleAccess";

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

function AdminRepairsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role } = useCurrentRole();
  const isAdmin = role === "ADMIN";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [repairs, setRepairs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredRepairs, setFilteredRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Set initial status from params
    const status = searchParams.get("status");
    if (status) {
      setFilterStatus(status);
    } else {
      setFilterStatus("all");
    }
    setHasInitialized(true);
  }, [searchParams]);

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

  const handleStatusUpdate = async (
    id: string,
    newStatus: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!confirm("คุณต้องการเปลี่ยนสถานะงานซ่อมใช่หรือไม่?")) return;

    try {
      await apiFetch(`/api/repairs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      // Update local state
      setRepairs(
        repairs.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

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
        {/* Dynamic Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {filterStatus === "PENDING" && (
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Clock size={24} />
                </div>
              )}
              {filterStatus === "IN_PROGRESS" && (
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <Wrench size={24} />
                </div>
              )}
              {filterStatus === "COMPLETED" && (
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
              )}
              {(filterStatus === "all" ||
                filterStatus === "CANCELLED" ||
                filterStatus === "WAITING_PARTS") && (
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-900">
                  <LayoutDashboard size={24} />
                </div>
              )}

              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
                {filterStatus === "PENDING"
                  ? "งานรอรับดำเนินการ"
                  : filterStatus === "IN_PROGRESS"
                    ? "งานกำลังซ่อม"
                    : filterStatus === "COMPLETED"
                      ? "งานที่เสร็จสิ้น"
                      : filterStatus === "WAITING_PARTS"
                        ? "งานรออะไหล่"
                        : "ภาพรวมงานซ่อม"}
              </h1>
            </div>
            <p className="text-zinc-500 text-sm ml-1">
              {filterStatus === "PENDING"
                ? "รายการแจ้งซ่อมที่รอเจ้าหน้าที่กดรับงานเพื่อเริ่มดำเนินการ"
                : filterStatus === "IN_PROGRESS"
                  ? "รายการที่กำลังดำเนินการซ่อมแซมอยู่ในขณะนี้"
                  : filterStatus === "COMPLETED"
                    ? "รายการซ่อมที่ดำเนินการเสร็จสิ้นและส่งมอบงานเรียบร้อยแล้ว"
                    : "จัดการและติดตามสถานะงานซ่อมทั้งหมดในระบบ"}
            </p>
          </div>

          {/* Quick Actions based on status */}
          <div className="flex gap-3">
            {filterStatus === "PENDING" &&
              repairs.some((r) => r.status === "PENDING") && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-100">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  รอรับงาน{" "}
                  {repairs.filter((r) => r.status === "PENDING").length} รายการ
                </div>
              )}
            {filterStatus === "IN_PROGRESS" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg border border-amber-100">
                <Wrench size={16} />
                กำลังซ่อม{" "}
                {repairs.filter((r) => r.status === "IN_PROGRESS").length}{" "}
                รายการ
              </div>
            )}
            {filterStatus === "COMPLETED" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg border border-emerald-100">
                <CheckCircle2 size={16} />
                เสร็จสิ้นแล้ว{" "}
                {repairs.filter((r) => r.status === "COMPLETED").length} รายการ
              </div>
            )}
          </div>
        </div>

        {/* Stats Section - Show only relevance or simplified view based on filter */}
        {filterStatus === "all" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`${stat.bg} p-4 rounded-xl border border-zinc-200/60 shadow-sm transition-all hover:shadow-md cursor-default`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg bg-white shadow-sm border border-zinc-100 ${stat.color}`}
                  >
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
        )}

        {/* Controls Bar */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-x-auto max-w-full no-scrollbar">
            {[
              { key: "all", label: "ภาพรวม" },
              { key: "PENDING", label: "รอรับงาน" },
              { key: "IN_PROGRESS", label: "กำลังซ่อม" },
              { key: "WAITING_PARTS", label: "รออะไหล่" },
              { key: "COMPLETED", label: "เสร็จสิ้น" },
              { key: "CANCELLED", label: "ยกเลิก" },
            ].map((tab) => {
              const isActive = filterStatus === tab.key;
              let activeClass = "bg-zinc-900 text-white shadow-md";

              if (isActive) {
                if (tab.key === "PENDING")
                  activeClass =
                    "bg-blue-600 text-white shadow-md shadow-blue-200";
                if (tab.key === "IN_PROGRESS")
                  activeClass =
                    "bg-amber-500 text-white shadow-md shadow-amber-200";
                if (tab.key === "WAITING_PARTS")
                  activeClass =
                    "bg-orange-500 text-white shadow-md shadow-orange-200";
                if (tab.key === "COMPLETED")
                  activeClass =
                    "bg-emerald-600 text-white shadow-md shadow-emerald-200";
                if (tab.key === "CANCELLED")
                  activeClass =
                    "bg-rose-600 text-white shadow-md shadow-rose-200";
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilterStatus(tab.key);
                    // Update URL without reload
                    const url = new URL(window.location.href);
                    if (tab.key === "all") url.searchParams.delete("status");
                    else url.searchParams.set("status", tab.key);
                    window.history.pushState({}, "", url.toString());
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? activeClass
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] py-0.5 px-1.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
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
                        {/* Status Change Quick Actions */}
                        {repair.status === "PENDING" && (
                          <button
                            onClick={(e) =>
                              handleStatusUpdate(repair.id, "IN_PROGRESS", e)
                            }
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg shadow-sm transition-colors mr-2"
                          >
                            รับงาน
                          </button>
                        )}
                        {repair.status === "IN_PROGRESS" && (
                          <button
                            onClick={(e) =>
                              handleStatusUpdate(repair.id, "COMPLETED", e)
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg shadow-sm transition-colors mr-2"
                          >
                            ปิดงาน
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/repairs/${repair.id}`);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <ChevronRight size={18} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(repair.id, repair.ticketCode);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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

export default function AdminRepairsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminRepairsContent />
    </Suspense>
  );
}
