import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  X,
  User,
  Phone,
  Building2,
  Calendar,
  FileText,
  Settings
} from "lucide-react";

// Types
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
  reporterName?: string;
  reporterDepartment?: string;
  reporterPhone?: string;
  user?: { id: number; name: string; department?: string };
}

interface User {
  id: number;
  name: string;
  department?: string;
  email?: string;
}

// Mock Data
const mockTickets: RepairTicket[] = [
  {
    id: 1,
    ticketCode: "TK-2024-001",
    problemTitle: "คอมพิวเตอร์เปิดไม่ติด",
    problemDescription: "หน้าจอไม่มีสัญญาณ กดปุ่มเปิดแล้วไม่มีอะไรเกิดขึ้น",
    problemCategory: "Hardware",
    location: "อาคาร A ชั้น 3",
    status: "PENDING",
    urgency: "URGENT",
    createdAt: "2024-01-15T09:30:00",
    reporterName: "สมชาย ใจดี",
    reporterDepartment: "ฝ่ายบัญชี",
    reporterPhone: "081-234-5678",
  },
  {
    id: 2,
    ticketCode: "TK-2024-002",
    problemTitle: "Printer ไม่สามารถพิมพ์ได้",
    problemDescription: "เครื่องพิมพ์แสดงข้อความ Paper Jam แต่ไม่มีกระดาษติด",
    problemCategory: "Printer",
    location: "อาคาร B ชั้น 2",
    status: "IN_PROGRESS",
    urgency: "NORMAL",
    createdAt: "2024-01-14T14:20:00",
    assignee: { id: 1, name: "วิทยา เทคโนโลยี" },
    reporterName: "สมหญิง รักสะอาด",
    reporterDepartment: "ฝ่ายทรัพยากรบุคคล",
    reporterPhone: "089-765-4321",
  },
  {
    id: 3,
    ticketCode: "TK-2024-003",
    problemTitle: "อินเทอร์เน็ตช้ามาก",
    problemDescription: "เน็ตช้ามาก ใช้งานไม่ได้เลย",
    problemCategory: "Network",
    location: "อาคาร A ชั้น 5",
    status: "COMPLETED",
    urgency: "NORMAL",
    createdAt: "2024-01-13T10:15:00",
    completedAt: "2024-01-14T16:45:00",
    assignee: { id: 2, name: "ประสิทธิ์ ช่างซ่อม" },
    reporterName: "กมล การดี",
    reporterDepartment: "ฝ่ายการตลาด",
  },
];

const mockStaff: User[] = [
  { id: 1, name: "วิทยา เทคโนโลยี", department: "IT Support", email: "wittaya@company.com" },
  { id: 2, name: "ประสิทธิ์ ช่างซ่อม", department: "IT Support", email: "prasit@company.com" },
  { id: 3, name: "สมศักดิ์ แก้ไขได้", department: "IT Support", email: "somsak@company.com" },
];

