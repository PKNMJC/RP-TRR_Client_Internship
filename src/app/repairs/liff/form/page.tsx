"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Upload, X, MapPin, Phone, User, Building2, Wrench } from "lucide-react";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";
import Button from "@/components/Button";
import Card from "@/components/Card";

export const dynamic = "force-dynamic";

const PROBLEM_CATEGORIES = [
  { value: "HARDWARE", label: "💻 Hardware (คอมพิวเตอร์, อุปกรณ์)" },
  { value: "SOFTWARE", label: "📱 Software (โปรแกรม, ระบบ)" },
  { value: "NETWORK", label: "🌐 Network (อินเทอร์เน็ต, Wi-Fi)" },
  { value: "PERIPHERAL", label: "🖥️ Peripheral (เมาส์, คีย์บอร์ด, จอภาพ)" },
  { value: "EMAIL_OFFICE365", label: "📧 Email/Office 365" },
  { value: "ACCOUNT_PASSWORD", label: "🔐 Account/Password" },
  { value: "OTHER", label: "🔧 อื่นๆ" },
];

const URGENCY_LEVELS = [
  { value: "NORMAL", label: "ปกติ (รอได้)", subLabel: "ใช้งานได้ต่อ", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "URGENT", label: "ด่วน", subLabel: "งานสะดุด", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "CRITICAL", label: "ด่วนที่สุด", subLabel: "ทำงานไม่ได้", color: "bg-red-100 text-red-700 border-red-200" },
];

