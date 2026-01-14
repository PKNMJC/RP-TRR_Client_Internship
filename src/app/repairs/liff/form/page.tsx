"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  AlertCircle, CheckCircle2, Loader2, Upload, X, MapPin, 
  Phone, User, Building2, Wrench, Camera, Image as ImageIcon,
  ChevronRight, Info
} from "lucide-react";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";

// --- Constants ---
const PROBLEM_CATEGORIES = [
  { value: "HARDWARE", label: "💻 Hardware (คอมพิวเตอร์, อุปกรณ์)" },
  { value: "SOFTWARE", label: "📱 Software (โปรแกรม, ระบบ)" },
  { value: "NETWORK", label: "🌐 Network (อินเทอร์เน็ต, Wi-Fi)" },
  { value: "PERIPHERAL", label: "🖱️ Peripheral (เมาส์, จอภาพ)" },
  { value: "EMAIL_OFFICE365", label: "📧 Email / Office 365" },
  { value: "ACCOUNT_PASSWORD", label: "🔐 Account / Password" },
  { value: "OTHER", label: "🔧 อื่นๆ" },
];

const URGENCY_LEVELS = [
  { value: "NORMAL", label: "ปกติ", subLabel: "รอได้", color: "peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
  { value: "URGENT", label: "ด่วน", subLabel: "งานสะดุด", color: "peer-checked:bg-yellow-50 peer-checked:border-yellow-500 peer-checked:text-yellow-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
  { value: "CRITICAL", label: "ด่วนที่สุด", subLabel: "ทำไม่ได้เลย", color: "peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
];

// --- Interfaces ---
interface FormData {
  reporterName: string;
  reporterDepartment: string;
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
  
  // States
  const [linePictureUrl, setLinePictureUrl] = useState<string>("");
  const [deviceOS, setDeviceOS] = useState<string>("");
  const [isFriend, setIsFriend] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<FormData>({
    reporterName: "",
    reporterDepartment: "",
    reporterPhone: "",
    reporterLineId: "",
    problemCategory: "HARDWARE",
    problemTitle: "",
    problemDescription: "",
    location: "",
    urgency: "NORMAL",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ show: boolean; ticketCode?: string }>({ show: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLiffInitializing, setIsLiffInitializing] = useState(true);

  // --- LIFF Initialization ---
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
        if (!liffId) {
          setLiffError("System Error: LIFF ID missing");
          return;
        }

        await liff.init({ liffId, withLoginOnExternalBrowser: true });
        setDeviceOS(liff.getOS() || "unknown");

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
      } catch (error: any) {
        setLiffError(error.message || "LIFF Error");
      } finally {
        setIsLiffInitializing(false);
      }
    };
    initLiff();
  }, []);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const remainingSlots = 3 - files.length;
      const validFiles: File[] = [];
      
      Array.from(selectedFiles).slice(0, remainingSlots).forEach(file => {
        if (file.size <= 10 * 1024 * 1024) { // 10MB
          validFiles.push(file);
          const reader = new FileReader();
          reader.onloadend = () => setFilePreviews(prev => [...prev, reader.result as string]);
          reader.readAsDataURL(file);
        }
      });
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, val]) => payload.append(key, val));
      files.forEach(file => payload.append("files", file));
      if (linePictureUrl) payload.append("pictureUrl", linePictureUrl);

      const data = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        body: payload,
      });
      setSuccess({ show: true, ticketCode: data.ticketCode });
    } catch (err: any) {
      setErrors({ submit: err.message || "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  // --- Views ---
  if (isLiffInitializing) return <LoadingSpinner />;
  if (liffError) return <ErrorMessage message={liffError} os={deviceOS} />;
  if (isFriend === false) return <AddFriendView />;
  if (success.show) return <SuccessView ticketCode={success.ticketCode} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10 transition-colors">
      {/* Professional Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">ระบบแจ้งซ่อม IT</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Ticketing System</p>
            </div>
          </div>
          {linePictureUrl && (
            <img src={linePictureUrl} alt="profile" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: User Profile */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={14} /> ข้อมูลผู้แจ้ง
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block ml-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleInputChange}
                  placeholder="กรอกชื่อของคุณ"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block ml-1">แผนก / ฝ่าย</label>
                  <select
                    name="reporterDepartment"
                    value={formData.reporterDepartment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white appearance-none"
                    required
                  >
                    <option value="">เลือกแผนก</option>
                    <option value="ACCOUNTING">ฝ่ายบัญชี</option>
                    <option value="SALES">ฝ่ายขาย</option>
                    <option value="PRODUCTION">ฝ่ายผลิต</option>
                    <option value="IT">ฝ่ายไอที</option>
                    <option value="OTHER">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block ml-1">เบอร์โทรติดต่อ</label>
                  <input
                    type="tel"
                    name="reporterPhone"
                    value={formData.reporterPhone}
                    onChange={handleInputChange}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Problem Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={14} /> รายละเอียดปัญหา
            </h2>
            <div className="space-y-4">
              <select
                name="problemCategory"
                value={formData.problemCategory}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
              >
                {PROBLEM_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <input
                type="text"
                name="problemTitle"
                value={formData.problemTitle}
                onChange={handleInputChange}
                placeholder="สรุปปัญหา (เช่น เปิดเครื่องไม่ติด)"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                required
              />
              <textarea
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleInputChange}
                rows={3}
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white resize-none"
              />
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="สถานที่ / ชั้น / เลขโต๊ะ"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photo Upload (Professional Grid) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} /> รูปภาพประกอบ
              </h2>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{files.length}/3</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {filePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
                  <img src={src} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {files.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1 text-slate-400 hover:bg-blue-50/50 transition-colors"
                >
                  <Camera size={20} />
                  <span className="text-[10px] font-medium">เพิ่มรูป</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>

          {/* Section 4: Urgency Level */}
          <div className="grid grid-cols-3 gap-3">
            {URGENCY_LEVELS.map((level) => (
              <label key={level.value} className="cursor-pointer group">
                <input
                  type="radio"
                  name="urgency"
                  value={level.value}
                  checked={formData.urgency === level.value}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className={`p-3 rounded-2xl border-2 text-center transition-all ${level.color}`}>
                  <p className="text-sm font-bold">{level.label}</p>
                  <p className="text-[10px] opacity-60">{level.subLabel}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>ส่งข้อมูลแจ้งซ่อม <ChevronRight size={18} /></>}
          </button>
        </form>
      </main>
    </div>
  );
}

// --- Sub-components ---

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-medium animate-pulse text-sm">กำลังโหลดข้อมูลระบบ...</p>
    </div>
  );
}

function SuccessView({ ticketCode }: { ticketCode?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-xs w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">เรียบร้อย!</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">ได้รับเรื่องแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด</p>
        <div className="bg-slate-50 dark:bg-slate-800/50 py-4 rounded-3xl mb-8 border border-slate-100 dark:border-slate-700">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-1">Ticket Number</p>
          <p className="text-2xl font-mono font-black text-blue-600">#{ticketCode}</p>
        </div>
        <button onClick={() => liff.closeWindow()} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold">
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
}

function AddFriendView() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-slate-950 text-center">
      <div className="max-w-xs">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-bold mb-3 dark:text-white">กรุณาเพิ่มเพื่อน</h2>
        <p className="text-slate-500 text-sm mb-8">เพื่อรับการแจ้งเตือนสถานะงานซ่อม กรุณาเพิ่มเพื่อนกับเราก่อนใช้งานครับ</p>
        <a href="https://line.me/R/ti/p/@yourid" className="block w-full py-4 bg-[#06C755] text-white rounded-2xl font-bold mb-3 shadow-lg shadow-green-500/20">
          เพิ่มเพื่อน (Add Friend)
        </a>
      </div>
    </div>
  );
}

function ErrorMessage({ message, os }: { message: string; os: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <p className="text-red-600 font-bold mb-2">Error: {message}</p>
        <p className="text-slate-400 text-xs">OS Detected: {os}</p>
      </div>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RepairLiffFormContent />
    </Suspense>
  );
}