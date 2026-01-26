"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

import {
  ChevronLeft,
  Save,
  Clock,
  User,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  Paperclip,
  Calendar,
} from "lucide-react";

interface RepairForm {
  ticketCode: string;
  reporterName: string;
  reporterDepartment: string;
  reporterPhone: string;
  problemCategory: string;
  problemTitle: string;
  problemDescription: string;
  location: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "WAITING_PARTS"
    | "COMPLETED"
    | "CANCELLED";
  assigneeId: string;
  createdAt: string;
  notes: string;
  files: File[];
  fileUrls: { id: number; url: string; filename: string }[];
}

export default function RepairDetailPage() {
  const router = useRouter();
  const params = useParams();
  const repairId = params?.id as string | undefined;

  const [formData, setFormData] = useState<RepairForm>({
    ticketCode: "",
    reporterName: "",
    reporterDepartment: "",
    reporterPhone: "",
    problemCategory: "HARDWARE",
    problemTitle: "",
    problemDescription: "",
    location: "",
    urgency: "NORMAL",
    status: "PENDING",
    assigneeId: "",
    createdAt: "",
    notes: "",
    files: [],
    fileUrls: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ---------------- Fetch Detail ---------------- */
  useEffect(() => {
    if (!repairId || repairId === "new") return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        // Changed endpoint to /api/repairs
        const data = await apiFetch(`/api/repairs/${repairId}`);

        if (!data) {
          setError("ไม่พบข้อมูลใบซ่อม");
          return;
        }

        setFormData({
          ticketCode: data.ticketCode || "",
          reporterName: data.reporterName || "",
          reporterDepartment: data.reporterDepartment || "",
          reporterPhone: data.reporterPhone || "",
          problemCategory: data.problemCategory || "HARDWARE",
          problemTitle: data.problemTitle || "",
          problemDescription: data.problemDescription || "",
          location: data.location || "",
          urgency: data.urgency || "NORMAL",
          status: data.status || "PENDING",
          assigneeId: data.assignedTo ? String(data.assignedTo) : "",
          createdAt: data.createdAt || "",
          notes: data.notes || "",
          files: [],
          fileUrls:
            data.attachments?.map(
              (f: { id: number; fileUrl: string; filename: string }) => ({
                id: f.id,
                url: f.fileUrl,
                filename: f.filename,
              }),
            ) || [],
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [repairId]);

  /* ---------------- Handlers ---------------- */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const payload = {
        status: formData.status,
        urgency: formData.urgency,
        notes: formData.notes,
        assignee: formData.assigneeId ? { id: formData.assigneeId } : null,
        // Other fields might be read-only logically, but sending them if updated
        problemCategory: formData.problemCategory,
        problemTitle: formData.problemTitle,
        problemDescription: formData.problemDescription,
        location: formData.location,
      };

      if (repairId && repairId !== "new") {
        await apiFetch(`/api/repairs/${repairId}`, {
          method: "PUT",
          body: payload,
        });
        setSuccess("บันทึกการแก้ไขเรียบร้อย");
      } else {
        // Create not supported here yet or follows different flow
        // For now focusing on update
        setError("การสร้างใบซ่อมใหม่ผ่าน Admin ยังไม่รองรับในขณะนี้");
        return;
      }

      setTimeout(() => router.push("/admin/repairs"), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Loading ---------------- */
  if (loading && !formData.ticketCode) {
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
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-[#fafafa] pt-6 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb & Header */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <button
            onClick={() => router.push("/admin/repairs")}
            className="hover:text-zinc-900 transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={16} /> กลับไปหน้างานซ่อม
          </button>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-medium">
            รายละเอียดงานซ่อม #{formData.ticketCode}
          </span>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 shadow-sm">
            <XCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 size={20} className="shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (Left, 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Details Card */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-zinc-500" />
                  รายละเอียดปัญหา
                </h2>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    formData.status === "PENDING"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : formData.status === "IN_PROGRESS"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : formData.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}
                >
                  {formData.status === "PENDING"
                    ? "รอดำเนินการ"
                    : formData.status === "IN_PROGRESS"
                      ? "กำลังดำเนินการ"
                      : formData.status === "COMPLETED"
                        ? "เสร็จสิ้น"
                        : formData.status}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">
                    หัวข้อปัญหา
                  </label>
                  <input
                    name="problemTitle"
                    value={formData.problemTitle}
                    onChange={handleChange}
                    className="w-full text-lg font-semibold text-zinc-900 border-b border-zinc-200 focus:border-zinc-900 focus:outline-none py-1 transition-colors bg-transparent placeholder-zinc-300"
                    placeholder="ระบุหัวข้อปัญหา..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="หมวดหมู่"
                    icon={<AlertTriangle size={14} />}
                    name="problemCategory"
                    value={formData.problemCategory}
                    onChange={handleChange}
                  >
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="NETWORK">Network</option>
                    <option value="PERIPHERAL">Peripheral</option>
                    <option value="EMAIL_OFFICE365">Email/Office 365</option>
                    <option value="ACCOUNT_PASSWORD">Account/Password</option>
                    <option value="OTHER">อื่นๆ</option>
                  </Select>

                  <Input
                    label="สถานที่ / ห้อง"
                    icon={<MapPin size={14} />}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    name="problemDescription"
                    value={formData.problemDescription}
                    onChange={handleChange}
                    rows={5}
                    className="w-full p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all resize-none"
                    placeholder="ระบุรายละเอียด..."
                  />
                </div>

                {/* Attachments */}
                {formData.fileUrls.length > 0 && (
                  <div className="pt-4 border-t border-zinc-100">
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                      <Paperclip size={14} />
                      รูปภาพแนบ
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {formData.fileUrls.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block w-28 h-28 rounded-lg border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note & Resolution Card */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-zinc-500" />
                  บันทึกการซ่อม / การแก้ไข
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={6}
                  className="w-full p-4 bg-yellow-50/50 rounded-lg border border-yellow-200/60 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all resize-none placeholder-zinc-400"
                  placeholder="บันทึกรายละเอียดการซ่อม, วิธีการแก้ไข, หรือหมายเหตุต่างๆ..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-6">
            {/* Management Card */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
              <div className="p-6 space-y-6">
                <h3 className="text-sm font-bold text-zinc-900 border-l-4 border-zinc-900 pl-3">
                  การจัดการ
                </h3>

                <div className="space-y-5">
                  <Select
                    label="สถานะงาน"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="font-medium"
                  >
                    <option value="PENDING">🕒 รอดำเนินการ</option>
                    <option value="IN_PROGRESS">🛠️ กำลังดำเนินการ</option>
                    <option value="WAITING_PARTS">📦 รออะไหล่</option>
                    <option value="COMPLETED">✅ เสร็จสิ้น</option>
                    <option value="CANCELLED">❌ ยกเลิก</option>
                  </Select>

                  <Select
                    label="ความเร่งด่วน"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                  >
                    <option value="NORMAL">ปกติ</option>
                    <option value="URGENT">ด่วน</option>
                    <option value="CRITICAL">ด่วนมาก</option>
                  </Select>

                  <Select
                    label="ผู้รับผิดชอบ"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleChange}
                  >
                    <option value="">-- ยังไม่ระบุ --</option>
                    {/* TODO: Fetch real users list */}
                    <option value="1">Admin</option>
                  </Select>
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  <button
                    disabled={loading}
                    onClick={handleSubmit}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold shadow-md shadow-zinc-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> บันทึกการเปลี่ยนแปลง
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full mt-3 py-2.5 border border-zinc-200 text-zinc-600 rounded-lg font-medium hover:bg-zinc-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>

            {/* Reporter Info Card */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} />
                  ข้อมูลผู้แจ้ง
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formData.reporterName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formData.reporterDepartment}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <InfoRow
                    icon={<Building2 size={14} />}
                    label="แผนก"
                    value={formData.reporterDepartment}
                  />
                  <InfoRow
                    icon={<Phone size={14} />}
                    label="เบอร์โทร"
                    value={formData.reporterPhone}
                  />
                  <InfoRow
                    icon={<Calendar size={14} />}
                    label="วันที่แจ้ง"
                    value={
                      formData.createdAt
                        ? new Date(formData.createdAt).toLocaleString("th-TH")
                        : "-"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className="opacity-70">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-medium text-zinc-900">{value}</span>
    </div>
  );
}

function Input(
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & { label: string; icon?: React.ReactNode },
) {
  const { label, icon, className, ...rest } = props;
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </label>
      <input
        {...rest}
        className={`w-full border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all bg-zinc-50/30 ${className || ""}`}
      />
    </div>
  );
}

function Select(
  props: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > & { label: string; icon?: React.ReactNode },
) {
  const { label, icon, className, children, ...rest } = props;
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5">
        {icon || <span className="w-3.5" />} {label}
      </label>
      <div className="relative">
        <select
          {...rest}
          className={`w-full border border-zinc-200 rounded-lg pl-3 pr-8 py-2 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 appearance-none bg-zinc-50/30 transition-all cursor-pointer ${className || ""}`}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
