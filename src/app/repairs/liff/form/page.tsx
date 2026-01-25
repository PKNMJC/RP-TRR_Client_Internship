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
        confirmButtonColor: "#374151",
      });

      window.location.href = `/repairs/liff?action=status&lineUserId=${lineUserId}`;
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
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">แจ้งซ่อม</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter Info */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              ข้อมูลผู้แจ้ง
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ชื่อผู้แจ้ง<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="ชื่อผู้แจ้ง"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="dept"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    แผนก <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                  {/* <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> */}
                    <input
                      type="text"
                      id="dept"
                      value={formData.dept}
                      onChange={handleChange}
                      required
                      placeholder="แผนก"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative">
                    {/* <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> */}
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="เบอร์โทรศัพท์"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Problem Details */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              รายละเอียดปัญหา
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="issueType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ปัญหาที่พบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="issueType"
                  value={formData.issueType}
                  onChange={handleChange}
                  required
                  placeholder="เช่น ปริ้นเตอร์เปิดไม่ติด, คอมค้าง"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  สถานที่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {/* <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> */}
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="อาคาร, ชั้น, ห้อง"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="details"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  id="details"
                  rows={3}
                  value={formData.details}
                  onChange={handleChange}
                  placeholder="อธิบายอาการเสียเพิ่มเติม..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความเร่งด่วน
                </label>
                <div className="flex gap-2">
                  {URGENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, urgency: opt.id }))
                      }
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        formData.urgency === opt.id
                          ? "bg-gray-900 border-gray-900 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รูปภาพ{" "}
                  <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                </label>
                {filePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      aria-label="ลบรูปภาพ"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">แนบรูปภาพ</span>
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
          <div className="pt-4 pb-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ส่งแจ้งซ่อม
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
