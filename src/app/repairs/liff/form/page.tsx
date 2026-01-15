"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  AlertCircle, CheckCircle2, Loader2, Upload, X, MapPin, 
  Phone, User, Building2, Wrench, Camera, Image as ImageIcon,
  ChevronRight, Info, Plus, LayoutGrid
} from "lucide-react";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";

// --- Constants ---
const URGENCY_LEVELS = [
  { value: "NORMAL", label: "ทั่วไป", subLabel: "ความเร่งด่วนปกติ", color: "peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
  { value: "URGENT", label: "ด่วน", subLabel: "จำเป็นต้องใช้งาน", color: "peer-checked:bg-orange-50 peer-checked:border-orange-500 peer-checked:text-orange-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
  { value: "CRITICAL", label: "ด่วนที่สุด", subLabel: "งานหยุดชะงัก", color: "peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
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

const IMAGE_CATEGORIES = [
  { id: 'monitor', label: 'หน้าจอ', icon: '📺' },
  { id: 'pc', label: 'คอมพิวเตอร์', icon: '💻' },
  { id: 'printer', label: 'เครื่องพิมพ์', icon: '🖨️' },
  { id: 'network', label: 'อินเทอร์เน็ต', icon: '🌐' },
  { id: 'mouse_keyboard', label: 'เมาส์/คีย์บอร์ด', icon: '🖱️' },
  { id: 'software', label: 'โปรแกรม', icon: '💿' },
];

function RepairLiffFormContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [linePictureUrl, setLinePictureUrl] = useState<string>("");
  const [deviceOS, setDeviceOS] = useState<string>("");
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

  const [files, setFiles] = useState<(File | string)[]>([]); // Can be File or Category ID/Icon
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [showImageSource, setShowImageSource] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
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

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      
      reader.onerror = reject;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200; // Resize to reasonable max width for mobile
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed'));
          }
        }, 'image/jpeg', 0.7); // 70% quality JPEG
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const remainingSlots = 3 - files.length;
      
      const fileArray = Array.from(selectedFiles).slice(0, remainingSlots);
      
      // Filter large files (> 30MB mostly video accident) but try compressing typical images
      const processableFiles = fileArray.filter(f => f.size <= 30 * 1024 * 1024);

      setLoading(true); // Show loading while compressing
      try {
        const compressedFiles = await Promise.all(processableFiles.map(f => compressImage(f)));
        
        const validFiles: File[] = [];
        compressedFiles.forEach(file => {
          validFiles.push(file);
          const reader = new FileReader();
          reader.onloadend = () => setFilePreviews(prev => [...prev, reader.result as string]);
          reader.readAsDataURL(file);
        });

        setFiles(prev => [...prev, ...validFiles]);
        setShowImageSource(false);
      } catch (error) {
        console.error("Compression error:", error);
        setErrors({ submit: "ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่" });
      } finally {
        setLoading(false);
      }
    }
  };

  const addCategoryAsImage = (category: typeof IMAGE_CATEGORIES[0]) => {
    if (files.length < 3) {
      setFiles(prev => [...prev, `CATEGORY:${category.id}`]);
      setFilePreviews(prev => [...prev, category.icon]);
      setShowCategoryPicker(false);
      setShowImageSource(false);
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
      
      // Handle Department logic
      const finalDepartment = formData.reporterDepartment === "OTHER" 
        ? (formData.otherDepartment || "OTHER") 
        : formData.reporterDepartment;

      Object.entries(formData).forEach(([key, val]) => {
        if (key === "reporterDepartment") {
          payload.append(key, finalDepartment);
        } else if (key !== "otherDepartment") {
          payload.append(key, val || "");
        }
      });

      // Handle Files and Category markers
      const categoryMarkers: string[] = [];
      files.forEach(item => {
        if (item instanceof File) {
          payload.append("files", item);
        } else if (typeof item === "string" && item.startsWith("CATEGORY:")) {
          categoryMarkers.push(item.split(":")[1]);
        }
      });

      if (categoryMarkers.length > 0) {
        payload.append("imageCategories", JSON.stringify(categoryMarkers));
      }

      if (linePictureUrl) payload.append("pictureUrl", linePictureUrl);

      const data = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        body: payload,
      });
      setSuccess({ show: true, ticketCode: data.ticketCode });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Submission failed";
      console.error("Submit Error:", err);
      setErrors({ submit: errorMessage });
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
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <User size={14} className="text-blue-500" /> ข้อมูลผู้ส่งเรื่อง
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block ml-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleInputChange}
                  placeholder="กรุณากรอกชื่อ-นามสกุล"
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block ml-1">หน่วยงาน / ฝ่าย <span className="text-red-500">*</span></label>
                  <div className="space-y-3">
                    <select
                      name="reporterDepartment"
                      value={formData.reporterDepartment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white appearance-none transition-all"
                      required
                    >
                      <option value="">กรุณาเลือกฝ่ายหรืองาน</option>
                      <option value="ACCOUNTING">ฝ่ายบัญชี</option>
                      <option value="SALES">ฝ่ายขาย</option>
                      <option value="PRODUCTION">ฝ่ายผลิต</option>
                      <option value="IT">ฝ่ายไอที</option>
                      <option value="HR">ฝ่ายบุคคล</option>
                      <option value="MAINTENANCE">ฝ่ายซ่อมบำรุง</option>
                      <option value="OTHER">อื่นๆ (โปรดระบุ)</option>
                    </select>
                    
                    {formData.reporterDepartment === "OTHER" && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <input
                          type="text"
                          name="otherDepartment"
                          value={formData.otherDepartment}
                          onChange={handleInputChange}
                          placeholder="ระบุตำแหน่งหรือหน่วยงานของคุณ"
                          className="w-full px-4 py-3.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white placeholder:text-blue-400/60"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block ml-1">ช่องทางติดต่อ (เบอร์โทรศัพท์)</label>
                  <input
                    type="tel"
                    name="reporterPhone"
                    value={formData.reporterPhone}
                    onChange={handleInputChange}
                    placeholder="ตัวอย่าง 081-234-5678"
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Problem Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> รายละเอียดปัญหา <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  name="problemTitle"
                  value={formData.problemTitle}
                  onChange={handleInputChange}
                  placeholder="สรุปปัญหาเบื้องต้น (เช่น พิมพ์งานไม่ได้, เข้าเน็ตไม่ได้)"
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all font-medium"
                  required
                />
              </div>
              <div>
                <textarea
                  name="problemDescription"
                  value={formData.problemDescription}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="กรุณาระบุรายละเอียดเพิ่มเติมของปัญหา เพื่อความรวดเร็วในการตรวจสอบ..."
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white resize-none transition-all text-sm leading-relaxed"
                />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-3.5 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="สถานที่ปฏิบัติงาน / อาคาร / ชั้น / เลขโต๊ะ"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photo Upload (Professional Grid) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Camera size={14} className="text-blue-500" /> ภาพถ่ายหรือสัญลักษณ์ประกอบ
              </h2>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full text-blue-600 dark:text-blue-400 font-bold tracking-wider">{files.length}/3</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {filePreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group ring-1 ring-slate-100 dark:ring-slate-800">
                  {src.startsWith('data:') ? (
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl">
                      {src}
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeFile(i)} 
                    className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-all scale-90 group-hover:scale-100"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {files.length < 3 && (
                <button
                  type="button"
                  onClick={() => setShowImageSource(true)}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">เพิ่มรูป</span>
                </button>
              )}
            </div>
            {/* Hidden inputs but kept in layout for programmatic access */}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange} 
              onClick={(e) => (e.target as HTMLInputElement).value = ''}
              className="absolute w-0 h-0 opacity-0 overflow-hidden" 
            />
            <input 
              ref={cameraInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleFileChange} 
              onClick={(e) => (e.target as HTMLInputElement).value = ''}
              className="absolute w-0 h-0 opacity-0 overflow-hidden" 
            />
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

          {/* Error Message Display */}
          {errors.submit && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-800 dark:text-red-300">เกิดข้อผิดพลาด</h4>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-3xl font-bold shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>ส่งเรื่องแจ้งซ่อม <ChevronRight size={18} /></>}
          </button>
        </form>
      </main>

      {/* Image Source Picker Modal */}
      {showImageSource && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">เพิ่มรูปประกอบ</h3>
              <button onClick={() => setShowImageSource(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-8">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <Camera size={28} />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">ถ่ายรูป</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <ImageIcon size={28} />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">คลังภาพ</span>
              </button>
              <button 
                onClick={() => setShowCategoryPicker(true)}
                className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <LayoutGrid size={28} />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">หมวดหมู่</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200 p-6">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">เลือกสัญลักษณ์</h3>
              <button onClick={() => setShowCategoryPicker(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">ระบุสัญลักษณ์ที่ตรงกับปัญหาของคุณเบื้องต้น</p>
            <div className="grid grid-cols-3 gap-4">
              {IMAGE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => addCategoryAsImage(cat)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-slate-50 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 line-clamp-1">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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