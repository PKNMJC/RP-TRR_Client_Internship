"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { apiFetch } from "@/services/api";

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
  { value: "NORMAL", label: "🟢 ปกติ (สามารถทำงานได้ต่อ)", emoji: "🟢" },
  {
    value: "URGENT",
    label: "🟡 ด่วน (ส่งผลต่อการทำงาน)",
    emoji: "🟡",
  },
  {
    value: "CRITICAL",
    label: "🔴 ด่วนมาก (หยุดงานทันที)",
    emoji: "🔴",
  },
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
    // ดึง lineUserId จาก URL params (ถ้ามี)
    const id = searchParams.get("lineUserId") || "";
    setLineUserId(id);

    // ตั้งค่า reporterLineId ด้วย
    if (id) {
      setFormData((prev) => ({
        ...prev,
        reporterLineId: id,
      }));
    }
  }, [searchParams]);

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
    // Clear error for this field
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
          // 5MB max
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

    if (!formData.reporterName.trim()) {
      newErrors.reporterName = "กรุณากรอกชื่อเล่น";
    }
    if (!formData.reporterDepartment.trim()) {
      newErrors.reporterDepartment = "กรุณาเลือกแผนก";
    }
    if (!formData.problemCategory) {
      newErrors.problemCategory = "กรุณาเลือกประเภทปัญหา";
    }
    if (!formData.problemTitle.trim()) {
      newErrors.problemTitle = "กรุณากรอกปัญหาที่พบ";
    }
    if (formData.problemTitle.length < 10) {
      newErrors.problemTitle = "ปัญหาต้องมีความยาวอย่างน้อย 10 ตัวอักษร";
    }
    if (!formData.location.trim()) {
      newErrors.location = "กรุณากรอกสถานที่";
    }

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

      // Append form data
      formPayload.append("reporterName", formData.reporterName);
      formPayload.append("reporterDepartment", formData.reporterDepartment);
      formPayload.append("reporterPhone", formData.reporterPhone);
      if (formData.reporterLineId) {
        formPayload.append("reporterLineId", formData.reporterLineId);
      }
      formPayload.append("problemCategory", formData.problemCategory);
      formPayload.append("problemTitle", formData.problemTitle);
      formPayload.append("problemDescription", formData.problemDescription);
      formPayload.append("location", formData.location);
      formPayload.append("urgency", formData.urgency);

      // Append files
      files.forEach((file) => {
        formPayload.append("files", file);
      });

      // Use LIFF endpoint - no token needed
      const data = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-8">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            ✅ แจ้งซ่อมสำเร็จ!
          </h2>
          <p className="text-gray-600 mb-6">ทีมงานจะดำเนินการโดยเร็วที่สุด</p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-500 mb-2">เลขที่รายการ:</p>
            <p className="text-lg font-mono font-bold text-gray-800">
              {success.ticketCode}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              คุณสามารถตรวจสอบสถานะได้ทันที่โดยกดปุ่ม "📋 ตรวจสอบสถานะ" ใน LINE
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "line://nv/notification")}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
          >
            ปิด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🔧 แจ้งซ่อมอุปกรณ์ IT
            </h1>
            <p className="text-gray-600">
              กรุณากรอกข้อมูลเพื่อให้เราสามารถช่วยเหลือคุณอย่างรวดเร็ว
            </p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ชื่อเล่น */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อเล่น <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="reporterName"
                value={formData.reporterName}
                onChange={handleInputChange}
                placeholder="เช่น ปอนด์, แนน, โจ"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.reporterName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.reporterName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.reporterName}
                </p>
              )}
            </div>

            {/* แผนก */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แผนก <span className="text-red-600">*</span>
              </label>
              <select
                name="reporterDepartment"
                value={formData.reporterDepartment}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.reporterDepartment
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">เลือกแผนก</option>
                <option value="ฝ่ายบัญชี">ฝ่ายบัญชี</option>
                <option value="ฝ่ายขาย">ฝ่ายขาย</option>
                <option value="ฝ่ายผลิต">ฝ่ายผลิต</option>
                <option value="ฝ่ายบริหาร">ฝ่ายบริหาร</option>
                <option value="ฝ่ายการตลาด">ฝ่ายการตลาด</option>
                <option value="ฝ่ายอื่นๆ">ฝ่ายอื่นๆ</option>
              </select>
              {errors.reporterDepartment && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.reporterDepartment}
                </p>
              )}
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์ (ตัวเลือก)
              </label>
              <input
                type="tel"
                name="reporterPhone"
                value={formData.reporterPhone}
                onChange={handleInputChange}
                placeholder="0xx-xxx-xxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* ประเภทปัญหา */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทปัญหา <span className="text-red-600">*</span>
              </label>
              <select
                name="problemCategory"
                value={formData.problemCategory}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.problemCategory ? "border-red-500" : "border-gray-300"
                }`}
              >
                {PROBLEM_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.problemCategory && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.problemCategory}
                </p>
              )}
            </div>

            {/* ปัญหาที่พบ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปัญหาที่พบ <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="problemTitle"
                value={formData.problemTitle}
                onChange={handleInputChange}
                placeholder="เช่น คอมพิวเตอร์เปิดไม่ติด"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.problemTitle ? "border-red-500" : "border-gray-300"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                ต้องมีความยาวอย่างน้อย 10 ตัวอักษร
              </p>
              {errors.problemTitle && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.problemTitle}
                </p>
              )}
            </div>

            {/* สถานที่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานที่ <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="เช่น อาคาร A ชั้น 2 ห้อง 201"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียดเพิ่มเติม (ตัวเลือก)
              </label>
              <textarea
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleInputChange}
                placeholder="เช่น เปิดคอมแล้วจอดำ มีเสียงบี๊บ 3 ครั้ง"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>

            {/* แนบรูปภาพ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แนบรูปภาพ (ตัวเลือก - สูงสุด 3 รูป)
              </label>
              <div className="space-y-4">
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length < 3 && (
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        คลิกเลือกรูปภาพหรือลากมาวาง
                      </span>
                    </div>
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

            {/* ความเร่งด่วน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ระดับความเร่งด่วน
              </label>
              <div className="space-y-2">
                {URGENCY_LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={level.value}
                      checked={formData.urgency === level.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                "ส่งแบบฟอร์มแจ้งซ่อม"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RepairLiffFormPage() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <RepairLiffFormContent />
    </Suspense>
  );
}
