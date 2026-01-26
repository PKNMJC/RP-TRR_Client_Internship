"use client";

import { useState, useMemo } from "react";
import {
  FileSearch,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  UserPlus,
  LogIn,
  LogOut,
  Settings,
  Calendar,
  Shield,
} from "lucide-react";

// Types
interface AuditLog {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  action: ActionType;
  module: ModuleType;
  description: string;
  ipAddress: string;
  timestamp: Date;
  status: "SUCCESS" | "FAILED" | "WARNING";
}

type ActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "VIEW"
  | "EXPORT";
type ModuleType = "REPAIR" | "LOAN" | "USER" | "SETTINGS" | "SYSTEM";

// Mock data สำหรับ demo
const generateMockLogs = (): AuditLog[] => {
  const actions: ActionType[] = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "VIEW",
    "EXPORT",
  ];
  const modules: ModuleType[] = [
    "REPAIR",
    "LOAN",
    "USER",
    "SETTINGS",
    "SYSTEM",
  ];
  const users = [
    { id: 1, name: "Admin User", email: "admin@example.com" },
    { id: 2, name: "IT Support", email: "it@example.com" },
    { id: 3, name: "John Doe", email: "john@example.com" },
  ];

  const logs: AuditLog[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const auditModule = modules[Math.floor(Math.random() * modules.length)];
    const hoursAgo = Math.floor(Math.random() * 48);

    logs.push({
      id: `log-${i + 1}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action,
      module: auditModule,
      description: getDescription(action, auditModule),
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
      status:
        Math.random() > 0.9
          ? "FAILED"
          : Math.random() > 0.95
            ? "WARNING"
            : "SUCCESS",
    });
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const getDescription = (action: ActionType, module: ModuleType): string => {
  const descriptions: Record<string, string> = {
    "CREATE-REPAIR": "สร้างรายการซ่อมใหม่",
    "UPDATE-REPAIR": "อัพเดตสถานะงานซ่อม",
    "DELETE-REPAIR": "ลบรายการซ่อม",
    "CREATE-LOAN": "สร้างรายการยืมใหม่",
    "UPDATE-LOAN": "อัพเดตสถานะการยืม",
    "DELETE-LOAN": "ลบรายการยืม",
    "CREATE-USER": "สร้างผู้ใช้ใหม่",
    "UPDATE-USER": "แก้ไขข้อมูลผู้ใช้",
    "DELETE-USER": "ลบบัญชีผู้ใช้",
    "LOGIN-SYSTEM": "เข้าสู่ระบบ",
    "LOGOUT-SYSTEM": "ออกจากระบบ",
    "UPDATE-SETTINGS": "แก้ไขการตั้งค่าระบบ",
    "VIEW-REPAIR": "ดูรายละเอียดงานซ่อม",
    "EXPORT-REPAIR": "Export ข้อมูลงานซ่อม",
  };

  return descriptions[`${action}-${module}`] || `${action} on ${module}`;
};

export default function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>(generateMockLogs());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<ActionType | "ALL">("ALL");
  const [filterModule, setFilterModule] = useState<ModuleType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "SUCCESS" | "FAILED" | "WARNING"
  >("ALL");

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm);

      const matchesAction =
        filterAction === "ALL" || log.action === filterAction;
      const matchesModule =
        filterModule === "ALL" || log.module === filterModule;
      const matchesStatus =
        filterStatus === "ALL" || log.status === filterStatus;

      return matchesSearch && matchesAction && matchesModule && matchesStatus;
    });
  }, [logs, searchTerm, filterAction, filterModule, filterStatus]);

  const handleExport = () => {
    // Mock export function
    alert("Export functionality - จะ export ข้อมูล Audit Logs เป็น CSV");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                <FileSearch size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">Audit Logs</h1>
                <p className="text-sm text-zinc-500">
                  ติดตามกิจกรรมและการเปลี่ยนแปลงในระบบ
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-zinc-200 p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อผู้ใช้, อีเมล, คำอธิบาย หรือ IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700">Filters:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action Filter */}
            <select
              value={filterAction}
              onChange={(e) =>
                setFilterAction(e.target.value as ActionType | "ALL")
              }
              className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="VIEW">View</option>
              <option value="EXPORT">Export</option>
            </select>

            {/* Module Filter */}
            <select
              value={filterModule}
              onChange={(e) =>
                setFilterModule(e.target.value as ModuleType | "ALL")
              }
              className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="ALL">All Modules</option>
              <option value="REPAIR">Repair</option>
              <option value="LOAN">Loan</option>
              <option value="USER">User</option>
              <option value="SETTINGS">Settings</option>
              <option value="SYSTEM">System</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "ALL" | "SUCCESS" | "FAILED" | "WARNING",
                )
              }
              className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-zinc-600">
            แสดง <span className="font-semibold">{filteredLogs.length}</span>{" "}
            รายการ
            {searchTerm ||
            filterAction !== "ALL" ||
            filterModule !== "ALL" ||
            filterStatus !== "ALL"
              ? ` จากทั้งหมด ${logs.length} รายการ`
              : ""}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-zinc-200 p-12 text-center">
              <AlertCircle size={48} className="text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500">ไม่พบรายการที่ตรงกับการค้นหา</p>
            </div>
          ) : (
            filteredLogs.map((log) => <LogEntry key={log.id} log={log} />)
          )}
        </div>
      </div>
    </div>
  );
}

// Log Entry Component
// Helper functions for LogEntry
const getActionIcon = (action: ActionType) => {
  const icons = {
    CREATE: UserPlus,
    UPDATE: Edit,
    DELETE: Trash2,
    LOGIN: LogIn,
    LOGOUT: LogOut,
    VIEW: FileSearch,
    EXPORT: Download,
  };
  return icons[action] || Settings;
};

const getActionColor = (action: ActionType) => {
  const colors = {
    CREATE: "text-green-600 bg-green-50",
    UPDATE: "text-blue-600 bg-blue-50",
    DELETE: "text-red-600 bg-red-50",
    LOGIN: "text-indigo-600 bg-indigo-50",
    LOGOUT: "text-zinc-600 bg-zinc-50",
    VIEW: "text-purple-600 bg-purple-50",
    EXPORT: "text-orange-600 bg-orange-50",
  };
  return colors[action] || "text-zinc-600 bg-zinc-50";
};

const getStatusIcon = (status: string) => {
  if (status === "SUCCESS")
    return <CheckCircle size={16} className="text-green-500" />;
  if (status === "FAILED")
    return <XCircle size={16} className="text-red-500" />;
  return <AlertCircle size={16} className="text-yellow-500" />;
};

function LogEntry({ log }: { log: AuditLog }) {
  const Icon = getActionIcon(log.action);

  return (
    <div className="bg-white rounded-xl shadow-md border border-zinc-200 hover:shadow-lg transition-all p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg ${getActionColor(log.action)}`}>
          <Icon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-zinc-900">
                  {log.userName}
                </span>
                <span className="text-sm text-zinc-400">•</span>
                <span className="text-sm text-zinc-500">{log.userEmail}</span>
              </div>
              <p className="text-zinc-700">{log.description}</p>
            </div>
            {getStatusIcon(log.status)}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{log.timestamp.toLocaleString("th-TH")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield size={14} />
              <span>IP: {log.ipAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-medium">
                {log.module}
              </span>
              <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-medium">
                {log.action}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
