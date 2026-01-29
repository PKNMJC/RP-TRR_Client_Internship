"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import {
  ChevronLeft,
  Save,
  User,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Phone,
  Paperclip,
  Calendar,
  Hash,
  ArrowRight,
} from "lucide-react";

// --- Types ---
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
  status: "PENDING" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "CANCELLED";
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

  useEffect(() => {
    if (!repairId || repairId === "new") return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/repairs/${repairId}`);
        if (data) {
          setFormData({
            ...data,
            assigneeId: data.assignedTo ? String(data.assignedTo) : "",
            fileUrls: data.attachments?.map((f: any) => ({
              id: f.id,
              url: f.fileUrl,
              filename: f.filename,
            })) || [],
          });
        }
      } catch (e) {
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [repairId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      await apiFetch(`/api/repairs/${repairId}`, {
        method: "PUT",
        body: formData,
      });
      setSuccess("อัปเดตข้อมูลเรียบร้อยแล้ว");
      setTimeout(() => router.push("/admin/repairs"), 1500);
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.ticketCode) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-2 w-48 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-900 w-1/3 animate-[loading_1.5s_infinite]" />
          </div>
          <p className="mt-4 text-xs font-medium text-zinc-400 uppercase tracking-widest">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-zinc-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-zinc-50 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Ticket Detail</span>
              <h1 className="text-sm font-semibold flex items-center gap-2">
                <Hash size={14} className="text-zinc-300" />
                {formData.ticketCode || "New Ticket"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-full hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Saving..." : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Notifications */}
        {error && (
          <div className="mb-8 p-4 border border-red-100 bg-red-50/30 rounded-lg flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
            <XCircle size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-8 p-4 border border-green-100 bg-green-50/30 rounded-lg flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-12">
          {/* Left Column: Problem & Diagnosis */}
          <div className="col-span-12 lg:col-span-8 space-y-12">
            
            <section>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Primary Information</h2>
              <div className="space-y-6">
                <div className="group">
                  <label className="text-xs font-medium text-zinc-400 mb-1 block transition-colors group-focus-within:text-zinc-900">Issue Title</label>
                  <input
                    name="problemTitle"
                    value={formData.problemTitle}
                    onChange={handleChange}
                    placeholder="Enter issue title..."
                    className="w-full text-2xl font-light border-none p-0 focus:ring-0 placeholder:text-zinc-200 bg-transparent"
                  />
                  <div className="h-px w-full bg-zinc-100 mt-2 group-focus-within:bg-zinc-900 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <CustomSelect
                    label="Category"
                    name="problemCategory"
                    value={formData.problemCategory}
                    onChange={handleChange}
                  >
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="NETWORK">Network</option>
                  </CustomSelect>
                  
                  <CustomInput
                    label="Location"
                    icon={<MapPin size={14} />}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-2 block">Description</label>
                  <textarea
                    name="problemDescription"
                    value={formData.problemDescription}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl focus:outline-none focus:border-zinc-300 focus:bg-white transition-all text-sm leading-relaxed"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Technical Notes</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Write resolution steps or internal notes..."
                className="w-full p-4 bg-white border-2 border-dashed border-zinc-100 rounded-xl focus:outline-none focus:border-zinc-300 focus:bg-zinc-50/30 transition-all text-sm min-h-[150px]"
              />
            </section>

            {formData.fileUrls.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Paperclip size={14} /> Attachments
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {formData.fileUrls.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      className="relative shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-zinc-100 group shadow-sm hover:shadow-md transition-all"
                    >
                      <img src={file.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase">View</span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Status & Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="p-6 border border-zinc-100 rounded-2xl bg-zinc-50/30 space-y-8">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-4">Management</h3>
                <div className="space-y-6">
                  <StatusSelector 
                    value={formData.status} 
                    onChange={handleChange} 
                  />
                  
                  <CustomSelect
                    label="Urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical</option>
                  </CustomSelect>

                  <CustomSelect
                    label="Assigned Technician"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleChange}
                  >
                    <option value="">Unassigned</option>
                    <option value="1">Admin System</option>
                  </CustomSelect>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-4">Reporter Information</h3>
                <div className="space-y-4">
                  <ReporterItem icon={<User size={14} />} label="Name" value={formData.reporterName} />
                  <ReporterItem icon={<Phone size={14} />} label="Contact" value={formData.reporterPhone} />
                  <ReporterItem icon={<Calendar size={14} />} label="Reported" value={new Date(formData.createdAt).toLocaleDateString()} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components (Professional & Clean) ---

function CustomInput({ label, icon, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1.5">
        {icon} {label}
      </label>
      <input
        {...props}
        className="w-full px-0 py-2 bg-transparent border-b border-zinc-100 focus:border-zinc-900 focus:ring-0 text-sm transition-all"
      />
    </div>
  );
}

function CustomSelect({ label, children, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">{label}</label>
      <select
        {...props}
        className="w-full px-0 py-2 bg-transparent border-b border-zinc-100 focus:border-zinc-900 focus:ring-0 text-sm appearance-none cursor-pointer transition-all"
      >
        {children}
      </select>
    </div>
  );
}

function StatusSelector({ value, onChange }: any) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "PENDING": return "bg-blue-500";
      case "IN_PROGRESS": return "bg-amber-500";
      case "COMPLETED": return "bg-green-500";
      case "CANCELLED": return "bg-zinc-400";
      default: return "bg-zinc-200";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">Current Status</label>
      <div className="relative flex items-center">
        <div className={`absolute left-0 w-2 h-2 rounded-full ${getStatusColor(value)}`} />
        <select
          name="status"
          value={value}
          onChange={onChange}
          className="w-full pl-5 py-2 bg-transparent border-b border-zinc-100 focus:border-zinc-900 focus:ring-0 text-sm font-semibold appearance-none cursor-pointer"
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_PARTS">Waiting Parts</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>
  );
}

function ReporterItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <span className="text-xs font-semibold text-zinc-700">{value || "-"}</span>
    </div>
  );
}