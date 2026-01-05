"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

interface RepairForm {
  ticketCode: string;
  title: string;
  description: string;
  equipmentName: string;
  equipmentId: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  assigneeId: string;
  createdDate: string;
  requiredDate: string;
  notes: string;
  files: File[];
}

export default function RepairDetailPage() {
  const router = useRouter();
  const params = useParams();
  const repairId = params?.id as string | undefined;

  const [formData, setFormData] = useState<RepairForm>({
    ticketCode: "",
    title: "",
    description: "",
    equipmentName: "",
    equipmentId: "",
    priority: "MEDIUM",
    status: "OPEN",
    assigneeId: "",
    createdDate: new Date().toISOString().split("T")[0],
    requiredDate: "",
    notes: "",
    files: [],
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
        const data = await apiFetch(`/api/tickets/${repairId}`);

        if (!data) {
          setError("ไม่พบข้อมูลใบซ่อม");
          return;
        }

        setFormData({
          ticketCode: data.ticketCode || "",
          title: data.title || "",
          description: data.description || "",
          equipmentName: data.equipmentName || "",
          equipmentId: data.equipmentId || "",
          priority: data.priority || "MEDIUM",
          status: data.status || "OPEN",
          assigneeId: data.assignee?.id || "",
          createdDate:
            data.createdDate || new Date().toISOString().split("T")[0],
          requiredDate: data.requiredDate || "",
          notes: data.notes || "",
          files: [],
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

    if (!formData.title || !formData.equipmentName) {
      setError("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }

    if (formData.requiredDate && formData.requiredDate < formData.createdDate) {
      setError("วันที่ต้องการแล้วเสร็จ ต้องไม่น้อยกว่าวันที่สร้าง");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        files: undefined, // ส่งไฟล์แยก ถ้า backend รองรับ multipart
      };

      if (repairId && repairId !== "new") {
        await apiFetch(`/api/tickets/${repairId}`, "PUT", payload);
        setSuccess("บันทึกการแก้ไขเรียบร้อย");
      } else {
        await apiFetch("/api/tickets", "POST", payload);
        setSuccess("สร้างใบซ่อมเรียบร้อย");
      }

      setTimeout(() => router.push("/admin/repairs"), 1200);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Loading ---------------- */
  if (loading && repairId !== "new") {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-white pt-20 pb-12">
      <div className="max-w-full mx-auto px-4">
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
            {/* ข้อมูลใบงาน */}
            <Section title="ข้อมูลซ่อมแซม">
              <Input
                label="เลขใบงาน"
                name="ticketCode"
                value={formData.ticketCode}
                onChange={handleChange}
                readOnly={repairId !== "new"}
              />
              <Input
                label="ชื่อปัญหา"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <Textarea
                label="รายละเอียดปัญหา"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Section>

            {/* ข้อมูลอุปกรณ์ */}
            <Section title="ข้อมูลอุปกรณ์">
              <Input
                label="ชื่ออุปกรณ์"
                name="equipmentName"
                value={formData.equipmentName}
                onChange={handleChange}
                required
              />
              <Input
                label="ประเภทอุปกรณ์"
                name="equipmentId"
                value={formData.equipmentId}
                onChange={handleChange}
              />
              <Input label="หมายเลขชุด" disabled value="บันทึก" />
              <Select
                label="ความสำคัญ"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="LOW">ต่ำ</option>
                <option value="MEDIUM">กลาง</option>
                <option value="HIGH">สูง</option>
              </Select>
              <Textarea
                label="ปัญหาประเมิน"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
              <Input
                label="ไฟล์แนบ"
                type="file"
                multiple
                onChange={handleFileChange}
              />
            </Section>
          </div>

          {/* ขวา */}
          <div className="space-y-6">
            {/* ผู้รับผิดชอบ */}
            <Section title="ผู้รับผิดชอบ">
              <Input label="เลขที่ผู้รับผิดชอบ" placeholder="ค้นหา" />
              <Select
                label="ผู้รับผิดชอบ"
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
              >
                <option value="">--ยังไม่ได้กำหนด--</option>
                <option value="1">ช่างไอที 1</option>
                <option value="2">ช่างไอที 2</option>
              </Select>
            </Section>

            {/* ผลการทำงาน */}
            <Section title="✓ ผลการทำงาน">
              <Input
                label="วันที่เจอ"
                type="date"
                name="createdDate"
                value={formData.createdDate}
                onChange={handleChange}
              />
          
              <Textarea
                label="รายละเอียดการซ่อม"
                placeholder="บรรยายเพิ่มเติม"
              />
              <Input label="ไฟล์แนบ" type="file" multiple />
            </Section>

         

            {/* สถานะ */}
            <Section title="สถานะ">
              <Select
                label="สถานะ"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="OPEN">รอดำเนินการ</option>
                <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                <option value="DONE">เสร็จสิ้น</option>
              </Select>
            </Section>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded text-gray-900 font-semibold hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
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
      <h2 className="bg-gray-700 text-white px-6 py-3 font-semibold text-sm">
        {title}
      </h2>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Input(props: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {props.label}
      </label>
      <input
        {...props}
        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
      />
    </div>
  );
}

function Textarea(props: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {props.label}
      </label>
      <textarea
        {...props}
        rows={4}
        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
      />
    </div>
  );
}

function Select(props: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {props.label}
      </label>
      <select
        {...props}
        className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
      >
        {props.children}
      </select>
    </div>
  );
}
