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

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'it-repairs-modal-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
  }
}

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
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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

  // New states for Assignee & Realtime
  const [itStaff, setItStaff] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
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
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการรับเรื่อง");
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

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.problemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || repair.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: repairs.length,
    pending: repairs.filter((r) => r.status === "PENDING").length,
    inProgress: repairs.filter((r) => r.status === "IN_PROGRESS").length,
    completed: repairs.filter((r) => r.status === "COMPLETED").length,
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-white flex">


      <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-black">แจ้งซ่อมทั้งหมด</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-gray-600 font-medium">
                  จัดการคำขอรับบริการและการซ่อมบำรุงในระบบทั้งหมด
                </p>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                  <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-500 font-mono">
                    Updated: {lastUpdated.toLocaleTimeString('th-TH')}
                  </span>
                  <button
                    onClick={() => fetchRepairs()}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors ml-1"
                    title="Refresh Now"
                  >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
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

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {filteredRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          #{repair.ticketCode}
                        </span>
                        <StatusBadge status={repair.status} />
                      </div>
                      <h3 className="font-semibold text-black">{repair.problemTitle}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        แจ้งเมื่อ: {format(new Date(repair.createdAt), "dd MMM yy HH:mm", { locale: th })}
                      </p>
                    </div>
                    <UrgencyBadge urgency={repair.urgency} />
                  </div>

                  <div className="flex items-center gap-2 mb-3 mt-3">
                    <span className="text-xs text-gray-400">ผู้รับผิดชอบ:</span>
                    {repair.assignee?.name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {repair.assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700">{repair.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">- ไม่ระบุ -</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 bg-gray-50 p-2 rounded-lg">
                    {repair.status === "PENDING" && (
                      <button
                        onClick={() => handleAcceptRepair(repair.id)}
                        disabled={submitting}
                        className="px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 text-xs font-medium"
                      >
                        รับเรื่อง
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedRepair(repair)}
                      className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm"
                    >
                      <Eye size={16} />
                    </button>
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
                          {repair.problemTitle}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          แจ้งเมื่อ:{" "}
                          {format(new Date(repair.createdAt), "dd/MM/yy HH:mm")}
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
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20"
            style={{
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            }}
          >
            {/* Glassmorphism Header */}
            <div 
              className="relative px-8 py-6 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
              }}
            >
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-purple-500 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg">
                      <Wrench className="text-white" size={26} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center border-2 border-white shadow-md">
                      <span className="text-[8px] font-bold text-white">IT</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        รายละเอียดการแจ้งซ่อม
                      </h2>
                      <StatusBadge status={selectedRepair.status} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-300 font-mono bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        #{selectedRepair.ticketCode}
                      </span>
                      <UrgencyBadge urgency={selectedRepair.urgency} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRepair(null)}
                  className="group w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 hover:scale-105"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Status Workflow Stepper */}
            <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: selectedRepair.status === 'PENDING' ? '0%' : 
                             selectedRepair.status === 'IN_PROGRESS' ? '33%' : 
                             selectedRepair.status === 'WAITING_PARTS' ? '50%' : 
                             selectedRepair.status === 'COMPLETED' ? '100%' : '0%' 
                    }}
                  ></div>
                </div>
                
                {/* Steps */}
                {[
                  { key: 'PENDING', icon: Clock, label: 'รอรับเรื่อง', color: 'gray' },
                  { key: 'IN_PROGRESS', icon: Settings2, label: 'กำลังดำเนินการ', color: 'blue' },
                  { key: 'WAITING_PARTS', icon: Clock, label: 'รออะไหล่', color: 'orange' },
                  { key: 'COMPLETED', icon: CheckCircle, label: 'เสร็จสิ้น', color: 'green' },
                ].map((step, index) => {
                  const isActive = selectedRepair.status === step.key;
                  const isPassed = ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED'].indexOf(selectedRepair.status) > index;
                  const StepIcon = step.icon;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive ? `bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 text-white shadow-lg scale-110` : 
                          isPassed ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 
                          'bg-white border-2 border-gray-200 text-gray-400'}
                      `}
                      style={isActive ? {
                        boxShadow: `0 0 0 4px ${step.color === 'gray' ? 'rgba(107, 114, 128, 0.2)' : 
                                    step.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 
                                    step.color === 'orange' ? 'rgba(249, 115, 22, 0.2)' : 
                                    'rgba(34, 197, 94, 0.2)'}`
                      } : {}}
                      >
                        {isPassed && !isActive ? <CheckCircle size={18} /> : <StepIcon size={18} />}
                      </div>
                      <span className={`text-[10px] mt-2 font-semibold transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8 overflow-y-auto max-h-[55vh] space-y-6 bg-gradient-to-b from-white to-gray-50/50">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - Reporter Info */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Reporter Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 opacity-90"></div>
                    <div className="relative pt-10 pb-5 px-5">
                      {/* Avatar */}
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-xl border-4 border-white">
                            <span className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {(selectedRepair.reporterName || selectedRepair.user?.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center border-3 border-white shadow-md">
                            <User className="text-white" size={14} />
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-center text-lg font-bold text-gray-900 mb-1">
                        {selectedRepair.reporterName || selectedRepair.user?.name || "ไม่ระบุชื่อ"}
                      </h3>
                      <p className="text-center text-sm text-gray-500 mb-4">
                        {selectedRepair.reporterDepartment || selectedRepair.user?.department || "ไม่ระบุแผนก"}
                      </p>
                      
                      {/* Contact Info */}
                      <div className="space-y-3">
                        {selectedRepair.reporterPhone && (
                          <a 
                            href={`tel:${selectedRepair.reporterPhone}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 hover:from-green-100 hover:to-emerald-100 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                              <Phone className="text-white" size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">โทรศัพท์</p>
                              <p className="text-sm font-semibold text-green-700">{selectedRepair.reporterPhone}</p>
                            </div>
                          </a>
                        )}
                        
                        {selectedRepair.reporterLineId && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00B900]/5 to-[#00C300]/5 border border-[#00B900]/20">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B900] to-[#00C300] flex items-center justify-center shadow-md">
                              <MessageCircle className="text-white" size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">LINE</p>
                              <p className="text-sm font-mono font-semibold text-[#00B900]">{selectedRepair.reporterLineId.slice(0, 12)}...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <User className="text-indigo-600" size={16} />
                      </div>
                      ผู้รับผิดชอบ
                    </h4>
                    {selectedRepair.assignee?.name ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
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
                <div className="lg:col-span-3 space-y-4">
                  {/* Problem Title Card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertCircle className="text-red-600" size={16} />
                      </div>
                      รายละเอียดปัญหา
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">หัวข้อแจ้งซ่อม</p>
                        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-100">
                          <p className="text-base font-semibold text-gray-900 leading-relaxed">
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
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 border border-purple-100">
                            <FileText className="text-purple-500" size={18} />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">ประเภท</p>
                              <p className="text-sm font-semibold text-purple-700">{selectedRepair.problemCategory}</p>
                            </div>
                          </div>
                        )}
                        {selectedRepair.location && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                            <MapPin className="text-amber-500" size={18} />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">สถานที่</p>
                              <p className="text-sm font-semibold text-amber-700">{selectedRepair.location}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Calendar className="text-blue-600" size={16} />
                      </div>
                      ไทม์ไลน์
                    </h4>
                    
                    <div className="relative pl-6 space-y-4">
                      {/* Timeline Line */}
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-green-200 rounded-full"></div>
                      
                      {/* Created */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-4 w-4 h-4 rounded-full bg-blue-500 border-3 border-white shadow-md"></div>
                        <div className="flex-1 ml-2">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">แจ้งซ่อม</p>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(selectedRepair.createdAt), "dd MMMM yyyy เวลา HH:mm น.", { locale: th })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Updated */}
                      {selectedRepair.updatedAt && selectedRepair.updatedAt !== selectedRepair.createdAt && (
                        <div className="relative flex items-start gap-4">
                          <div className="absolute -left-4 w-4 h-4 rounded-full bg-indigo-500 border-3 border-white shadow-md"></div>
                          <div className="flex-1 ml-2">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">อัปเดตล่าสุด</p>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(selectedRepair.updatedAt), "dd MMMM yyyy เวลา HH:mm น.", { locale: th })}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Completed */}
                      {selectedRepair.completedAt && (
                        <div className="relative flex items-start gap-4">
                          <div className="absolute -left-4 w-4 h-4 rounded-full bg-green-500 border-3 border-white shadow-md">
                            <CheckCircle className="text-white" size={10} />
                          </div>
                          <div className="flex-1 ml-2">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">เสร็จสิ้น</p>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(selectedRepair.completedAt), "dd MMMM yyyy เวลา HH:mm น.", { locale: th })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedRepair.notes && (
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-sm">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <FileText className="text-amber-600" size={16} />
                        </div>
                        หมายเหตุ
                      </h4>
                      <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap pl-10">
                        {selectedRepair.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 px-8 py-5">
              <div className="flex items-center gap-3">
                {selectedRepair.status === "PENDING" && (
                  <button
                    onClick={() => handleAcceptRepair(selectedRepair.id)}
                    disabled={submitting}
                    className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CheckCircle size={18} className="relative z-10" />
                    <span className="relative z-10">{submitting ? "กำลังบันทึก..." : "รับเรื่องนี้"}</span>
                  </button>
                )}
                {selectedRepair.status !== "COMPLETED" && selectedRepair.status !== "CANCELLED" && (
                  <button
                    onClick={handleOpenEdit}
                    className="group flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800"
                  >
                    <Settings2 size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    แก้ไขข้อมูล
                  </button>
                )}
                <button
                  onClick={() => setSelectedRepair(null)}
                  className="ml-auto flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <X size={16} />
                  ปิด
                </button>
              </div>
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
            {/* Premium Header */}
            <div 
              className="relative px-8 py-6 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
              }}
            >
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg">
                    <Settings2 className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      แก้ไขรายละเอียด
                    </h2>
                    <p className="text-sm text-gray-300 font-mono mt-0.5">
                      #{selectedRepair.ticketCode}
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
            <div className="p-8 space-y-6 bg-gradient-to-b from-white to-gray-50/50 max-h-[60vh] overflow-y-auto">
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
                <div className="grid grid-cols-4 gap-2">
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
            <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 px-8 py-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={submitting}
                  className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CheckCircle size={18} className="relative z-10" />
                  <span className="relative z-10">{submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</span>
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <X size={16} />
                  ยกเลิก
                </button>
              </div>
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

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: any = {
    CRITICAL: { label: "ด่วนมาก", class: "text-red-700 bg-red-50 border-red-200" },
    URGENT: {
      label: "ด่วน",
      class: "text-amber-700 bg-amber-50 border-amber-200",
    },
    NORMAL: { label: "ปกติ", class: "text-gray-600 bg-gray-100 border-gray-200" },
  };
  const active = config[urgency] || config.NORMAL;
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
    PENDING: {
      label: "รอรับเรื่อง",
      icon: <Clock size={12} />,
      class: "bg-gray-600 text-white",
    },
    IN_PROGRESS: {
      label: "กำลังซ่อม",
      icon: <Settings2 size={12} />,
      class: "bg-blue-600 text-white",
    },
    WAITING_PARTS: {
      label: "รออะไหล่",
      icon: <Clock size={12} />,
      class: "bg-orange-500 text-white",
    },
    COMPLETED: {
      label: "เสร็จสิ้น",
      icon: <CheckCircle size={12} />,
      class: "bg-green-600 text-white",
    },
    CANCELLED: {
      label: "ยกเลิก",
      icon: <AlertCircle size={12} />,
      class: "bg-red-600 text-white",
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
