"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Loader,
  RefreshCw,
  ArrowRight,
  Filter,
  X,
  Calendar,
} from "lucide-react";
import { apiFetch } from "@/services/api";

interface RepairTicket {
  id: number;
  ticketCode: string;
  reporterName: string;
  reporterDepartment: string;
  reporterPhone: string;
  problemTitle: string;
  problemCategory: string;
  problemDescription: string;
  location: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "WAITING_PARTS"
    | "COMPLETED"
    | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function CompletedRepairsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState<string>("ALL");
  const [filterMonth, setFilterMonth] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRepairs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, filterUrgency, filterMonth, searchTerm]);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/repairs?status=COMPLETED", "GET");
      if (Array.isArray(response)) {
        const sortedTickets = response.sort(
          (a: any, b: any) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setTickets(sortedTickets);
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepairs();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = tickets;

    // Filter by urgency
    if (filterUrgency !== "ALL") {
      filtered = filtered.filter((t) => t.urgency === filterUrgency);
    }

    // Filter by month
    if (filterMonth !== "ALL") {
      const currentDate = new Date();
      const filterDate = new Date(filterMonth);
      filtered = filtered.filter((t) => {
        const ticketDate = new Date(t.updatedAt);
        return (
          ticketDate.getMonth() === filterDate.getMonth() &&
          ticketDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(term) ||
          t.reporterName.toLowerCase().includes(term) ||
          t.problemTitle.toLowerCase().includes(term) ||
          t.location.toLowerCase().includes(term),
      );
    }

    setFilteredTickets(filtered);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-l-4 border-red-600";
      case "URGENT":
        return "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600";
      default:
        return "bg-green-100 text-green-800 border-l-4 border-green-600";
    }
  };

  const getUrgencyEmoji = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "🔴";
      case "URGENT":
        return "🟡";
      default:
        return "🟢";
    }
  };

  const calculateDays = (createdAt: string, updatedAt: string) => {
    const start = new Date(createdAt);
    const end = new Date(updatedAt);
    return Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  const clearFilters = () => {
    setFilterUrgency("ALL");
    setFilterMonth("ALL");
    setSearchTerm("");
  };

  // Get available months
  const getAvailableMonths = () => {
    const months: { value: string; label: string }[] = [];
    const monthSet = new Set<string>();

    tickets.forEach((ticket) => {
      const date = new Date(ticket.updatedAt);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;
      monthSet.add(yearMonth);
    });

    Array.from(monthSet)
      .sort()
      .reverse()
      .forEach((ym) => {
        const [year, month] = ym.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        months.push({
          value: ym,
          label: date.toLocaleDateString("th-TH", {
            month: "long",
            year: "numeric",
          }),
        });
      });

    return months;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="text-green-500" />
            เสร็จสิ้น
          </h1>
          <p className="text-gray-500 mt-2">
            งานซ่อมที่เสร็จเรียบร้อยแล้ว ({filteredTickets.length})
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหา: รหัสงาน, ชื่อผู้แจ้ง, เรื่องซ่อม, สถานที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Urgency Filter */}
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="NORMAL">🟢 ปกติ</option>
            <option value="URGENT">🟡 ด่วน</option>
            <option value="CRITICAL">🔴 ด่วนมาก</option>
          </select>

          {/* Month Filter */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="ALL">ทั้งหมด</option>
            {getAvailableMonths().map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {(filterUrgency !== "ALL" || filterMonth !== "ALL" || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center gap-2"
            >
              <X size={16} />
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 font-semibold">ทั้งหมด</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {tickets.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 font-semibold">
            เฉลี่ยวันในการซ่อม
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {tickets.length > 0
              ? (
                  tickets.reduce(
                    (sum, t) => sum + calculateDays(t.createdAt, t.updatedAt),
                    0,
                  ) / tickets.length
                ).toFixed(1)
              : "0"}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 font-semibold">อัตราความสำเร็จ</p>
          <p className="text-3xl font-bold text-green-600 mt-2">100%</p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size={32} className="animate-spin text-green-500" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {tickets.length === 0
                ? "ไม่มีงานซ่อมที่เสร็จแล้วในขณะนี้"
                : "ไม่พบงานซ่อมตรงกับเงื่อนไขการค้นหา"}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const daysToComplete = calculateDays(
              ticket.createdAt,
              ticket.updatedAt,
            );
            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer ${getUrgencyColor(
                  ticket.urgency,
                )}`}
                onClick={() => router.push(`/repairs/details/${ticket.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {ticket.ticketCode}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <p>
                        แจ้ง:{" "}
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                      <p>
                        เสร็จ:{" "}
                        {new Date(ticket.updatedAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-opacity-80 block mb-2">
                      {getUrgencyEmoji(ticket.urgency)} {ticket.urgency}
                    </span>
                    <div className="bg-green-50 px-3 py-1 rounded-lg">
                      <p className="text-xs text-green-600 font-semibold">
                        ใช้เวลา
                      </p>
                      <p className="text-lg font-bold text-green-700">
                        {daysToComplete === 0
                          ? "น้อยกว่า 1 วัน"
                          : `${daysToComplete} วัน`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      ผู้แจ้ง
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {ticket.reporterName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {ticket.reporterDepartment}
                    </p>
                    <p className="text-sm text-gray-600">
                      {ticket.reporterPhone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      สถานที่
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {ticket.location}
                    </p>
                    {ticket.assignee && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                          ผู้รับผิดชอบ
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {ticket.assignee.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    เรื่องซ่อม
                  </p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {ticket.problemTitle}
                  </p>
                </div>

                {ticket.problemDescription && (
                  <div className="mb-4 p-3 bg-white bg-opacity-50 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      รายละเอียด
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {ticket.problemDescription}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold">
                    ดูรายละเอียด
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {!loading && filteredTickets.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-4">
          <p className="text-center text-gray-600">
            แสดง{" "}
            <span className="font-bold text-green-600">
              {filteredTickets.length}
            </span>{" "}
            จากทั้งหมด{" "}
            <span className="font-bold text-green-600">{tickets.length}</span>{" "}
            รายการ
          </p>
        </div>
      )}
    </div>
  );
}
