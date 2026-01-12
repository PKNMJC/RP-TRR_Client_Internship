"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

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
          fileUrls: data.attachments?.map((f: any) => ({
             id: f.id,
             url: f.fileUrl,
             filename: f.filename
          })) || [],
        });
      } catch (e: any) {
        setError(e.message || "โหลดข้อมูลไม่สำเร็จ");
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
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      files: e.target.files ? Array.from(e.target.files) : [],
    }));
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
           body: payload
        });
        setSuccess("บันทึกการแก้ไขเรียบร้อย");
      } else {
        // Create not supported here yet or follows different flow
        // For now focusing on update
        setError("การสร้างใบซ่อมใหม่ผ่าน Admin ยังไม่รองรับในขณะนี้");
        return;
      }

      setTimeout(() => router.push("/admin/repairs"), 1200);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Loading ---------------- */
  if (loading && !formData.ticketCode) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ซ้าย */}
          <div className="space-y-6">
            {/* ข้อมูลผู้แจ้ง */}
            <Section title="ข้อมูลผู้แจ้ง">
              <Input
                label="เลขใบงาน"
                value={formData.ticketCode}
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="ชื่อผู้แจ้ง"
                value={formData.reporterName}
                readOnly
                 className="bg-gray-50"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                    label="แผนก"
                    value={formData.reporterDepartment}
                    readOnly
                     className="bg-gray-50"
                />
                <Input
                    label="เบอร์โทร"
                    value={formData.reporterPhone}
                    readOnly
                     className="bg-gray-50"
                />
              </div>
            </Section>

            {/* ข้อมูลปัญหา */}
            <Section title="รายละเอียดปัญหา">
               <Select
                label="หมวดหมู่ปัญหา"
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
                label="หัวข้อปัญหา"
                name="problemTitle"
                value={formData.problemTitle}
                onChange={handleChange}
                required
              />
              <Textarea
                label="รายละเอียด"
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleChange}
              />
              <Input
                label="สถานที่"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
               {formData.fileUrls.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">รูปภาพแนบ</label>
                  <div className="flex gap-2 flex-wrap">
                    {formData.fileUrls.map((file) => (
                      <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded border overflow-hidden hover:opacity-80">
                         <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* ขวา */}
          <div className="space-y-6">
            {/* การจัดการ */}
            <Section title="การจัดการงานซ่อม">
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
                label="สถานะ"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="PENDING">รอดำเนินการ</option>
                <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                <option value="WAITING_PARTS">รออะไหล่</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
                <option value="CANCELLED">ยกเลิก</option>
              </Select>

               <Select
                label="ผู้รับผิดชอบ"
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
              >
                <option value="">--ยังไม่ได้กำหนด--</option>
                {/* TODO: Fetch real users list */}
                <option value="1">Admin</option>
              </Select>
            </Section>

            {/* บันทึกเพิ่มเติม */}
            <Section title="บันทึกการซ่อม">
              <Input
                label="วันที่แจ้ง"
                value={formData.createdAt ? new Date(formData.createdAt).toLocaleString('th-TH') : ''}
                readOnly
                className="bg-gray-50"
              />
              <Textarea
                label="หมายเหตุ / การแก้ไข"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="บันทึกรายละเอียดการซ่อม..."
                rows={6}
              />
            </Section>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3 pb-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded text-gray-900 font-semibold hover:bg-gray-50"
          >
            ย้อนกลับ
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 disabled:opacity-50 shadow-lg"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <h2 className="bg-gray-50 border-b border-gray-100 text-gray-800 px-6 py-3 font-bold text-sm uppercase tracking-wide">
        {title}
      </h2>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Input(props: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {props.label}
      </label>
      <input
        {...props}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${props.className || ''}`}
      />
    </div>
  );
}

function Textarea(props: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {props.label}
      </label>
      <textarea
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
      />
    </div>
  );
}

function Select(props: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {props.label}
      </label>
      <div className="relative">
      <select
        {...props}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white transition-all"
      >
        {props.children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      </div>
    </div>
  );
}
