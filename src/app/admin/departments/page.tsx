"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  X,
  Save,
} from "lucide-react";

// Types
interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  memberCount: number;
  headName?: string;
}

// Mock data
const mockDepartments: Department[] = [
  {
    id: 1,
    name: "IT Support",
    code: "IT",
    description: "ฝ่ายสนับสนุนเทคโนโลยีสารสนเทศ",
    location: "อาคาร A ชั้น 3",
    contactEmail: "it@example.com",
    contactPhone: "02-123-4567",
    memberCount: 12,
    headName: "นาย สมชาย ใจดี",
  },
  {
    id: 2,
    name: "Human Resources",
    code: "HR",
    description: "ฝ่ายทรัพยากรบุคคล",
    location: "อาคาร B ชั้น 2",
    contactEmail: "hr@example.com",
    contactPhone: "02-123-4568",
    memberCount: 8,
    headName: "นางสาว สมหญิง รักงาน",
  },
  {
    id: 3,
    name: "Finance",
    code: "FIN",
    description: "ฝ่ายการเงิน",
    location: "อาคาร B ชั้น 1",
    contactEmail: "finance@example.com",
    contactPhone: "02-123-4569",
    memberCount: 10,
    headName: "นาย สมศักดิ์ คิดเงิน",
  },
  {
    id: 4,
    name: "Marketing",
    code: "MKT",
    description: "ฝ่ายการตลาด",
    location: "อาคาร C ชั้น 4",
    contactEmail: "marketing@example.com",
    contactPhone: "02-123-4570",
    memberCount: 15,
    headName: "นางสาว สมจิตต์ ขายดี",
  },
  {
    id: 5,
    name: "Engineering",
    code: "ENG",
    description: "ฝ่ายวิศวกรรม",
    location: "อาคาร D ชั้น 1-3",
    contactEmail: "engineering@example.com",
    contactPhone: "02-123-4571",
    memberCount: 25,
    headName: "นาย สมพงษ์ สร้างสรรค์",
  },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({});

  const handleAdd = () => {
    setEditingDept(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData(dept);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบแผนกนี้?")) {
      setDepartments(departments.filter((d: Department) => d.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      alert("กรุณากรอกชื่อแผนกและรหัสแผนก");
      return;
    }

    if (editingDept) {
      // Update
      setDepartments(
        departments.map((d: Department) =>
          d.id === editingDept.id ? ({ ...d, ...formData } as Department) : d,
        ),
      );
    } else {
      // Create
      const newDept: Department = {
        id:
          departments.length > 0
            ? Math.max(...departments.map((d: Department) => d.id)) + 1
            : 1,
        name: formData.name!,
        code: formData.code!,
        description: formData.description,
        location: formData.location,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        memberCount: 0,
        headName: formData.headName,
      };
      setDepartments([...departments, newDept]);
    }

    setIsModalOpen(false);
    setFormData({});
  };

  const totalMembers = departments.reduce(
    (sum: number, d: Department) => sum + d.memberCount,
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  Department Management
                </h1>
                <p className="text-sm text-zinc-500">
                  จัดการแผนกและหน่วยงานภายในองค์กร
                </p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">เพิ่มแผนก</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="แผนกทั้งหมด"
            value={departments.length}
            icon={Building2}
            color="cyan"
          />
          <StatCard
            title="พนักงานทั้งหมด"
            value={totalMembers}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="เฉลี่ยต่อแผนก"
            value={Math.round(totalMembers / departments.length)}
            icon={Users}
            color="indigo"
          />
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map((dept: Department) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <DepartmentModal
          isEdit={!!editingDept}
          formData={formData}
          onClose={() => setIsModalOpen(false)}
          onChange={setFormData}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Department Card Component
interface DepartmentCardProps {
  department: Department;
  onEdit: (dept: Department) => void;
  onDelete: (id: number) => void;
}

function DepartmentCard({ department, onEdit, onDelete }: DepartmentCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-zinc-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-zinc-900">
              {department.name}
            </h3>
            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded">
              {department.code}
            </span>
          </div>
          {department.description && (
            <p className="text-sm text-zinc-600">{department.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(department)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(department.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {department.headName && (
          <div className="flex items-center gap-2 text-zinc-700">
            <Users size={14} className="text-zinc-400" />
            <span>หัวหน้า: {department.headName}</span>
          </div>
        )}
        {department.location && (
          <div className="flex items-center gap-2 text-zinc-700">
            <MapPin size={14} className="text-zinc-400" />
            <span>{department.location}</span>
          </div>
        )}
        {department.contactEmail && (
          <div className="flex items-center gap-2 text-zinc-700">
            <Mail size={14} className="text-zinc-400" />
            <span>{department.contactEmail}</span>
          </div>
        )}
        {department.contactPhone && (
          <div className="flex items-center gap-2 text-zinc-700">
            <Phone size={14} className="text-zinc-400" />
            <span>{department.contactPhone}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600">พนักงาน</span>
          <span className="text-lg font-bold text-zinc-900">
            {department.memberCount} คน
          </span>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: "cyan" | "blue" | "indigo";
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    cyan: "from-cyan-500 to-cyan-600",
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${colors[color]} p-4`}>
        <Icon size={24} className="text-white opacity-90" />
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-zinc-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

// Modal Component
interface DepartmentModalProps {
  isEdit: boolean;
  formData: Partial<Department>;
  onClose: () => void;
  onChange: (data: Partial<Department>) => void;
  onSave: () => void;
}

function DepartmentModal({
  isEdit,
  formData,
  onClose,
  onChange,
  onSave,
}: DepartmentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">
            {isEdit ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="ชื่อแผนก *"
              value={formData.name || ""}
              onChange={(value) => onChange({ ...formData, name: value })}
              placeholder="เช่น IT Support"
            />
            <FormInput
              label="รหัสแผนก *"
              value={formData.code || ""}
              onChange={(value) => onChange({ ...formData, code: value })}
              placeholder="เช่น IT"
            />
          </div>

          <FormTextarea
            label="คำอธิบาย"
            value={formData.description || ""}
            onChange={(value) => onChange({ ...formData, description: value })}
            placeholder="อธิบายหน้าที่ความรับผิดชอบของแผนก"
          />

          <FormInput
            label="หัวหน้าแผนก"
            value={formData.headName || ""}
            onChange={(value) => onChange({ ...formData, headName: value })}
            placeholder="ชื่อหัวหน้าแผนก"
          />

          <FormInput
            label="ที่ตั้ง"
            value={formData.location || ""}
            onChange={(value) => onChange({ ...formData, location: value })}
            placeholder="เช่น อาคาร A ชั้น 3"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="อีเมล"
              value={formData.contactEmail || ""}
              onChange={(value) =>
                onChange({ ...formData, contactEmail: value })
              }
              placeholder="department@example.com"
              type="email"
            />
            <FormInput
              label="เบอร์โทรศัพท์"
              value={formData.contactPhone || ""}
              onChange={(value) =>
                onChange({ ...formData, contactPhone: value })
              }
              placeholder="02-XXX-XXXX"
              type="tel"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Save size={18} />
            <span>{isEdit ? "บันทึก" : "เพิ่มแผนก"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Form Components
function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
      />
    </div>
  );
}
