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
  ChevronRight,
} from "lucide-react";

// --- Constants ---
const DEPARTMENTS = [
  { label: "บัญชี (ACCOUNTING)", value: "ACCOUNTING" },
  { label: "การขาย (SALES)", value: "SALES" },
  { label: "ผลิต (PRODUCTION)", value: "PRODUCTION" },
  { label: "ไอที (IT)", value: "IT" },
  { label: "บุคคล (HR)", value: "HR" },
  { label: "ซ่อมบำรุง (MAINTENANCE)", value: "MAINTENANCE" },
  { label: "อื่นๆ", value: "OTHER" },
];

const ISSUE_TYPES = [
  "คอมพิวเตอร์",
  "เครื่องพิมพ์",
  "อินเทอร์เน็ต/เครือข่าย",
  "โปรแกรม/ซอฟต์แวร์",
  "อุปกรณ์ต่อพ่วง",
  "อื่นๆ",
];

const URGENCY_LEVELS = [
  { id: "NORMAL", label: "ปกติ", color: "emerald" },
  { id: "URGENT", label: "ด่วน", color: "amber" },
  { id: "CRITICAL", label: "ด่วนที่สุด", color: "rose" },
];

function RepairFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    otherDept: "",
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
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    pictureUrl?: string;
  } | null>(null);

  // --- LIFF Init ---
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (liffId) {
          await liff.init({ liffId });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineUserId(profile.userId);
            setUserProfile({
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
            });
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

    // Simple Validation
    if (!formData.dept) {
      return Swal.fire("แจ้งเตือน", "กรุณาเลือกแผนกของคุณ", "warning");
    }

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("reporterName", formData.name);
      payload.append("reporterLineId", lineUserId || "Guest");
      payload.append("reporterDepartment", formData.dept);
      if (formData.dept === "OTHER") {
        payload.append("otherDepartment", formData.otherDept);
      }
      payload.append("reporterPhone", formData.phone || "ไม่ระบุ");
      payload.append("problemTitle", formData.issueType);
      payload.append("problemDescription", formData.details);
      payload.append("location", formData.location || "ไม่ได้ระบุ");
      payload.append("urgency", formData.urgency);
      payload.append("problemCategory", "GENERAL");

      if (file) payload.append("files", file);

      const response = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        body: payload,
      });

      await Swal.fire({
        icon: "success",
        title: "ส่งข้อมูลสำเร็จ",
        text: `รหัสรายการ: ${response.ticketCode}`,
        confirmButtonColor: "#4F46E5",
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
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
      {/* Header Section */}
      <div className="bg-indigo-700 px-6 pt-12 pb-24 rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">
              New Repair Request
            </h1>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="px-6 -mt-10 relative z-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 space-y-8"
        >
          {/* Section 1: Reporter Info */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                ข้อมูลผู้แจ้งซ่อม
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">
                    ชื่อผู้แจ้ง <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="ระบุชื่อจริง-นามสกุล"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-semibold transition-all"
                    />
                  </div>
                </div>
                {/* แผนก / โซน - เปลี่ยนเป็น Select เพื่อความโปร่งใสของข้อมูล */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">
                    แผนกที่สังกัด <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="dept"
                    value={formData.dept}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-semibold"
                  >
                    <option value="">เลือกแผนกของคุณ</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* แสดงเมื่อเลือก 'อื่นๆ' */}
                {formData.dept === "OTHER" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[11px] font-bold text-slate-500 ml-1">
                      ระบุแผนกของคุณ
                    </label>
                    <input
                      type="text"
                      id="otherDept"
                      value={formData.otherDept}
                      onChange={handleChange}
                      placeholder="เช่น แผนกจัดซื้อ, คลังสินค้า B"
                      className="w-full px-4 py-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:border-indigo-500 outline-none font-semibold mt-1.5 shadow-inner"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">
                    เบอร์ติดต่อภายใน/มือถือ
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="08X-XXXX-XXX"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-semibold transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Problem Details */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                รายละเอียดอาการเสีย
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">
                  ประเภทอุปกรณ์/ปัญหา <span className="text-rose-500">*</span>
                </label>
                <select
                  id="issueType"
                  value={formData.issueType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-semibold"
                >
                  <option value="">เลือกประเภทปัญหา</option>
                  {ISSUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">
                  อาการเสียโดยละเอียด
                </label>
                <textarea
                  id="details"
                  rows={3}
                  value={formData.details}
                  onChange={handleChange}
                  placeholder="เช่น เปิดเครื่องไม่ติด มีเสียงดังผิดปกติ..."
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-semibold resize-none"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1 font-sans">
                  สถานที่/ตำแหน่ง <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="เช่น อาคาร A ชั้น 2 โต๊ะคุณสมชาย"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Urgency Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 ml-1">
                  ระดับความเร่งด่วน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {URGENCY_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, urgency: level.id })
                      }
                      className={`py-3 rounded-2xl text-[11px] font-black uppercase transition-all border ${
                        formData.urgency === level.id
                          ? `bg-${level.color}-500 border-${level.color}-500 text-white shadow-lg scale-105 z-10`
                          : `bg-${level.color}-50 border-${level.color}-100 text-${level.color}-600 opacity-60`
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1 mb-2 block">
                  รูปถ่ายหน้าจอหรือจุดที่เสีย (ถ้ามี)
                </label>
                {filePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-slate-100">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFilePreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tap to upload photo
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" /> ส่งใบแจ้งซ่อม
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-1 opacity-30">
          <AlertCircle className="w-4 h-4" />
          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-center">
            Internal Maintenance Management System
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <RepairFormContent />
    </Suspense>
  );
}
