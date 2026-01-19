"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  X,
  Camera,
  Image as ImageIcon,
  ChevronRight,
  MapPin,
  AlertCircle,
  Hash,
  User,
  Phone,
  LayoutGrid,
} from "lucide-react";
import Swal from "sweetalert2";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";

// --- Constants ---
const URGENCY_LEVELS = [
  {
    value: "NORMAL",
    label: "ปกติ",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    activeColor: "bg-blue-600 text-white border-blue-600",
  },
  {
    value: "URGENT",
    label: "ด่วน",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    activeColor: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "CRITICAL",
    label: "ด่วนที่สุด",
    color: "bg-red-50 text-red-700 border-red-200",
    activeColor: "bg-red-600 text-white border-red-600",
  },
];

const IMAGE_CATEGORIES = [
  { id: "monitor", label: "หน้าจอ", icon: "📺" },
  { id: "pc", label: "คอมพิวเตอร์", icon: "💻" },
  { id: "printer", label: "เครื่องพิมพ์", icon: "🖨️" },
  { id: "network", label: "เน็ตเวิร์ก", icon: "🌐" },
  { id: "mouse_keyboard", label: "เมาส์/คีย์บอร์ด", icon: "🖱️" },
  { id: "software", label: "ซอฟต์แวร์", icon: "💿" },
];

const DEPARTMENTS = [
  { value: "ACCOUNTING", label: "ฝ่ายบัญชี" },
  { value: "SALES", label: "ฝ่ายขาย" },
  { value: "PRODUCTION", label: "ฝ่ายผลิต" },
  { value: "IT", label: "ฝ่ายไอที" },
  { value: "HR", label: "ฝ่ายบุคคล" },
  { value: "MAINTENANCE", label: "ฝ่ายซ่อมบำรุง" },
  { value: "OTHER", label: "อื่นๆ (โปรดระบุ)" },
];

// --- Interfaces ---
interface FormData {
  reporterName: string;
  reporterDepartment: string;
  otherDepartment?: string;
  reporterPhone: string;
  reporterLineId?: string;
  problemCategory: string;
  problemTitle: string;
  problemDescription: string;
  location: string;
  urgency: string;
}

function RepairLiffFormContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // States
  const [linePictureUrl, setLinePictureUrl] = useState<string>("");
  const [isFriend, setIsFriend] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<FormData>({
    reporterName: "",
    reporterDepartment: "",
    otherDepartment: "",
    reporterPhone: "",
    reporterLineId: "",
    problemCategory: "OTHER",
    problemTitle: "",
    problemDescription: "",
    location: "",
    urgency: "NORMAL",
  });

  const [files, setFiles] = useState<(File | string)[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [showImageSource, setShowImageSource] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [success, setSuccess] = useState<{
  //   show: boolean;
  //   ticketCode?: string;
  // }>({ show: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLiffInitializing, setIsLiffInitializing] = useState(true);

  // --- LIFF Initialization ---
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
        if (!liffId) return;

        await liff.init({ liffId, withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const friendship = await liff.getFriendship();
        setIsFriend(friendship.friendFlag);

        const profile = await liff.getProfile();
        setLinePictureUrl(profile.pictureUrl || "");
        setFormData((prev) => ({
          ...prev,
          reporterLineId: profile.userId,
          reporterName: profile.displayName || "",
        }));
      } catch (error) {
        console.error("LIFF Init Error:", error);
      } finally {
        setIsLiffInitializing(false);
      }
    };
    initLiff();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX = 1200;
        if (width > height) {
          if (width > MAX) {
            height *= MAX / width;
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width *= MAX / height;
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }),
              );
            }
          },
          "image/jpeg",
          0.8,
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setLoading(true);
      const newFiles = Array.from(e.target.files).slice(0, 3 - files.length);
      try {
        const compressed = await Promise.all(
          newFiles.map((f) => compressImage(f)),
        );
        setFiles((prev) => [...prev, ...compressed]);
        compressed.forEach((file) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            setFilePreviews((prev) => [...prev, reader.result as string]);
          reader.readAsDataURL(file);
        });
        setShowImageSource(false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const addCategoryAsImage = (category: (typeof IMAGE_CATEGORIES)[0]) => {
    if (files.length < 3) {
      setFiles((prev) => [...prev, `CATEGORY:${category.id}`]);
      setFilePreviews((prev) => [...prev, category.icon]);
      setShowCategoryPicker(false);
      setShowImageSource(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      const finalDept =
        formData.reporterDepartment === "OTHER"
          ? formData.otherDepartment || "OTHER"
          : formData.reporterDepartment;

      Object.entries(formData).forEach(([key, val]) => {
        if (key === "reporterDepartment") payload.append(key, finalDept);
        else if (key !== "otherDepartment") payload.append(key, val || "");
      });

      const catMarkers: string[] = [];
      files.forEach((item) => {
        if (item instanceof File) payload.append("files", item);
        else if (typeof item === "string" && item.startsWith("CATEGORY:"))
          catMarkers.push(item.split(":")[1]);
      });

      if (catMarkers.length > 0)
        payload.append("imageCategories", JSON.stringify(catMarkers));
      if (linePictureUrl) payload.append("pictureUrl", linePictureUrl);

      const data = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        body: payload,
      });

      // Show SweetAlert2 Modal
      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        html: `รหัสแจ้งซ่อมของคุณคือ:<br><h2 style="color:#06C755; margin-top:10px;">${data.ticketCode}</h2><br>เจ้าหน้าที่ได้รับเรื่องแล้วครับ`,
        confirmButtonText: "ปิดหน้าต่าง",
        confirmButtonColor: "#06C755",
        allowOutsideClick: false,
      }).then(() => {
        if (liff.isInClient()) {
          liff.closeWindow();
        } else {
          // Reset form if not in LIFF (e.g. browser testing)
          setFormData({
            reporterName: formData.reporterName, // Keep name/dept if desired, or reset all
            reporterDepartment: formData.reporterDepartment,
            otherDepartment: "",
            reporterPhone: formData.reporterPhone,
            reporterLineId: formData.reporterLineId,
            problemCategory: "OTHER",
            problemTitle: "",
            problemDescription: "",
            location: "",
            urgency: "NORMAL",
          });
          setFiles([]);
          setFilePreviews([]);
        }
      });
      // setSuccess({ show: true, ticketCode: data.ticketCode });
    } catch (err: any) {
      setErrors({ submit: err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล" });
    } finally {
      setLoading(false);
    }
  };

  if (isLiffInitializing) return <LoadingIndicator />;
  if (isFriend === false) return <AddFriendView />;
  // if (success.show) return <SuccessView ticketCode={success.ticketCode} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 shadow-sm sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              แจ้งซ่อม IT
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Create Service Request
            </p>
          </div>
          {linePictureUrl && (
            <img
              src={linePictureUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-slate-100 shadow-sm"
            />
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Contact Info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <User size={16} /> ข้อมูลผู้แจ้ง
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleInputChange}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                    เบอร์โทร <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="reporterPhone"
                      value={formData.reporterPhone}
                      onChange={handleInputChange}
                      placeholder="เบอร์โทร"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                    แผนก <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="reporterDepartment"
                    value={formData.reporterDepartment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    required
                  >
                    <option value="">เลือกแผนก</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.reporterDepartment === "OTHER" && (
                <input
                  type="text"
                  name="otherDepartment"
                  value={formData.otherDepartment}
                  onChange={handleInputChange}
                  placeholder="ระบุแผนกของคุณ"
                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-blue-900 placeholder:text-blue-300"
                  required
                />
              )}
            </div>
          </div>

          {/* Section 2: Issue Details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <AlertCircle size={16} /> รายละเอียดงาน
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                  หัวข้อเรื่อง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="problemTitle"
                  value={formData.problemTitle}
                  onChange={handleInputChange}
                  placeholder="เช่น เครื่องปริ้นไม่ออก"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                  รายละเอียด
                </label>
                <textarea
                  name="problemDescription"
                  value={formData.problemDescription}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="อธิบายอาการเพิ่มเติม..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                  สถานที่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="ระบุจุดที่ตั้งอุปกรณ์"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                  ความเร่งด่วน
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {URGENCY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          urgency: level.value,
                        }))
                      }
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        formData.urgency === level.value
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Attachments */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Camera size={16} /> รูปภาพ ({files.length}/3)
            </h2>

            <div className="grid grid-cols-4 gap-3">
              {filePreviews.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square relative rounded-xl overflow-hidden bg-slate-100 group border border-slate-100 shadow-sm"
                >
                  {src.length > 5 ? (
                    <img
                      src={src}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {src}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}

              {files.length < 3 && (
                <button
                  type="button"
                  onClick={() => setShowImageSource(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all gap-1"
                >
                  <Camera size={20} />
                  <span className="text-[10px] font-bold">เพิ่มรูป</span>
                </button>
              )}
            </div>

            {/* Hidden Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {errors.submit && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-xs text-red-600 font-medium">
                {errors.submit}
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> กำลังส่ง...
                </>
              ) : (
                <>
                  ยืนยันการแจ้งซ่อม <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Image Source Bottom Sheet */}
      {showImageSource && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowImageSource(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-slate-900 mb-6 px-2">
              เลือกรูปภาพจาก
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  cameraInputRef.current?.click();
                  setShowImageSource(false);
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Camera size={32} />
                <span className="text-sm font-bold">ถ่ายภาพ</span>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowImageSource(false);
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ImageIcon size={32} />
                <span className="text-sm font-bold">อัลบั้ม</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowCategoryPicker(true);
                setShowImageSource(false);
              }}
              className="w-full mt-4 p-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              <LayoutGrid size={18} /> ใช้ไอคอนแทนปัญหา
            </button>

            <div className="h-4" />
          </div>
        </div>
      )}

      {/* Icon Picker Overlay */}
      {showCategoryPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          onClick={() => setShowCategoryPicker(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">เลือกไอคอน</h3>
              <button
                onClick={() => setShowCategoryPicker(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {IMAGE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => addCategoryAsImage(cat)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Status Views ---

function LoadingIndicator() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        Loading...
      </p>
    </div>
  );
}

// SuccessView removed in favor of SweetAlert2

function AddFriendView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
      <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mb-6 border-2 border-green-100">
        <User size={36} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-3">
        กรุณาเพิ่มเพื่อน
      </h2>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-[280px]">
        เพื่อติดตามสถานะงานซ่อม <br /> กรุณาเพิ่มเพื่อนกับเราก่อนใช้งานครับ
      </p>
      <a
        href={`https://line.me/R/ti/p/@${
          process.env.NEXT_PUBLIC_LINE_OA_ID || "your-id"
        }`}
        className="w-full py-4 bg-[#06C755] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-[#05b34c] transition-all"
      >
        เพิ่มเพื่อน (Add Friend)
      </a>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <RepairLiffFormContent />
    </Suspense>
  );
}
