"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

type Status =
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "COMPLETED"
  | "CANCELLED";

type Urgency = "NORMAL" | "URGENT" | "CRITICAL";

interface Attachment {
  id: number;
  fileUrl: string;
  filename: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

interface RepairDetail {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: Status;
  urgency: Urgency;
  assigneeId: string | null;
  reporterName: string;
  reporterDepartment: string;
  reporterPhone: string;
  createdAt: string;
  notes: string;
  attachments: Attachment[];
}

export default function RepairDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState<User[]>([]);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("PENDING");
  const [urgency, setUrgency] = useState<Urgency>("NORMAL");
  const [assigneeId, setAssigneeId] = useState("");

  /* ---------------- Fetch ---------------- */
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/repairs/${id}`);

        setData({
          id: res.id,
          ticketCode: res.ticketCode,
          title: res.problemTitle,
          description: res.problemDescription,
          category: res.problemCategory,
          location: res.location,
          status: res.status,
          urgency: res.urgency,
          assigneeId: res.assignedTo ? String(res.assignedTo) : null,
          reporterName: res.reporterName,
          reporterDepartment: res.reporterDepartment,
          reporterPhone: res.reporterPhone,
          createdAt: res.createdAt,
          notes: res.notes || "",
          attachments: res.attachments || [],
        });

        setTitle(res.problemTitle);
        setDescription(res.problemDescription || "");
        setLocation(res.location);
        setStatus(res.status);
        setUrgency(res.urgency);
        setNotes(res.notes || "");
        setAssigneeId(res.assignedTo ? String(res.assignedTo) : "");
      } catch {
        setError("ไม่สามารถโหลดข้อมูลงานซ่อมได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const res = await apiFetch("/api/users/it-staff");
        if (Array.isArray(res)) {
          setTechnicians(res);
        }
      } catch (err) {
        console.error("Failed to fetch technicians:", err);
      }
    };
    fetchTechnicians();
  }, []);

  /* ---------------- Save ---------------- */
  const handleSave = async () => {
    if (!data) return;

    try {
      setLoading(true);
      await apiFetch(`/api/repairs/${data.id}`, {
        method: "PUT",
        body: {
          problemTitle: title,
          problemDescription: description,
          location: location,
          status,
          urgency,
          notes,
          assignedTo: assigneeId ? parseInt(assigneeId) : null,
        },
      });

      router.push("/admin/repairs");
    } catch (err: any) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (!data && loading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-zinc-500">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!data) return null;

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-900">
            งานซ่อม #{data.ticketCode}
          </h1>
          <p className="text-sm text-zinc-500">
            แจ้งเมื่อ {new Date(data.createdAt).toLocaleString("th-TH")}
          </p>
        </header>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT : READ */}
          <section className="lg:col-span-2 space-y-6">
            <Block title="แก้ไขรายละเอียดปัญหา">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">หัวข้อปัญหา</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">สถานที่</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </Block>

            {data.attachments && data.attachments.length > 0 && (
              <Block title="รูปภาพประกอบ">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {data.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square relative rounded-lg overflow-hidden border border-zinc-200 group"
                    >
                      <img
                        src={file.fileUrl}
                        alt={file.filename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </a>
                  ))}
                </div>
              </Block>
            )}

            <Block title="ข้อมูลผู้แจ้ง">
              <Item label="ชื่อ" value={data.reporterName} />
              <Item label="แผนก" value={data.reporterDepartment} />
              <Item label="โทรศัพท์" value={data.reporterPhone} />
            </Block>
          </section>

          {/* RIGHT : ACTION */}
          <aside className="space-y-6">
            <Block title="การจัดการ">
              <Select label="สถานะ" value={status} onChange={setStatus}>
                <option value="PENDING">รอดำเนินการ</option>
                <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                <option value="WAITING_PARTS">รออะไหล่</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
                <option value="CANCELLED">ยกเลิก</option>
              </Select>

              <Select
                label="ความเร่งด่วน"
                value={urgency}
                onChange={setUrgency}
              >
                <option value="NORMAL">ปกติ</option>
                <option value="URGENT">ด่วน</option>
                <option value="CRITICAL">ด่วนมาก</option>
              </Select>

              <Select
                label="ผู้รับผิดชอบ"
                value={assigneeId}
                onChange={setAssigneeId}
              >
                <option value="">ยังไม่ระบุ</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={String(tech.id)}>
                    {tech.name} ({tech.role})
                  </option>
                ))}
              </Select>
            </Block>

            <Block title="บันทึกการซ่อม">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="บันทึกขั้นตอนหรือผลการซ่อม..."
              />
            </Block>

            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-zinc-900 text-white text-sm py-2 rounded hover:bg-zinc-800"
              >
                บันทึก
              </button>
              <button
                onClick={() => router.back()}
                className="w-full border border-zinc-300 text-sm py-2 rounded"
              >
                ยกเลิก
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-200 rounded p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </div>
  );
}

function Item({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="text-sm">
      <div className="text-zinc-500 mb-1">{label}</div>
      <div
        className={`text-zinc-900 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: any) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-300 rounded px-3 py-2 text-sm bg-white"
      >
        {children}
      </select>
    </div>
  );
}
