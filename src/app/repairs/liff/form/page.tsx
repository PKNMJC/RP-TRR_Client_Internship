"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import liff from "@line/liff";
import Swal from "sweetalert2";
import { apiFetch } from "@/services/api";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  Info,
  MapPin,
  Phone,
  Plus,
  Send,
  User,
  Wrench,
  X,
} from "lucide-react";

// --- Constants ---
const DEPARTMENTS = [
  "บัญชี (ACCOUNTING)",
  "การขาย (SALES)",
  "ผลิต (PRODUCTION)",
  "ไอที (IT)",
  "บุคคล (HR)",
  "ซ่อมบำรุง (MAINTENANCE)",
  "อื่นๆ",
];

const ISSUE_TYPES = [
  "คอมพิวเตอร์",
  "เครื่องพิมพ์",
  "อินเทอร์เน็ต/เครือข่าย",
  "โปรแกรม/ซอฟต์แวร์",
  "อุปกรณ์ต่อพ่วง",
  "อื่นๆ",
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
    urgency: "ปกติ",
    location: "",
    problemCategory: "OTHER",
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
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    const fileInput = document.getElementById("imageFile") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = new FormData();
      payload.append("reporterName", formData.name);
      payload.append("reporterLineId", lineUserId || "Uguest");

      let mappedDept = "OTHER";
      const d = formData.dept;
      if (d.includes("ACCOUNTING")) mappedDept = "ACCOUNTING";
      else if (d.includes("SALES")) mappedDept = "SALES";
      else if (d.includes("PRODUCTION")) mappedDept = "PRODUCTION";
      else if (d.includes("IT")) mappedDept = "IT";
      else if (d.includes("HR")) mappedDept = "HR";
      else if (d.includes("MAINTENANCE")) mappedDept = "MAINTENANCE";

      payload.append("reporterDepartment", mappedDept);
      if (mappedDept === "OTHER") {
        payload.append("otherDepartment", formData.dept);
      }

      payload.append("reporterPhone", formData.phone || "ไม่ระบุ");
      payload.append("problemTitle", formData.issueType);
      payload.append("problemDescription", formData.details);
      payload.append("location", formData.location || "ไม่ได้ระบุ");
      payload.append("problemCategory", formData.problemCategory);

      const urgencyMap: Record<string, string> = {
        ปกติ: "NORMAL",
        ด่วน: "URGENT",
        ด่วนที่สุด: "CRITICAL",
      };
      payload.append("urgency", urgencyMap[formData.urgency] || "NORMAL");

      if (file) {
        payload.append("files", file);
      }

      const response = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        body: payload,
      });

      setIsLoading(false);

      await Swal.fire({
        icon: "success",
        title: "สำเร็จ!",
        text: `รหัสแจ้งซ่อม: ${response.ticketCode}`,
        confirmButtonText: "ไปหน้าสถานะ",
        confirmButtonColor: "#4F46E5",
        allowOutsideClick: false,
      });

      router.push(`/repairs/liff?action=status&lineUserId=${lineUserId}`);
    } catch (error: any) {
      console.error("Submit Error:", error);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถเชื่อมต่อ Server ได้",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-24 font-sans text-slate-900">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-600 px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] left-[-10%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <button
              onClick={() => router.back()}
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white active:scale-90 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-end">
              <h1 className="text-xl font-bold text-white tracking-tight">
                แจ้งซ่อมใหม่
              </h1>
              <p className="text-white/60 text-[11px] font-medium">
                กรอกข้อมูลให้ครบถ้วน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
            <div className="w-12 h-12 rounded-2xl border-2 border-white/20 p-0.5 bg-indigo-500 flex items-center justify-center overflow-hidden">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">
                ผู้แจ้งซ่อม
              </p>
              <h4 className="text-white font-bold">
                {userProfile?.displayName || "ไม่ได้ระบุ"}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content Section */}
      <div className="px-6 -mt-12 relative z-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-950/5 border border-slate-100 space-y-8"
        >
          {/* Section: Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1 mb-2">
              <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                ข้อมูลผู้แจ้ง
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1">
                  ชื่อ-นามสกุล
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                    placeholder="ใส่ชื่อผู้แจ้ง"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1">
                  แผนก / โซน
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="dept"
                    list="dept-options"
                    value={formData.dept}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                    placeholder="พิมพ์หรือเลือกแผนก/โซน"
                    required
                  />
                  <datalist id="dept-options">
                    {DEPARTMENTS.map((d, i) => (
                      <option key={i} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1">
                  เบอร์ติดต่อ
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                    placeholder="08X-XXXX-XXX"
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-50"></div>

          {/* Section: Problem Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1 mb-2">
              <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                อาการเสีย / ปัญหา
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1">
                  ประเภทอาการ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="issueType"
                    list="issue-options"
                    value={formData.issueType}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                    placeholder="ระบุประเภทอาการเสีย"
                    required
                  />
                  <datalist id="issue-options">
                    {ISSUE_TYPES.map((t, i) => (
                      <option key={i} value={t} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1">
                  รายละเอียด
                </label>
                <textarea
                  id="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold resize-none"
                  placeholder="รายละเอียดเพิ่มเติม หรือจุดสังเกต..."
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1">
                  สถานที่ / โซนที่เกิดปัญหา
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-[15px] font-bold"
                    placeholder="เช่น ชั้น 2, ห้องสมุด, โต๊ะทำงาน A1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 ml-1">
                  ความเร่งด่วน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "ปกติ",
                      val: "ปกติ",
                      color:
                        "bg-emerald-50 text-emerald-600 border-emerald-100",
                      active:
                        "bg-emerald-500 text-white border-emerald-500 shadow-emerald-200",
                    },
                    {
                      label: "ด่วน",
                      val: "ด่วน",
                      color: "bg-amber-50 text-amber-600 border-amber-100",
                      active:
                        "bg-amber-500 text-white border-amber-500 shadow-amber-200",
                    },
                    {
                      label: "ด่วนที่สุด",
                      val: "ด่วนที่สุด",
                      color: "bg-rose-50 text-rose-600 border-rose-100",
                      active:
                        "bg-rose-500 text-white border-rose-500 shadow-rose-200",
                    },
                  ].map((lvl) => (
                    <button
                      key={lvl.val}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, urgency: lvl.val }))
                      }
                      className={`py-3 px-2 rounded-xl font-black text-xs transition-all border ${
                        formData.urgency === lvl.val
                          ? `${lvl.active} shadow-lg scale-105 z-10`
                          : `${lvl.color} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-3 ml-1">
                  รูปถ่ายประกอบ (ถ้ามี)
                </label>
                {filePreview ? (
                  <div className="relative rounded-3xl overflow-hidden border border-slate-100 shadow-sm animate-in zoom-in-95 duration-300">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={removeFile}
                        className="bg-white/90 p-3 rounded-full text-rose-600 shadow-xl active:scale-90 transition-transform"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="imageFile"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col items-center gap-2 group-active:scale-95 transition-transform">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-300 group-hover:text-indigo-500 shadow-sm transition-colors">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        กดเพื่อถ่ายรูป หรือเลือกรูป
                      </span>
                    </div>
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-gradient-to-r from-indigo-900 to-indigo-700 hover:from-indigo-800 hover:to-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-950/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ส่งใบแจ้งซ่อม</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-300">
          <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-2.5 h-2.5" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest">
            TRUCK ROBOTIC REPAIR SYSTEM V2.0
          </p>
        </div>
      </div>

      {/* Modern Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/10 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-8 text-white font-black text-sm uppercase tracking-[0.3em] animate-pulse">
            Processing Order...
          </p>
        </div>
      )}
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full"></div>
        </div>
      }
    >
      <RepairFormContent />
    </Suspense>
  );
}
