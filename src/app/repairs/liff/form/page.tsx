"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  MapPin,
  Phone,
  User,
  Building2,
  Wrench,
  Camera,
  Image as ImageIcon,
  ChevronRight,
  Info,
  Plus,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";

// --- Constants ---
const URGENCY_LEVELS = [
  {
    value: "NORMAL",
    label: "ปกติ",
    subLabel: "ความเร็วมาตรฐาน",
    color: "blue",
  },
  {
    value: "URGENT",
    label: "ด่วน",
    subLabel: "จำเป็นต้องรีบใช้",
    color: "amber",
  },
  {
    value: "CRITICAL",
    label: "ด่วนที่สุด",
    subLabel: "งานหยุดชะงัก",
    color: "red",
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
  const [success, setSuccess] = useState<{
    show: boolean;
    ticketCode?: string;
  }>({ show: false });
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
    >
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
                })
              );
            }
          },
          "image/jpeg",
          0.8
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
          newFiles.map((f) => compressImage(f))
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
      setSuccess({ show: true, ticketCode: data.ticketCode });
    } catch (err: any) {
      setErrors({ submit: err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล" });
    } finally {
      setLoading(false);
    }
  };

  if (isLiffInitializing) return <LoadingIndicator />;
  if (isFriend === false) return <AddFriendView />;
  if (success.show) return <SuccessView ticketCode={success.ticketCode} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-12 font-sans transition-colors">
      {/* Premium Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">
                แจ้งซ่อม IT
              </h1>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Service Request
              </p>
            </div>
          </div>
          {linePictureUrl && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-blue-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-sm"></div>
              <img
                src={linePictureUrl}
                alt="profile"
                className="relative w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 object-cover"
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Reporter */}
          <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <User size={18} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                ข้อมูลส่วนตัว
              </h2>
            </div>

            <div className="space-y-6">
              <div className="group">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block ml-1 transition-colors group-focus-within:text-blue-600">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleInputChange}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 dark:focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block ml-1">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="reporterPhone"
                      value={formData.reporterPhone}
                      onChange={handleInputChange}
                      placeholder="08X-XXX-XXXX"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block ml-1">
                    แผนก / ฝ่าย <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="reporterDepartment"
                    value={formData.reporterDepartment}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium appearance-none"
                    required
                  >
                    <option value="">เลือกหน่วยงาน</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.reporterDepartment === "OTHER" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <input
                    type="text"
                    name="otherDepartment"
                    value={formData.otherDepartment}
                    onChange={handleInputChange}
                    placeholder="โปรดระบุแผนกของคุณ"
                    className="w-full px-5 py-4 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-blue-300 dark:placeholder:text-blue-900"
                    required
                  />
                </div>
              )}
            </div>
          </section>

          {/* Section: Problem */}
          <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Info size={18} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                รายละเอียดปัญหา
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block ml-1">
                  หัวข้อแจ้งซ่อม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="problemTitle"
                  value={formData.problemTitle}
                  onChange={handleInputChange}
                  placeholder="เช่น ปริ้นเตอร์ไม่ออก, คอมพิวเตอร์ช้า"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-lg"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block ml-1">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  name="problemDescription"
                  value={formData.problemDescription}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="กรุณาอธิบายปัญหาที่เกิดขึ้นโดยละเอียด..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all resize-none font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block ml-1">
                  สถานที่ / อาคาร / ชั้น <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="เช่น อาคาร A ชั้น 2 ห้องบัญชี"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Photos */}
          <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Camera size={18} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  รูปถ่ายประกอบ
                </h2>
              </div>
              <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-500 tracking-widest">
                {files.length} / 3
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {filePreviews.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-[1.5rem] overflow-hidden group shadow-sm bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                >
                  {src.length > 5 ? (
                    <img
                      src={src}
                      alt="preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {src}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 hover:bg-red-500 hover:text-white text-slate-900 p-2 rounded-xl shadow-lg transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {files.length < 3 && (
                <button
                  type="button"
                  onClick={() => setShowImageSource(true)}
                  className="aspect-square rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-all">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    เพิ่มรูป
                  </span>
                </button>
              )}
            </div>

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
          </section>

          {/* Section: Urgency */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{" "}
              ความเร่งด่วนของงาน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {URGENCY_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className="relative cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={level.value}
                    checked={formData.urgency === level.value}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div
                    className={`p-6 rounded-3xl border-2 transition-all duration-300 ring-4 ring-transparent flex flex-col items-center gap-1
                    ${
                      formData.urgency === level.value
                        ? level.color === "blue"
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-blue-500/5"
                          : level.color === "amber"
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 ring-amber-500/5"
                          : "border-red-500 bg-red-50/50 dark:bg-red-900/20 ring-red-500/5"
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <span
                      className={`text-base font-black ${
                        formData.urgency === level.value
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500"
                      }`}
                    >
                      {level.label}
                    </span>
                    <span className="text-[10px] font-bold opacity-50 tracking-wide uppercase">
                      {level.subLabel}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {errors.submit && (
            <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-black text-red-900 dark:text-red-200">
                  ขออภัย เกิดข้อผิดพลาด
                </h4>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 font-medium">
                  {errors.submit}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 pb-12">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[2.5rem] font-black text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98] active:brightness-90 uppercase tracking-widest"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>กำลังส่งข้อมูล...</span>
                </div>
              ) : (
                <>
                  ส่งเรื่องแจ้งซ่อม <ChevronRight size={20} strokeWidth={3} />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-[0.2em] opacity-50">
              Powered by TRR IT Support Team
            </p>
          </div>
        </form>
      </main>

      {/* Modern Bottom Sheet for Image Source */}
      {showImageSource && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out border border-white/10">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8"></div>
            <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-2xl font-black tracking-tight">
                เพิ่มรูปภาพ
              </h3>
              <button
                onClick={() => setShowImageSource(false)}
                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all border border-blue-100/50 dark:border-blue-800/30 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Camera size={28} />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">
                  ถ่ายรูป
                </span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-800 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white shadow-lg border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <ImageIcon size={28} />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">
                  คลังภาพ
                </span>
              </button>

              <button
                onClick={() => setShowCategoryPicker(true)}
                className="col-span-2 flex items-center justify-center gap-4 p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/30 transition-all group mt-2"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                  <LayoutGrid size={20} />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">
                  เลือกจากสัญลักษณ์แทนปัญหา
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Overlay */}
      {showCategoryPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300 p-8">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-black tracking-tight leading-tight">
                สัญลักษณ์
              </h3>
              <button
                onClick={() => setShowCategoryPicker(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
              สัญลักษณ์แทนปัญหาเบื้องต้น
            </p>

            <div className="grid grid-cols-3 gap-6">
              {IMAGE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => addCategoryAsImage(cat)}
                  className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all group-hover:scale-125 duration-300">
                    {cat.icon}
                  </span>
                  <span className="text-[10px] font-black tracking-tighter text-slate-500 group-hover:text-blue-600 uppercase text-center">
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

// --- Simplified UI Components ---

function LoadingIndicator() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-100 dark:border-slate-900 rounded-full" />
        <div className="w-20 h-20 border-4 border-t-blue-600 rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="mt-8 text-xs font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
        Initializing System
      </p>
    </div>
  );
}

function SuccessView({ ticketCode }: { ticketCode?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-blue-600">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 text-center shadow-2xl animate-in zoom-in-90 duration-500">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-500/20">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          ส่งข้อมูลสำเร็จ!
        </h2>
        <p className="text-slate-500 text-sm mb-12 font-medium leading-relaxed">
          ได้รับข้อมูลของท่านแล้ว
          เจ้าหน้าที่จะดำเนินการตามระดับความเร่งด่วนที่ระบุไว้
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 py-6 px-4 rounded-[2rem] mb-12 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-[0.2em] mb-2">
            Ref Code
          </p>
          <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
            #{ticketCode}
          </p>
        </div>

        <button
          onClick={() => liff.closeWindow()}
          className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-lg hover:opacity-90 active:scale-95 transition-all"
        >
          ปิดหน้าแจ้งซ่อม
        </button>
      </div>
    </div>
  );
}

function AddFriendView() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-slate-950">
      <div className="max-w-sm text-center">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border-2 border-green-50 dark:border-green-800 rotate-12">
          <User className="text-green-600" size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
          กรุณาเพิ่มเพื่อน
        </h2>
        <p className="text-slate-500 font-medium mb-12 leading-relaxed">
          เพื่อความสะดวกในการติดตามสถานะงานซ่อม และการแจ้งเตือนต่างๆ
          กรุณาเพิ่มเพื่อนกับเราก่อนใช้งานระบบครับ
        </p>
        <a
          href={`https://line.me/R/ti/p/@${
            process.env.NEXT_PUBLIC_LINE_OA_ID || "your-id"
          }`}
          className="block w-full py-6 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-[2.5rem] font-black text-xl shadow-xl shadow-green-500/30 transition-all active:scale-95"
        >
          Add Friend
        </a>
        <p className="text-[10px] text-slate-300 mt-8 font-black uppercase tracking-widest">
          Official Support Account
        </p>
      </div>
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
