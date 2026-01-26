"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/services/api";

interface RepairTicket {
  id: number;
  ticketCode: string;
  reporterName: string;
  reporterDepartment: string;
  problemTitle: string;
  problemCategory: string;
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

interface RepairStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function RepairsOverviewPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [stats, setStats] = useState<RepairStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/repairs", "GET");
      if (Array.isArray(response)) {
        setTickets(response);
        calculateStats(response);
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

  const calculateStats = (ticketList: RepairTicket[]) => {
    const newStats: RepairStats = {
      total: ticketList.length,
      pending: ticketList.filter((t) => t.status === "PENDING").length,
      inProgress: ticketList.filter((t) => t.status === "IN_PROGRESS").length,
      completed: ticketList.filter((t) => t.status === "COMPLETED").length,
      cancelled: ticketList.filter((t) => t.status === "CANCELLED").length,
    };
    setStats(newStats);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "URGENT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          color: "bg-blue-100 text-blue-800",
          label: "รอรับงาน",
          icon: Clock,
        };
      case "IN_PROGRESS":
        return {
          color: "bg-purple-100 text-purple-800",
          label: "กำลังซ่อม",
          icon: Loader,
        };
      case "COMPLETED":
        return {
          color: "bg-green-100 text-green-800",
          label: "เสร็จแล้ว",
          icon: CheckCircle2,
        };
      case "CANCELLED":
        return {
          color: "bg-gray-100 text-gray-800",
          label: "ยกเลิก",
          icon: AlertCircle,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          label: status,
          icon: AlertCircle,
        };
    }
  };

  const StatCard = ({
    title,
    count,
    color,
    onClick,
  }: {
    title: string;
    count: number;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg ${color}`}
    >
      <p className="text-sm font-medium mb-2">{title}</p>
      <p className="text-3xl font-bold">{count}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ภาพรวมงานซ่อม</h1>
          <p className="text-gray-500 mt-2">
            จัดการและติดตามสถานะงานซ่อมทั้งหมด
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="ทั้งหมด"
          count={stats.total}
          color="bg-blue-50 border border-blue-200"
        />
        <StatCard
          title="รอรับงาน"
          count={stats.pending}
          color="bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100"
          onClick={() => router.push("/repairs/waiting")}
        />
        <StatCard
          title="กำลังซ่อม"
          count={stats.inProgress}
          color="bg-purple-50 border border-purple-200 cursor-pointer hover:bg-purple-100"
          onClick={() => router.push("/repairs/in-progress")}
        />
        <StatCard
          title="เสร็จแล้ว"
          count={stats.completed}
          color="bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100"
          onClick={() => router.push("/repairs/completed")}
        />
        <StatCard
          title="ยกเลิก"
          count={stats.cancelled}
          color="bg-gray-50 border border-gray-200"
        />
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          งานซ่อมล่าสุด (10 รายการ)
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ไม่มีรายการงานซ่อม</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    รหัสงาน
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    ผู้แจ้ง
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    เรื่องซ่อม
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    ด่วน
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    วันที่
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 10).map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {ticket.ticketCode}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {ticket.reporterName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ticket.reporterDepartment}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{ticket.problemTitle}</p>
                        <p className="text-xs text-gray-500">
                          {ticket.location}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusBadge.color}`}
                        >
                          <StatusIcon size={14} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(ticket.urgency)}`}
                        >
                          {getUrgencyEmoji(ticket.urgency)} {ticket.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(ticket.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            router.push(`/repairs/details/${ticket.id}`)
                          }
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tickets.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm">
              แสดง 10 จากทั้งหมด {tickets.length} รายการ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
