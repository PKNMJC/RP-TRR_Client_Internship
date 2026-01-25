"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch } from "@/services/api";

// Lazy load icons for better performance
const ArrowLeft = dynamic(
  () => import("lucide-react").then((m) => m.ArrowLeft),
  { ssr: false },
);
const Camera = dynamic(() => import("lucide-react").then((m) => m.Camera), {
  ssr: false,
});
const MapPin = dynamic(() => import("lucide-react").then((m) => m.MapPin), {
  ssr: false,
});
const Phone = dynamic(() => import("lucide-react").then((m) => m.Phone), {
  ssr: false,
});
const Send = dynamic(() => import("lucide-react").then((m) => m.Send), {
  ssr: false,
});
const X = dynamic(() => import("lucide-react").then((m) => m.X), {
  ssr: false,
});
const Building2 = dynamic(
  () => import("lucide-react").then((m) => m.Building2),
  { ssr: false },
);

// Lazy load alert helper
const showAlert = async (options: {
  icon?: "success" | "error" | "warning";
  title: string;
  text?: string;
  confirmButtonColor?: string;
}) => {
  const Swal = (await import("sweetalert2")).default;
  return Swal.fire(options);
};

const URGENCY_OPTIONS = [
  { id: "NORMAL", label: "ปกติ" },
  { id: "URGENT", label: "ด่วน" },
  { id: "CRITICAL", label: "ด่วนมาก" },
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
  const [lineDisplayName, setLineDisplayName] = useState("");

  // Initialize LIFF lazily
  useEffect(() => {
    let isMounted = true;
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (liffId) {
          const liff = (await import("@line/liff")).default;
          // Check if already initialized to avoid re-init error
          if (!liff.id) {
            // Use a timeout to prevent permanent hang in LINE app
            const initPromise = liff.init({ liffId });
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("LIFF initialization timeout")),
                10000,
              ),
            );

            await Promise.race([initPromise, timeoutPromise]);
          }
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            if (isMounted) {
              setLineUserId(profile.userId);
              setLineDisplayName(profile.displayName);
            }
          } else {
            liff.login();
          }
        }
      } catch (error) {
        console.error("LIFF Init Error:", error);
        if (isMounted) {
          await showAlert({
            icon: "error",
            title: "การเชื่อมต่อล้มเหลว",
            text: "ไม่สามารถเชื่อมต่อกับ LINE ได้ กรุณาลองใหม่อีกครั้งหรือเปิดผ่านเบราว์เซอร์ปกติ",
          });
        }
      }
    };
    initLiff();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      }
    },
    [],
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setFilePreview(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dept) {
      await showAlert({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาระบุแผนกของคุณ",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append(
        "reporterName",
        formData.name.trim() || lineDisplayName || "ไม่ระบุชื่อ",
      );
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

      await showAlert({
        icon: "success",
        title: "ส่งข้อมูลสำเร็จ",
        text: `รหัสรายการ: ${response.ticketCode}`,
        confirmButtonColor: "#3b82f6",
      });

      // Close LIFF window and return to LINE chat
      const liff = (await import("@line/liff")).default;
      liff.closeWindow();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง";
      await showAlert({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Professional Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-all duration-200"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              แบบฟอร์มแจ้งซ่อม
            </h1>
            <p className="text-xs text-slate-500">กรุณากรอกข้อมูลให้ครบถ้วน</p>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-5 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reporter Info Card */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              <h2 className="text-base font-semibold text-slate-800">
                ข้อมูลผู้แจ้ง
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  ชื่อผู้แจ้ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="ระบุชื่อผู้แจ้งซ่อม"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="dept"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    แผนก/ฝ่าย <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      id="dept"
                      value={formData.dept}
                      onChange={handleChange}
                      required
                      placeholder="แผนก/ฝ่ายงาน"
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    เบอร์โทรติดต่อ
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0xx-xxx-xxxx"
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Problem Details Card */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              <h2 className="text-base font-semibold text-slate-800">
                รายละเอียดการแจ้งซ่อม
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="issueType"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  ปัญหาที่พบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="issueType"
                  value={formData.issueType}
                  onChange={handleChange}
                  required
                  placeholder="เช่น ปริ้นเตอร์เปิดไม่ติด, คอมพิวเตอร์ค้าง"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  สถานที่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="ระบุอาคาร, ชั้น, ห้อง"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="details"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  id="details"
                  rows={4}
                  value={formData.details}
                  onChange={handleChange}
                  placeholder="อธิบายอาการเสียหรือปัญหาที่พบเพิ่มเติม..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2.5">
                  ระดับความเร่งด่วน
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {URGENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, urgency: opt.id }))
                      }
                      className={`py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                        formData.urgency === opt.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                          : "bg-white border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2.5">
                  รูปภาพประกอบ{" "}
                  <span className="text-slate-400 font-normal">
                    (ไม่บังคับ)
                  </span>
                </label>
                {filePreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-56 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-all"
                      aria-label="ลบรูปภาพ"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 hover:border-blue-400 cursor-pointer transition-all">
                    <Camera className="w-7 h-7 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600">
                      คลิกเพื่อแนบรูปภาพ
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      รองรับไฟล์ภาพทุกประเภท
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
          </section>

          {/* Submit Button */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 transition-all duration-200 flex items-center justify-center gap-2.5"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ส่งแบบฟอร์มแจ้งซ่อม
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RepairFormContent />
    </Suspense>
  );
}
