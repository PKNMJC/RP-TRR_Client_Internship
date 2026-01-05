"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ITSidebar from "@/components/ITSidebar";
import { apiFetch } from "@/services/api";
import {
  Search,
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  ChevronRight,
  Filter,
  Settings2,
  AlertTriangle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// --- Types ---
interface Ticket {
  id: number;
  ticketCode: string;
  title: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  assignee?: { name: string };
}

export default function ITRepairsPage() {
  const router = useRouter();
  const [repairs, setRepairs] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRepair, setSelectedRepair] = useState<Ticket | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", priority: "MEDIUM" });

  const fetchRepairs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/tickets");
      setRepairs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch repairs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  const handleAcceptRepair = async (id: number) => {
    try {
      setSubmitting(true);
      await apiFetch(`/api/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      fetchRepairs();
      if (selectedRepair?.id === id) {
        setSelectedRepair(null);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการรับเรื่อง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (selectedRepair) {
      setEditForm({
        title: selectedRepair.title,
        priority: selectedRepair.priority,
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRepair || !editForm.title.trim()) {
      alert("กรุณากรอกหัวข้อแจ้งซ่อม");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch(`/api/tickets/${selectedRepair.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editForm.title,
          priority: editForm.priority,
        }),
      });
      fetchRepairs();
      setShowEditModal(false);
      setSelectedRepair(null);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || repair.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: repairs.length,
    pending: repairs.filter((r) => r.status === "OPEN").length,
    inProgress: repairs.filter((r) => r.status === "IN_PROGRESS").length,
    completed: repairs.filter((r) => r.status === "DONE").length,
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-white flex">
      <ITSidebar />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-black">แจ้งซ่อมทั้งหมด</h1>
              <p className="text-gray-600 font-medium mt-2">
                จัดการคำขอรับบริการและการซ่อมบำรุงในระบบทั้งหมด
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="งานทั้งหมด"
              count={stats.total}
              icon={<Wrench />}
            />
            <StatCard
              label="รอรับเรื่อง"
              count={stats.pending}
              icon={<Clock />}
            />
            <StatCard
              label="กำลังดำเนินการ"
              count={stats.inProgress}
              icon={<Settings2 />}
            />
            <StatCard
              label="เสร็จสิ้น"
              count={stats.completed}
              icon={<CheckCircle />}
            />
          </div>

          {/* Search & Table Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเรื่อง, เลขที่ตั๋ว..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-black focus:outline-none focus:ring-2 focus:ring-gray-400/20 text-sm"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="OPEN">รอการแก้ไข</option>
                <option value="IN_PROGRESS">กำลังแก้ไข</option>
                <option value="DONE">เสร็จสิ้น</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      ตั๋วเลขที่
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      หัวข้อแจ้งซ่อม
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      ความสำคัญ
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                      ผู้รับผิดชอบ
                    </th>
                    <th className="px-6 py-3 border-b border-gray-100"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRepairs.map((repair) => (
                    <tr
                      key={repair.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                          #{repair.ticketCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-black">
                          {repair.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          แจ้งเมื่อ:{" "}
                          {format(new Date(repair.createdAt), "dd/MM/yy HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={repair.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={repair.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-black">
                          {repair.assignee?.name || (
                            <span className="text-gray-400 text-xs">
                              ยังไม่ระบุ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {repair.status === "OPEN" && (
                            <button
                              onClick={() => handleAcceptRepair(repair.id)}
                              disabled={submitting}
                              className="bg-black text-white p-2 rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 text-xs font-medium"
                              title="รับเรื่อง"
                            >
                              รับเรื่อง
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedRepair(repair)}
                            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRepairs.length === 0 && <EmptyState />}
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  รายละเอียดการแจ้งซ่อม
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  ID: #{selectedRepair.ticketCode}
                </p>
              </div>
              <button
                onClick={() => setSelectedRepair(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-5">
                {/* หัวข้อแจ้งซ่อม */}
                <div className="border-b border-gray-200 pb-5">
                  <h3 className="text-sm font-semibold text-black mb-2">
                    หัวข้อแจ้งซ่อม
                  </h3>
                  <p className="text-sm text-gray-700">
                    {selectedRepair.title}
                  </p>
                </div>

                {/* ข้อมูลซ่อม */}
                <div className="border-b border-gray-200 pb-5">
                  <h3 className="text-sm font-semibold text-black mb-3">
                    ข้อมูลการแจ้ง
                  </h3>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ความสำคัญ</p>
                      <PriorityBadge priority={selectedRepair.priority} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ผู้รับผิดชอบ</p>
                      <p className="font-medium text-black">
                        {selectedRepair.assignee?.name || (
                          <span className="text-gray-400 text-xs">
                            ยังไม่ระบุ
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* วันที่ */}
                <div className="border-b border-gray-200 pb-5">
                  <h3 className="text-sm font-semibold text-black mb-2">
                    วันที่แจ้ง
                  </h3>
                  <p className="text-sm text-gray-700">
                    {format(
                      new Date(selectedRepair.createdAt),
                      "dd MMM yyyy HH:mm",
                      { locale: th }
                    )}
                  </p>
                </div>

                {/* สถานะ */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">สถานะ</p>
                    <StatusBadge status={selectedRepair.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">เลขที่</p>
                    <p className="text-lg font-semibold text-black font-mono">
                      #{selectedRepair.ticketCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              {selectedRepair.status === "OPEN" && (
                <button
                  onClick={() => handleAcceptRepair(selectedRepair.id)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? "กำลังบันทึก..." : "รับเรื่อง"}
                </button>
              )}
              {selectedRepair.status !== "DONE" && (
                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium text-sm"
                >
                  แก้ไข
                </button>
              )}
              <button
                onClick={() => setSelectedRepair(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRepair && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">
                แก้ไขรายละเอียด
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  หัวข้อแจ้งซ่อม
                </label>
                <textarea
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium placeholder-gray-400 text-sm resize-none"
                  rows={3}
                  placeholder="ระบุหัวข้อแจ้งซ่อม"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  ความสำคัญ
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm({ ...editForm, priority: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 outline-none transition-all text-black font-medium text-sm"
                >
                  <option value="LOW">ต่ำ</option>
                  <option value="MEDIUM">ปกติ</option>
                  <option value="HIGH">สูงมาก</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all font-medium text-sm disabled:opacity-50"
              >
                {submitting ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Internal UI Components ---

function StatCard({ label, count, icon }: any) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col">
        <span className="text-gray-600 text-xs font-semibold uppercase">
          {label}
        </span>
        <span className="text-3xl font-bold text-black mt-2">{count}</span>
      </div>
      <div className="absolute -right-2 -bottom-2 opacity-10 scale-[2] pointer-events-none">
        {icon}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: any = {
    HIGH: { label: "สูงมาก", class: "text-red-700 bg-red-50 border-red-200" },
    MEDIUM: {
      label: "ปกติ",
      class: "text-amber-700 bg-amber-50 border-amber-200",
    },
    LOW: { label: "ต่ำ", class: "text-gray-600 bg-gray-100 border-gray-200" },
  };
  const active = config[priority] || config.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${active.class}`}
    >
      <AlertTriangle size={11} strokeWidth={2} />
      {active.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    OPEN: {
      label: "รอรับเรื่อง",
      icon: <Clock size={12} />,
      class: "bg-gray-600 text-white",
    },
    IN_PROGRESS: {
      label: "กำลังซ่อม",
      icon: <Settings2 size={12} />,
      class: "bg-blue-600 text-white",
    },
    DONE: {
      label: "เสร็จสิ้น",
      icon: <CheckCircle size={12} />,
      class: "bg-green-600 text-white",
    },
  };
  const active = config[status] || config.OPEN;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${active.class}`}
    >
      {active.icon}
      {active.label}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <div className="w-10 h-10 border-3 border-gray-200 border-t-black rounded-full animate-spin"></div>
      <p className="font-semibold text-black text-sm uppercase">
        Loading Records...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <Wrench size={48} className="text-gray-300 mb-4" />
      <h3 className="text-black font-bold text-lg">ไม่พบรายการแจ้งซ่อม</h3>
      <p className="text-gray-600 font-medium mt-2 text-sm">
        ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น
      </p>
    </div>
  );
}
