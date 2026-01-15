"use client";

// CSS Animations for Modal
const modalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.98); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }
`;

// Inject styles is now handled inside the component to avoid hydration mismatches


import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  User,
  Phone,
  Building2,
  MessageCircle,
  MapPin,
  FileText,
  Calendar,
  Share2,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { safeFormat } from "@/lib/date-utils";

// --- Types ---
interface RepairTicket {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription?: string;
  problemCategory?: string;
  location?: string;
  status: "PENDING" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "CANCELLED";
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  assignee?: { id: number; name: string; email?: string };
  // Reporter information
  reporterName?: string;
  reporterDepartment?: string;
  reporterPhone?: string;
  reporterLineId?: string;
  // User relation (owner of ticket)
  user?: {
    id: number;
    name: string;
    email?: string;
    department?: string;
  };
  notes?: string;
  logs?: RepairLog[];
}

interface RepairLog {
  id: number;
  status: string;
  comment?: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
  };
}

interface User {
  id: number;
  name: string;
  department?: string;
  email?: string;
}

export default function ITRepairsPage() {
  const router = useRouter();
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks' | 'completed'>('available');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedRepair, setSelectedRepair] = useState<RepairTicket | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    priority: string;
    description: string;
    assigneeId: string;
  }>({
    title: "",
    priority: "NORMAL",
    description: "",
    assigneeId: "",
  });

  // Transfer State
  const [selectionForTransfer, setSelectionForTransfer] = useState<RepairTicket | null>(null);

  // New states for Assignee & Realtime
  const [itStaff, setItStaff] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchRepairs = useCallback(async (isBackground = false) => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      if (!isBackground) setLoading(true);
      const data = await apiFetch("/api/repairs");
      setRepairs(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch repairs:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [router]);

  const fetchSupportingData = async () => {
    try {
      // Fetch IT Staff
      const staff = await apiFetch("/users/it-staff");
      if (Array.isArray(staff)) setItStaff(staff);

      // Fetch Current User
      const profile = await apiFetch("/auth/profile");
      if (profile) setCurrentUser(profile);
    } catch (err) {
      console.error("Failed to fetch supporting data:", err);
    }
  };

  useEffect(() => {
    // Inject styles
    const styleId = 'it-repairs-modal-styles';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = modalStyles;
      document.head.appendChild(styleSheet);
    }

    fetchRepairs();
    fetchSupportingData();

    // Polling every 10 seconds
    const interval = setInterval(() => {
      if (isAutoRefresh) {
        fetchRepairs(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRepairs, isAutoRefresh]);

  const handleAcceptRepair = async (id: number) => {
    if (!currentUser) {
      alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาล็อกอินใหม่");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch(`/api/repairs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "IN_PROGRESS",
          assignedTo: currentUser.id, // Auto-assign to self
        }),
      });
      fetchRepairs();
      if (selectedRepair?.id === id) {
        setSelectedRepair(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRepair = async (id: number) => {
    if (!confirm("ยืนยันการเสร็จสิ้นงานซ่อมนี้?")) return;
    try {
      setSubmitting(true);
      await apiFetch(`/api/repairs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        }),
      });
      fetchRepairs();
      setSelectedRepair(null);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกงานเสร็จสิ้น");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (selectedRepair) {
      setEditForm({
        title: selectedRepair.problemTitle,
        priority: selectedRepair.urgency,
        description: selectedRepair.problemDescription || "",
        assigneeId: selectedRepair.assignee?.id.toString() || "",
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
      await apiFetch(`/api/repairs/${selectedRepair.id}`, {
        method: "PUT",
        body: JSON.stringify({
          problemTitle: editForm.title,
          problemDescription: editForm.description,
          urgency: editForm.priority,
          assignedTo: editForm.assigneeId ? parseInt(editForm.assigneeId) : null,
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

  const handleTransferRepair = async (id: number, newAssigneeId: number) => {
    try {
      setSubmitting(true);
      await apiFetch(`/api/repairs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          assignedTo: newAssigneeId,
        }),
      });
      fetchRepairs();
      setSelectionForTransfer(null);
      if (selectedRepair?.id === id) {
        setSelectedRepair(null);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการโอนงาน");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRepairs = repairs.filter((repair) => {
    // 1. Tab Based Filter (Logical Ownership)
    const isUnassigned = !repair.assignee;
    const isAssignedToMe = repair.assignee?.id === currentUser?.id;
    const isCompleted = repair.status === "COMPLETED";

    let matchesTab = false;
    if (activeTab === 'available') {
      matchesTab = isUnassigned && !isCompleted && repair.status !== "CANCELLED";
    } else if (activeTab === 'my-tasks') {
      matchesTab = isAssignedToMe && !isCompleted && repair.status !== "CANCELLED";
    } else if (activeTab === 'completed') {
      matchesTab = isCompleted;
    }

    if (!matchesTab) return false;

    // 2. Search & Sub-filters
    const matchesSearch =
      repair.problemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      filterStatus === "all" || repair.status === filterStatus;
      
    const matchesPriority =
      filterPriority === "all" || repair.urgency === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const allStats = {
    available: repairs.filter(r => !r.assignee && r.status !== "COMPLETED" && r.status !== "CANCELLED").length,
    myTasks: repairs.filter(r => r.assignee?.id === currentUser?.id && r.status !== "COMPLETED" && r.status !== "CANCELLED").length,
    completed: repairs.filter(r => r.status === "COMPLETED").length,
    urgent: repairs.filter(r => r.urgency === "CRITICAL" || r.urgency === "URGENT").length
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5 md:pb-6">
            <div className="flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-black tracking-tight">แจ้งซ่อมทั้งหมด</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5 md:mt-2">
                <p className="text-[10px] md:text-base text-gray-600 font-medium leading-relaxed">
                  จัดการคำขอรับบริการและการซ่อมบำรุงในระบบทั้งหมด
                </p>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-[8px] md:text-xs text-gray-500 font-mono">
                    Updated: {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '...'}
                  </span>
                  <button
                    onClick={() => fetchRepairs()}
                    className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                    title="Refresh Now"
                  >
                    <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Contextual */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard
              label={activeTab === 'available' ? "งานรอรับสิทธิ์" : activeTab === 'my-tasks' ? "งานที่กำลังทำ" : "จบงานแล้ว"}
              count={activeTab === 'available' ? allStats.available : activeTab === 'my-tasks' ? allStats.myTasks : allStats.completed}
              icon={<Wrench className="text-black" size={20} />}
            />
            <StatCard
              label="งานเร่งด่วน"
              count={allStats.urgent}
              icon={<AlertCircle className="text-red-500" size={20} />}
            />
            <StatCard
              label="งานของฉัน"
              count={allStats.myTasks}
              icon={<User className="text-blue-500" size={20} />}
            />
            <StatCard
              label="งานทั้งหมดอาทิตย์นี้"
              count={repairs.length}
              icon={<CheckCircle className="text-emerald-500" size={20} />}
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl w-full md:w-fit border border-gray-200 shadow-sm mt-4">
            {[
              { id: 'available', label: 'งานรอรับ', icon: <Clock size={14} />, count: allStats.available },
              { id: 'my-tasks', label: 'งานของฉัน', icon: <User size={14} />, count: allStats.myTasks },
              { id: 'completed', label: 'งานเสร็จสิ้น', icon: <CheckCircle size={14} />, count: allStats.completed },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'available' | 'my-tasks' | 'completed')}
                className={`flex flex-1 md:flex-none items-center justify-center md:justify-start gap-1.5 md:gap-2 px-2 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-lg scale-[1.02] md:scale-105'
                    : 'text-gray-500 hover:text-black hover:bg-white/50'
                }`}
              >
                <div className="flex items-center gap-1">
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </div>
                <span className={`flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[8px] md:text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้แจ้ง, รหัสตั๋ว..."
                className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex md:w-auto">
              <select
                className="px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none shadow-sm font-medium text-[11px] md:text-sm appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="PENDING">รอรับเรื่อง</option>
                <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                <option value="WAITING_PARTS">รออะไหล่</option>
              </select>
              <select
                className="px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none shadow-sm font-medium text-[11px] md:text-sm appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">ทุกความสำคัญ</option>
                <option value="CRITICAL">ด่วนมาก</option>
                <option value="URGENT">ด่วน</option>
                <option value="NORMAL">ปกติ</option>
              </select>
            </div>
          </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filteredRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="max-w-[70%]">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-bold font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          #{repair.ticketCode}
                        </span>
                        <StatusBadge status={repair.status} />
                      </div>
                      <h3 className="font-bold text-black text-sm md:text-base leading-snug line-clamp-2">{repair.problemTitle}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
                        <Clock size={10} />
                        <span className="text-[10px] md:text-xs">
                          {safeFormat(repair.createdAt, "dd MMM yy HH:mm")}
                        </span>
                      </div>
                    </div>
                    <UrgencyBadge urgency={repair.urgency} />
                  </div>

                  <div className="flex items-center justify-between mb-4 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                        {repair.assignee?.name ? repair.assignee.name.charAt(0).toUpperCase() : <User size={14} className="text-gray-300" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700 leading-tight">
                          {repair.assignee?.name || "รอมอบหมาย"}
                        </span>
                        <span className="text-[9px] text-gray-400">ผู้รับผิดชอบ</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'available' ? (
                      <button
                        onClick={() => handleAcceptRepair(repair.id)}
                        disabled={submitting}
                        className="flex-1 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50 text-[11px] font-bold shadow-lg shadow-black/5 active:scale-[0.98]"
                      >
                        รับเรื่องดูแล
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectionForTransfer(repair)}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-[11px] font-bold active:scale-[0.98]"
                        >
                          โอนงาน
                        </button>
                        <button
                          onClick={() => setSelectedRepair(repair)}
                          className="flex-1 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-[11px] font-bold active:scale-[0.98]"
                        >
                          รายละเอียด
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {filteredRepairs.length === 0 && <EmptyState />}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
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
                    {activeTab !== 'available' && activeTab !== 'completed' && (
                      <th className="px-6 py-3 text-xs font-bold text-black uppercase border-b border-gray-100">
                        ผู้รับผิดชอบ
                      </th>
                    )}
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
                          {repair.problemTitle}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          แจ้งเมื่อ:{" "}
                          {safeFormat(repair.createdAt, "dd/MM/yy HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <UrgencyBadge urgency={repair.urgency} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={repair.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-black">
                          {repair.assignee?.name ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {repair.assignee.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[100px]">{repair.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              - ไม่ระบุ -
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {repair.status === "PENDING" && (
                            <button
                              onClick={() => handleAcceptRepair(repair.id)}
                              disabled={submitting}
                              className="bg-black text-white p-2 rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 text-xs font-medium"
                              title="รับเรื่อง"
                            >
                              รับเรื่อง
                            </button>
                          )}
                          {repair.status !== "COMPLETED" && (
                            <button
                              onClick={() => setSelectionForTransfer(repair)}
                              className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                              title="โอนงาน"
                            >
                              <Share2 size={16} strokeWidth={2} />
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

      {/* Detail Modal - Production Grade */}
      {selectedRepair && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => e.target === e.currentTarget && setSelectedRepair(null)}
        >
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20"
            style={{
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            }}
          >
            {/* Solid Dark Header */}
            <div 
              className="relative px-8 py-6 overflow-hidden bg-neutral-900"
            >
              {/* Subtle pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg">
                      <Wrench className="text-white" size={20} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center border-2 border-neutral-900 shadow-md">
                      <span className="text-[6px] font-bold text-neutral-900">IT</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                        รายละเอียดการแจ้งซ่อม
                      </h2>
                      <StatusBadge status={selectedRepair.status} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] md:text-sm text-gray-300 font-mono bg-white/10 px-2 md:px-3 py-0.5 md:py-1 rounded-full backdrop-blur-sm">
                        #{selectedRepair.ticketCode}
                      </span>
                      <UrgencyBadge urgency={selectedRepair.urgency} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRepair(null)}
                  className="group w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 hover:scale-105"
                >
                  <X size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Status Workflow Stepper */}
            <div className="px-5 md:px-8 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 overflow-x-auto no-scrollbar">
              <div className="flex items-center justify-between relative min-w-[500px] md:min-w-0">
                {/* Progress Line */}
                <div className="absolute top-5 left-8 right-8 h-0.5 bg-neutral-200 rounded-full">
                  <div 
                    className="h-full bg-black rounded-full transition-all duration-500"
                    style={{ 
                      width: `${
                        selectedRepair?.status === "PENDING" ? "0%" :
                        selectedRepair?.status === "IN_PROGRESS" ? "33%" :
                        selectedRepair?.status === "WAITING_PARTS" ? "66%" :
                        "100%"
                      }`
                    }}
                  ></div>
                </div>
                
                {/* Steps */}
                {[
                  { key: 'PENDING', icon: Clock, label: 'รอรับเรื่อง' },
                  { key: 'IN_PROGRESS', icon: Settings2, label: 'กำลังดำเนินการ' },
                  { key: 'WAITING_PARTS', icon: Clock, label: 'รออะไหล่' },
                  { key: 'COMPLETED', icon: CheckCircle, label: 'เสร็จสิ้น' },
                ].map((step, index) => {
                  const StepIcon = step.icon;
                  const isPassed = selectedRepair && ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED'].indexOf(selectedRepair.status) >= index;
                  const isActive = selectedRepair && selectedRepair.status === step.key;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive ? 'bg-black text-white shadow-lg scale-100 md:scale-110' : 
                          isPassed ? 'bg-neutral-800 text-white' : 
                          'bg-white border-2 border-neutral-200 text-neutral-400'}
                      `}
                      style={isActive ? {
                        boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)'
                      } : {}}
                      >
                        {isPassed && !isActive ? <CheckCircle size={16} /> : <StepIcon size={16} />}
                      </div>
                      <span className={`text-[9px] md:text-[10px] mt-1 md:mt-2 font-semibold transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="p-5 md:p-8 overflow-y-auto max-h-[60vh] md:max-h-[55vh] space-y-6 bg-gradient-to-b from-white to-gray-50/50">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left Column - Reporter Info */}
                <div className="md:col-span-2 space-y-4">
                  {/* Reporter Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-0 left-0 right-0 h-20 bg-neutral-900"></div>
                    <div className="relative pt-10 pb-5 px-5">
                      {/* Avatar */}
                      <div className="flex justify-center mb-3">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg border-4 border-white">
                            <span className="text-2xl font-bold text-neutral-800">
                              {(selectedRepair.reporterName || selectedRepair.user?.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center border-2 border-white shadow-md">
                            <User className="text-white" size={12} />
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-center text-base font-bold text-gray-900 mb-0.5">
                        {selectedRepair.reporterName || selectedRepair.user?.name || "ไม่ระบุชื่อ"}
                      </h3>
                      <p className="text-center text-xs text-gray-500 mb-3">
                        {selectedRepair.reporterDepartment || selectedRepair.user?.department || "ไม่ระบุแผนก"}
                      </p>
                      
                      {/* Contact Info */}
                      <div className="space-y-3">
                        {selectedRepair.reporterPhone && (
                          <a 
                            href={`tel:${selectedRepair.reporterPhone}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                              <Phone className="text-white" size={18} />
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">โทรศัพท์</p>
                              <p className="text-xs font-semibold text-neutral-700">{selectedRepair.reporterPhone}</p>
                            </div>
                          </a>
                        )}
                        
                        {selectedRepair.reporterLineId && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
                            <div className="w-10 h-10 rounded-xl bg-neutral-700 flex items-center justify-center shadow-md">
                              <MessageCircle className="text-white" size={18} />
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">LINE</p>
                              <p className="text-xs font-mono font-semibold text-neutral-700">{selectedRepair.reporterLineId.slice(0, 10)}...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                        <User className="text-neutral-600" size={16} />
                      </div>
                      ผู้รับผิดชอบ
                    </h4>
                    {selectedRepair?.assignee?.name ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shadow-md">
                          <span className="text-white font-bold">{selectedRepair.assignee.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{selectedRepair.assignee.name}</p>
                          <p className="text-xs text-gray-500">เจ้าหน้าที่ IT</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <User className="text-gray-400" size={18} />
                        </div>
                        <p className="text-sm text-gray-400 italic">ยังไม่มีผู้รับผิดชอบ</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Problem Details */}
                <div className="md:col-span-3 space-y-4">
                  {/* Problem Title Card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                        <AlertCircle className="text-neutral-600" size={16} />
                      </div>
                      รายละเอียดปัญหา
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">หัวข้อแจ้งซ่อม</p>
                        <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                            {selectedRepair.problemTitle}
                          </p>
                        </div>
                      </div>
                      
                      {selectedRepair.problemDescription && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">รายละเอียดเพิ่มเติม</p>
                          <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-100">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {selectedRepair.problemDescription}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Category & Location */}
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRepair.problemCategory && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
                            <FileText className="text-neutral-500" size={18} />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">ประเภท</p>
                              <p className="text-sm font-semibold text-neutral-700">{selectedRepair.problemCategory}</p>
                            </div>
                          </div>
                        )}
                        {selectedRepair.location && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
                            <MapPin className="text-neutral-500" size={18} />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">สถานที่</p>
                              <p className="text-sm font-semibold text-neutral-700">{selectedRepair.location}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                        <Calendar className="text-neutral-600" size={16} />
                      </div>
                      ไทม์ไลน์
                    </h4>
                    
                    <div className="relative pl-6 space-y-4">
                      {/* Timeline Line */}
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-neutral-200 rounded-full"></div>
                      
                      {/* Logs Timeline */}
                      {selectedRepair.logs && selectedRepair.logs.length > 0 ? (
                        selectedRepair.logs.map((log, idx) => (
                          <div key={log.id} className="relative flex items-start gap-4 animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                            {/* Dot */}
                            <div className={`absolute -left-4 w-4 h-4 rounded-full border-3 border-white shadow-md transition-colors ${
                              idx === 0 ? 'bg-neutral-900 scale-110' : 'bg-neutral-300'
                            }`}></div>
                            
                            <div className="flex-1 ml-2">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  idx === 0 ? 'text-neutral-900' : 'text-neutral-500'
                                }`}>
                                  {log.status === "PENDING" ? "เปิดตั๋ว" : 
                                   log.status === "IN_PROGRESS" ? "รับเรื่องดำเนินการ" :
                                   log.status === "WAITING_PARTS" ? "รออะไหล่" :
                                   log.status === "COMPLETED" ? "เสร็จสิ้น" :
                                   log.status === "CANCELLED" ? "ยกเลิก" : log.status}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {format(new Date(log.createdAt), "dd/MM/yy HH:mm")}
                                </span>
                              </div>
                              <div className="bg-neutral-50/50 rounded-lg p-2.5 border border-neutral-100 group-hover:border-neutral-200 transition-colors">
                                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                  {log.comment || "ไม่มีคำอธิบายเพิ่มเติม"}
                                </p>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <div className="w-4 h-4 bg-neutral-200 rounded-full flex items-center justify-center text-[8px] font-bold text-neutral-600">
                                    {log.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-[9px] text-gray-400">โดย {log.user.name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        /* Fallback to simple timeline if no logs */
                        <>
                          <div className="relative flex items-start gap-4">
                            <div className="absolute -left-4 w-4 h-4 rounded-full bg-neutral-800 border-3 border-white shadow-md"></div>
                            <div className="flex-1 ml-2">
                              <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">แจ้งซ่อม</p>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(selectedRepair.createdAt), "dd MMMM yyyy เวลา HH:mm น.", { locale: th })}
                              </p>
                            </div>
                          </div>
                          {selectedRepair.completedAt && (
                            <div className="relative flex items-start gap-4">
                              <div className="absolute -left-4 w-4 h-4 rounded-full bg-black border-3 border-white shadow-md">
                                <CheckCircle className="text-white" size={10} />
                              </div>
                              <div className="flex-1 ml-2">
                                <p className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">เสร็จสิ้น</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {format(new Date(selectedRepair.completedAt), "dd MMMM yyyy เวลา HH:mm น.", { locale: th })}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedRepair?.notes && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-800 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                          <FileText className="text-neutral-600" size={16} />
                        </div>
                        หมายเหตุ
                      </h4>
                      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap pl-10">
                        {selectedRepair.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 px-5 md:px-8 py-4 md:py-5">
                {/* Action Buttons - Contextual */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Case 1: Unassigned - Show Accept Only */}
                  {selectedRepair && !selectedRepair.assignee && selectedRepair.status === "PENDING" && (
                    <button
                      onClick={() => handleAcceptRepair(selectedRepair.id)}
                      disabled={submitting}
                      className="flex-1 sm:flex-none group relative flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CheckCircle size={18} className="relative z-10" />
                      <span className="relative z-10">รับเรื่องดูแลงานซ่อมนี้</span>
                    </button>
                  )}

                  {/* Case 2: Assigned to ME - Show Complete/Transfer/Edit */}
                  {selectedRepair && selectedRepair.assignee?.id === currentUser?.id && selectedRepair.status !== "COMPLETED" && (
                    <>
                      <button
                        onClick={() => handleCompleteRepair(selectedRepair.id)}
                        disabled={submitting}
                        className="flex-1 sm:flex-none group relative flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CheckCircle size={18} className="relative z-10" />
                        <span className="relative z-10">กดจบงาน (Complete)</span>
                      </button>

                      <button
                        onClick={handleOpenEdit}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-zinc-200 text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <Settings2 size={18} />
                        แก้ไข / ส่งต่องาน
                      </button>
                    </>
                  )}

                  {/* Case 3: Assigned to Others (Viewing only) */}
                  {selectedRepair?.assignee && selectedRepair.assignee.id !== currentUser?.id && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-xs font-bold shadow-sm">
                      <User size={14} />
                      งานนี้อยู่ในความรับผิดชอบของ {selectedRepair.assignee.name || "เจ้าหน้าที่คนอื่น"}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedRepair(null)}
                  className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all duration-200"
                >
                  <X size={16} />
                  ปิดหน้าต่างนี้
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Production Grade */}
      {showEditModal && selectedRepair && (
        <div 
          className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20"
            style={{
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            }}
          >
            {/* Solid Dark Header */}
            <div 
              className="relative px-8 py-6 overflow-hidden bg-neutral-900"
            >
              {/* Subtle pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg">
                    <Settings2 className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      แก้ไขรายละเอียด
                    </h2>
                    <p className="text-sm text-gray-300 font-mono mt-0.5">
                      #{selectedRepair?.ticketCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="group w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 hover:scale-105"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 md:p-8 space-y-5 md:space-y-6 bg-gradient-to-b from-white to-gray-50/50 max-h-[70vh] md:max-h-[60vh] overflow-y-auto">
              {/* Problem Title Field */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="text-red-600" size={16} />
                  </div>
                  หัวข้อแจ้งซ่อม
                </label>
                <div className="relative">
                  <textarea
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-900 font-medium placeholder-gray-400 text-sm resize-none shadow-sm hover:border-gray-200"
                    rows={2}
                    placeholder="ระบุหัวข้อแจ้งซ่อม"
                  />
                </div>
              </div>

              {/* Priority Field */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="text-amber-600" size={16} />
                  </div>
                  ความเร่งด่วน
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'NORMAL', label: 'ปกติ', color: 'gray', bg: 'from-gray-100 to-gray-200', active: 'from-gray-600 to-gray-700' },
                    { value: 'URGENT', label: 'ด่วน', color: 'amber', bg: 'from-amber-100 to-orange-100', active: 'from-amber-500 to-orange-500' },
                    { value: 'CRITICAL', label: 'ด่วนมาก', color: 'red', bg: 'from-red-100 to-rose-100', active: 'from-red-500 to-rose-500' },
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, priority: priority.value })}
                      className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        editForm.priority === priority.value
                          ? `bg-gradient-to-br ${priority.active} text-white shadow-lg scale-[1.02]`
                          : `bg-gradient-to-br ${priority.bg} text-gray-700 hover:scale-[1.02] hover:shadow-md`
                      }`}
                    >
                      {editForm.priority === priority.value && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                          <CheckCircle className={`text-${priority.color}-500`} size={14} />
                        </div>
                      )}
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Field */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="text-blue-600" size={16} />
                  </div>
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-900 font-medium placeholder-gray-400 text-sm resize-none shadow-sm hover:border-gray-200"
                  rows={3}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                />
              </div>

              {/* Assignee Field */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <User className="text-indigo-600" size={16} />
                  </div>
                  ผู้รับผิดชอบ
                </label>
                <div className="relative">
                  <select
                    value={editForm.assigneeId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, assigneeId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-900 font-medium text-sm appearance-none cursor-pointer shadow-sm hover:border-gray-200"
                  >
                    <option value="">-- ยังไม่ระบุผู้รับผิดชอบ --</option>
                    {itStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} {staff.id === currentUser?.id ? "✓ (คุณ)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="text-gray-400 rotate-90" size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 px-6 md:px-8 py-4 md:py-5">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  onClick={handleSaveEdit}
                  disabled={submitting}
                  className="w-full sm:flex-1 group relative flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CheckCircle size={18} className="relative z-10" />
                  <span className="relative z-10">บันทึกการแก้ไข</span>
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all duration-200"
                >
                  <X size={16} />
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {selectionForTransfer && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setSelectionForTransfer(null)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp border border-gray-100">
            <div className="bg-neutral-900 px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Share2 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">โอนมอบหมายงาน</h3>
                  <p className="text-xs text-gray-400 font-mono">#{selectionForTransfer.ticketCode}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectionForTransfer(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 font-medium leading-relaxed">
                  เลือกเจ้าหน้าที่ IT ที่คุณต้องการโอนงานนี้ให้รับผิดชอบต่อ 
                  <span className="block mt-1 text-[10px] text-blue-500 font-normal italic">* ระบบจะบันทึกประวัติการโอนงานโดยอัตโนมัติ</span>
                </p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {itStaff.filter(staff => staff.id !== currentUser?.id).map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleTransferRepair(selectionForTransfer.id, staff.id)}
                    disabled={submitting}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl transition-all group active:scale-[0.98] border border-transparent hover:border-black"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 group-hover:bg-white/10 group-hover:border-white/20 group-hover:text-white transition-colors">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm leading-tight">{staff.name}</p>
                        <p className="text-[10px] opacity-60">{staff.department || "IT Department"}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                {itStaff.filter(staff => staff.id !== currentUser?.id).length === 0 && (
                  <div className="text-center py-8">
                    <User size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400 font-medium italic">ไม่พบเจ้าหน้าที่คนอื่นในระบบ</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setSelectionForTransfer(null)}
                className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
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

function StatCard({ label, count, icon }: { label: string; count: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 p-3 md:p-6 rounded-xl md:rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex flex-col">
        <span className="text-gray-500 text-[9px] md:text-xs font-bold uppercase tracking-tight md:tracking-widest">
          {label}
        </span>
        <span className="text-2xl md:text-4xl font-black text-neutral-900 mt-1 md:mt-2 tracking-tighter">{count}</span>
      </div>
      <div className="absolute -right-1 -bottom-1 opacity-5 md:opacity-10 scale-[1.5] md:scale-[2] pointer-events-none group-hover:scale-[1.8] md:group-hover:scale-[2.2] transition-transform duration-500">
        {icon}
      </div>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: any = {
    CRITICAL: { label: "ด่วนมาก", class: "bg-black text-white border-black font-bold" },
    URGENT: {
      label: "ด่วน",
      class: "bg-neutral-700 text-white border-neutral-700 font-semibold",
    },
    NORMAL: { label: "ปกติ", class: "bg-neutral-100 text-neutral-600 border-neutral-300" },
  };
  const active = config[urgency] || config.NORMAL;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${active.class}`}
    >
      <AlertTriangle size={11} strokeWidth={2} />
      {active.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
    PENDING: {
      label: "รอรับเรื่อง",
      icon: <Clock size={12} />,
      class: "bg-neutral-100 text-neutral-700 border border-neutral-300",
    },
    IN_PROGRESS: {
      label: "กำลังซ่อม",
      icon: <Settings2 size={12} />,
      class: "bg-neutral-800 text-white",
    },
    WAITING_PARTS: {
      label: "รออะไหล่",
      icon: <Clock size={12} />,
      class: "bg-neutral-200 text-neutral-700",
    },
    COMPLETED: {
      label: "เสร็จสิ้น",
      icon: <CheckCircle size={12} />,
      class: "bg-black text-white",
    },
    CANCELLED: {
      label: "ยกเลิก",
      icon: <AlertCircle size={12} />,
      class: "bg-neutral-100 text-neutral-500 line-through",
    },
  };
  const active = config[status] || config.PENDING;
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
