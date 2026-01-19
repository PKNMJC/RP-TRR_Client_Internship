"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import liff from "@line/liff";
import Swal from "sweetalert2";
import { apiFetch } from "@/services/api";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Phone,
  Send,
  User,
  X,
  AlertCircle,
  Building2,
  ClipboardList,
} from "lucide-react";

const URGENCY_LEVELS = [
  {
    id: "NORMAL",
    label: "ปกติ",
    activeClass: "bg-blue-50 border-blue-200 text-blue-600",
  },
  {
    id: "URGENT",
    label: "ด่วน",
    activeClass: "bg-amber-50 border-amber-200 text-amber-600",
  },
  {
    id: "CRITICAL",
    label: "ด่วนที่สุด",
    activeClass: "bg-red-50 border-red-200 text-red-600",
  },
];

function RepairFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    phone: "",
    issueType: "",
    details: "",
    urgency: "NORMAL",
    location: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lineUserId, setLineUserId] = useState(
    searchParams.get("lineUserId") || "",
  );

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (liffId) {
          await liff.init({ liffId });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineUserId(profile.userId);
            setFormData((prev) => ({ ...prev, name: profile.displayName }));
          } else {
            liff.login();
          }
        }
      } catch (error) {
        console.error("LIFF Init Error:", error);
      }
    };
    initLiff();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dept)
      return Swal.fire("แจ้งเตือน", "กรุณาระบุแผนกของคุณ", "warning");

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("reporterName", formData.name);
      payload.append("reporterLineId", lineUserId || "Guest");
      payload.append("reporterDepartment", formData.dept);
      payload.append("reporterPhone", formData.phone || "-");
      payload.append("problemTitle", formData.issueType);
      payload.append("problemDescription", formData.details);
      payload.append("location", formData.location);
      payload.append("urgency", formData.urgency);
      payload.append("problemCategory", "OTHER");
      if (file) payload.append("files", file);

      const response = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        body: payload,
      });

      await Swal.fire({
        icon: "success",
        title: "ส่งข้อมูลสำเร็จ",
        text: `รหัสรายการ: ${response.ticketCode}`,
        confirmButtonColor: "#2563eb",
      });

      router.push(`/repairs/liff?action=status&lineUserId=${lineUserId}`);
    } catch (error: any) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        error.message || "กรุณาลองใหม่อีกครั้ง",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header: เรียบง่าย ใช้สีฟ้าขาว */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">แจ้งซ่อมใหม่</h1>
            <p className="text-sm text-slate-500">กรุณากรอกข้อมูลให้ครบถ้วน</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ส่วนที่ 1: ข้อมูลผู้แจ้ง */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <User className="w-5 h-5" />
              <h2 className="font-bold">ข้อมูลผู้แจ้ง</h2>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    ชื่อผู้แจ้ง
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="ชื่อ-นามสกุล"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    แผนก/ฝ่าย
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      id="dept"
                      value={formData.dept}
                      onChange={handleChange}
                      required
                      placeholder="เช่น บัญชี, ไอที"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">
                    เบอร์ติดต่อ
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="08X-XXX-XXXX"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ส่วนที่ 2: รายละเอียดงานซ่อม */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <ClipboardList className="w-5 h-5" />
              <h2 className="font-bold">รายละเอียดปัญหา</h2>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Information Left */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      อุปกรณ์ / ปัญหาที่พบ
                    </label>
                    <input
                      type="text"
                      id="issueType"
                      value={formData.issueType}
                      onChange={handleChange}
                      required
                      placeholder="เช่น ปริ้นเตอร์เปิดไม่ติด"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      สถานที่ / ตำแหน่ง
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="อาคาร, ชั้น, เลขโต๊ะ"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">
                      รายละเอียดเพิ่มเติม
                    </label>
                    <textarea
                      id="details"
                      rows={3}
                      value={formData.details}
                      onChange={handleChange}
                      placeholder="อธิบายอาการเสียเพิ่มเติม..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    ></textarea>
                  </div>

                  {/* ความเร่งด่วน */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      ระดับความเร่งด่วน
                    </label>
                    <div className="flex gap-2">
                      {URGENCY_LEVELS.map((level) => (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, urgency: level.id })
                          }
                          className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                            formData.urgency === level.id
                              ? `${level.activeClass} border-current ring-1 ring-current`
                              : "bg-white border-slate-200 text-slate-400"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Information Right: Image Upload */}
                <div className="space-y-4">
                  <div className="h-full flex flex-col">
                    <label className="text-sm font-medium text-slate-600 mb-2 block">
                      รูปภาพประกอบ (ถ้ามี)
                    </label>
                    <div className="flex-1">
                      {filePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-full min-h-[200px]">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setFilePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full shadow-md"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                          <Camera className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500 font-medium">
                            กดเพื่อถ่ายรูปหรือแนบไฟล์
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ปุ่มส่งข้อมูล */}
          <div className="pb-10 flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-64 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg shadow-blue-100 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ส่งใบแจ้งซ่อม
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <RepairFormContent />
    </Suspense>
  );
}