export default function RepairManagement() {
  const [tickets, setTickets] = useState<RepairTicket[]>(mockTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    urgency: "NORMAL",
    assigneeId: "",
    status: "PENDING",
  });

  // Statistics
  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === "PENDING").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    completed: tickets.filter(t => t.status === "COMPLETED").length,
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchSearch = ticket.problemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleViewTicket = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    setIsEditMode(false);
  };

  const handleEditTicket = () => {
    if (selectedTicket) {
      setEditForm({
        title: selectedTicket.problemTitle,
        description: selectedTicket.problemDescription || "",
        urgency: selectedTicket.urgency,
        assigneeId: selectedTicket.assignee?.id.toString() || "",
        status: selectedTicket.status,
      });
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedTicket) {
      const updatedTickets = tickets.map(t => 
        t.id === selectedTicket.id 
          ? { 
              ...t, 
              problemTitle: editForm.title,
              problemDescription: editForm.description,
              urgency: editForm.urgency as any,
              status: editForm.status as any,
              assignee: editForm.assigneeId 
                ? mockStaff.find(s => s.id.toString() === editForm.assigneeId)
                : undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      setTickets(updatedTickets);
      setSelectedTicket(null);
      setIsEditMode(false);
    }
  };

  const handleAcceptTicket = (ticketId: number) => {
    const updatedTickets = tickets.map(t => 
      t.id === ticketId 
        ? { 
            ...t, 
            status: "IN_PROGRESS" as const,
            assignee: mockStaff[0],
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    setTickets(updatedTickets);
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">ระบบจัดการแจ้งซ่อม</h1>
              <p className="mt-1 text-sm text-gray-500">จัดการคำขอซ่อมบำรุงทั้งหมด</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800">
              <Plus size={16} className="mr-2" />
              สร้างรายการใหม่
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard label="ทั้งหมด" value={stats.total} icon={FileText} />
          <StatCard label="รอดำเนินการ" value={stats.pending} icon={Clock} />
          <StatCard label="กำลังดำเนินการ" value={stats.inProgress} icon={Settings} />
          <StatCard label="เสร็จสิ้น" value={stats.completed} icon={CheckCircle} />
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยหัวข้อหรือเลขที่ตั๋ว..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="PENDING">รอดำเนินการ</option>
                <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่ตั๋ว</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หัวข้อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้แจ้ง</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ความเร่งด่วน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้รับผิดชอบ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{ticket.ticketCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.problemTitle}</div>
                      <div className="text-sm text-gray-500">{ticket.problemCategory}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.reporterName}</div>
                      <div className="text-sm text-gray-500">{ticket.reporterDepartment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UrgencyBadge urgency={ticket.urgency} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.assignee ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {ticket.assignee.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{ticket.assignee.name}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">ยังไม่ระบุ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedTicket && !isEditMode && (
        <Modal onClose={() => setSelectedTicket(null)} title="รายละเอียดการแจ้งซ่อม">
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">เลขที่ตั๋ว</span>
                <span className="text-sm font-semibold text-gray-900">{selectedTicket.ticketCode}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">หัวข้อ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTicket.problemTitle}</p>
                </div>
                {selectedTicket.problemDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">รายละเอียด</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.problemDescription}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ประเภท</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.problemCategory}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานที่</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลผู้แจ้ง</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-900">{selectedTicket.reporterName}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Building2 size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-900">{selectedTicket.reporterDepartment}</span>
                </div>
                {selectedTicket.reporterPhone && (
                  <div className="flex items-center text-sm">
                    <Phone size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-900">{selectedTicket.reporterPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase">สถานะ</label>
                <div className="mt-2">
                  <StatusBadge status={selectedTicket.status} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase">ความเร่งด่วน</label>
                <div className="mt-2">
                  <UrgencyBadge urgency={selectedTicket.urgency} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase">ผู้รับผิดชอบ</label>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {selectedTicket.assignee?.name || "ยังไม่ระบุ"}
                </p>
              </div>
            </div>

            {/* Date Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center text-sm">
                <Calendar size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-500">วันที่แจ้ง:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(selectedTicket.createdAt).toLocaleString('th-TH')}
                </span>
              </div>
              {selectedTicket.completedAt && (
                <div className="flex items-center text-sm mt-2">
                  <CheckCircle size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-500">เสร็จสิ้นเมื่อ:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(selectedTicket.completedAt).toLocaleString('th-TH')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {selectedTicket.status === "PENDING" && (
              <button
                onClick={() => handleAcceptTicket(selectedTicket.id)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                รับเรื่อง
              </button>
            )}
            <button
              onClick={handleEditTicket}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              แก้ไข
            </button>
            <button
              onClick={() => setSelectedTicket(null)}
              className="ml-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ปิด
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {selectedTicket && isEditMode && (
        <Modal onClose={() => setIsEditMode(false)} title="แก้ไขรายละเอียด">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หัวข้อ</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ความเร่งด่วน</label>
                <select
                  value={editForm.urgency}
                  onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="NORMAL">ปกติ</option>
                  <option value="URGENT">ด่วน</option>
                  <option value="CRITICAL">ด่วนมาก</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                  <option value="WAITING_PARTS">รออะไหล่</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ผู้รับผิดชอบ</label>
              <select
                value={editForm.assigneeId}
                onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">ยังไม่ระบุ</option>
                {mockStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              บันทึก
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Components
function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: "รอดำเนินการ", className: "bg-gray-100 text-gray-800" },
    IN_PROGRESS: { label: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-800" },
    WAITING_PARTS: { label: "รออะไหล่", className: "bg-yellow-100 text-yellow-800" },
    COMPLETED: { label: "เสร็จสิ้น", className: "bg-green-100 text-green-800" },
    CANCELLED: { label: "ยกเลิก", className: "bg-red-100 text-red-800" },
  };
  const { label, className } = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { label: string; className: string }> = {
    NORMAL: { label: "ปกติ", className: "bg-gray-100 text-gray-800" },
    URGENT: { label: "ด่วน", className: "bg-orange-100 text-orange-800" },
    CRITICAL: { label: "ด่วนมาก", className: "bg-red-100 text-red-800" },
  };
  const { label, className } = config[urgency] || config.NORMAL;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}