interface SuccessState {
  show: boolean;
  ticketCode?: string;
}

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
  const searchParams = useSearchParams();
  const [lineUserId, setLineUserId] = useState<string>("");
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
  const [success, setSuccess] = useState<SuccessState>({ show: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize LIFF
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

        if (!liffId) {
          console.error("LIFF ID is not set");
          return;
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        const lineUserId = profile.userId;

        setLineUserId(lineUserId);
        setFormData((prev) => ({
          ...prev,
          reporterLineId: lineUserId,
        }));
      } catch (error) {
        console.error("LIFF initialization error:", error);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles: File[] = [];
      const newPreviews: string[] = [];

      for (
        let i = 0;
        i < Math.min(selectedFiles.length, 3 - files.length);
        i++
      ) {
        const file = selectedFiles[i];
        if (file.size <= 5 * 1024 * 1024) {
          newFiles.push(file);

          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reporterName.trim()) newErrors.reporterName = "ระบุชื่อผู้แจ้ง";
    if (!formData.reporterDepartment.trim()) newErrors.reporterDepartment = "ระบุแผนก";
    if (!formData.problemCategory) newErrors.problemCategory = "เลือกประเภทปัญหา";
    if (!formData.problemTitle.trim()) newErrors.problemTitle = "ระบุหัวข้อปัญหา";
    if (formData.problemTitle.length > 0 && formData.problemTitle.length < 5) {
      newErrors.problemTitle = "ระบุอย่างน้อย 5 ตัวอักษร";
    }
    if (!formData.location.trim()) newErrors.location = "ระบุสถานที่";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formPayload.append(key, value);
      });

      files.forEach((file) => {
        formPayload.append("files", file);
      });

      const data = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        headers: {
          Authorization: "",
        },
        body: formPayload,
      });

      setSuccess({ show: true, ticketCode: data.ticketCode });
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่ง",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success.show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="glass text-center p-8 max-w-sm mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            บันทึกสำเร็จ!
          </h2>
          <p className="text-slate-500 mb-8">
            เราได้รับเรื่องแจ้งซ่อมของคุณแล้ว
            <br />เจ้าหน้าที่จะรีบดำเนินการตรวจสอบ
          </p>

          <div className="bg-slate-50/80 rounded-xl p-4 mb-8 border border-slate-100">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ticket ID</p>
            <p className="text-2xl font-mono font-bold text-primary-600 tracking-wider">
              {success.ticketCode}
            </p>
          </div>

          <Button
            onClick={() => liff.closeWindow()}
            fullWidth
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            ปิดหน้าต่าง
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-slate-200/50 px-4 py-4 backdrop-blur-md">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary-600" />
          แจ้งซ่อมอุปกรณ์ IT
        </h1>
      </div>

      <div className="max-w-md mx-auto p-4">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: ผู้แจ้ง */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">ข้อมูลผู้แจ้ง</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="reporterName"
                    value={formData.reporterName}
                    onChange={handleInputChange}
                    placeholder="ชื่อ-เล่นของคุณ"
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all ${
                      errors.reporterName ? "border-red-300 bg-red-50" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.reporterName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.reporterName}</p>}
              </div>

              <div className="col-span-2">
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <select
                    name="reporterDepartment"
                    value={formData.reporterDepartment}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all appearance-none ${
                        errors.reporterDepartment ? "border-red-300 bg-red-50" : "border-slate-200"
                    }`}
                  >
                    <option value="">เลือกแผนกของคุณ</option>
                    <option value="ฝ่ายบัญชี">ฝ่ายบัญชี</option>
                    <option value="ฝ่ายขาย">ฝ่ายขาย</option>
                    <option value="ฝ่ายผลิต">ฝ่ายผลิต</option>
                    <option value="ฝ่ายบริหาร">ฝ่ายบริหาร</option>
                    <option value="ฝ่ายการตลาด">ฝ่ายการตลาด</option>
                    <option value="ฝ่ายอื่นๆ">ฝ่ายอื่นๆ</option>
                  </select>
                </div>
                {errors.reporterDepartment && <p className="text-xs text-red-500 mt-1 ml-1">{errors.reporterDepartment}</p>}
              </div>

              <div className="col-span-2">
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    name="reporterPhone"
                    value={formData.reporterPhone}
                    onChange={handleInputChange}
                    placeholder="เบอร์โทรติดต่อ (ถ้ามี)"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200/60 my-6" />

          {/* Section: ปัญหา */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">รายละเอียดปัญหา</h2>

            <div>
               <div className="relative">
                 <Wrench className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <select
                    name="problemCategory"
                    value={formData.problemCategory}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all appearance-none"
                  >
                    {PROBLEM_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
               </div>
            </div>

            <div>
              <input
                type="text"
                name="problemTitle"
                value={formData.problemTitle}
                onChange={handleInputChange}
                placeholder="ระบุปัญหาที่พบ (สั้นๆ เข้าใจง่าย)"
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all ${
                  errors.problemTitle ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
              />
              {errors.problemTitle && <p className="text-xs text-red-500 mt-1 ml-1">{errors.problemTitle}</p>}
            </div>

            <textarea
              name="problemDescription"
              value={formData.problemDescription}
              onChange={handleInputChange}
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
            />

            <div>
               <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="สถานที่แจ้งซ่อม (ตึก/ชั้น/ห้อง)"
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all ${
                      errors.location ? "border-red-300 bg-red-50" : "border-slate-200"
                    }`}
                  />
               </div>
               {errors.location && <p className="text-xs text-red-500 mt-1 ml-1">{errors.location}</p>}
            </div>
          </div>

           {/* Section: ความเร่งด่วน */}
           <div className="space-y-3 pt-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">ระดับความเร่งด่วน</h2>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`
                    relative flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border-2 transition-all
                    ${formData.urgency === level.value 
                      ? `${level.color} border-current ring-1 ring-offset-1 ring-current/20` 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}
                  `}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={level.value}
                    checked={formData.urgency === level.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold">{level.label}</span>
                  <span className="text-[10px] opacity-80">{level.subLabel}</span>
                </label>
              ))}
            </div>
           </div>


          {/* Section: รูปภาพ */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">รูปประกอบ (ถ้ามี)</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {filePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {files.length < 3 && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-400">เพิ่มรูป</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4 pb-8">
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              fullWidth
              size="lg"
              className="mt-4 shadow-xl shadow-primary-500/20"
            >
              ส่งแจ้งซ่อม
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>}>
      <RepairLiffFormContent />
    </Suspense>
  );
}
