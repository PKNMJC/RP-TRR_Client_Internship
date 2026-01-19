"use client";

import React, { useState, useEffect } from "react";
import liff from "@line/liff";
import Swal from "sweetalert2";
import { apiFetch } from "@/services/api";

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

export default function RepairLiffFormPage() {
  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    otherDept: "",
    phone: "",
    issueType: "",
    details: "",
    urgency: "ปกติ",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lineUserId, setLineUserId] = useState("");

  // --- LIFF Init (Only for closing window, no profile fetch) ---
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (liffId) {
          await liff.init({ liffId });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineUserId(profile.userId);
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
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = new FormData();
      // Mapping fields to Backend Expected Keys
      payload.append("reporterName", formData.name);
      payload.append("reporterLineId", lineUserId || "Uguest"); // Required by backend

      let mappedDept = "OTHER";
      const d = formData.dept;
      if (d === "บัญชี (ACCOUNTING)") mappedDept = "ACCOUNTING";
      else if (d === "การขาย (SALES)") mappedDept = "SALES";
      else if (d === "ผลิต (PRODUCTION)") mappedDept = "PRODUCTION";
      else if (d === "ไอที (IT)") mappedDept = "IT";
      else if (d === "บุคคล (HR)") mappedDept = "HR";
      else if (d === "ซ่อมบำรุง (MAINTENANCE)") mappedDept = "MAINTENANCE";

      payload.append("reporterDepartment", mappedDept);

      if (mappedDept === "OTHER") {
        payload.append("otherDepartment", formData.otherDept || formData.dept);
      }

      payload.append("reporterPhone", formData.phone || "ไม่ระบุ");
      payload.append("problemTitle", formData.issueType); // "Issue Type" -> Title
      payload.append("problemDescription", formData.details); // "Details" -> Description
      payload.append("location", "ไม่ระบุ"); // Default as not in new form
      payload.append("problemCategory", "OTHER"); // Default category

      // Map Urgency
      const urgencyMap: Record<string, string> = {
        ปกติ: "NORMAL",
        ด่วน: "URGENT",
        ด่วนที่สุด: "CRITICAL",
      };
      payload.append("urgency", urgencyMap[formData.urgency] || "NORMAL");

      if (file) {
        payload.append("files", file);
      }

      // Backend API Call
      const response = await apiFetch("/api/repairs/liff/create", {
        method: "POST",
        body: payload,
      });

      setIsLoading(false);

      // Success Alert
      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        html: `รหัสแจ้งซ่อมของคุณคือ:<br><h2 style="color:#06C755; margin-top:10px;">${response.ticketCode}</h2><br>เจ้าหน้าที่ได้รับเรื่องแล้วครับ`,
        confirmButtonText: "ปิดหน้าต่าง",
        confirmButtonColor: "#06C755",
        allowOutsideClick: false,
      });

      // Close LIFF window or Reset
      if (liff.isInClient()) {
        liff.closeWindow();
      } else {
        // Reset form for browser testing
        setFormData({
          name: "",
          dept: "",
          otherDept: "",
          phone: "",
          issueType: "",
          details: "",
          urgency: "ปกติ",
        });
        setFile(null);
        // Reset file input manually
        const fileInput = document.getElementById(
          "imageFile",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-950 dark:to-indigo-950/30 font-sans p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-[500px] glass p-6 sm:p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            แจ้งซ่อมออนไลน์
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            กรอกรายละเอียดเพื่อให้เจ้าหน้าที่เข้าดำเนินการ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm ml-1">
              ชื่อผู้แจ้ง
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white text-base placeholder:text-slate-400"
              placeholder="ระบุชื่อผู้แจ้ง"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm ml-1">
              แผนก/โซน
            </label>
            <select
              id="dept"
              value={formData.dept}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white text-base appearance-none cursor-pointer"
              required
            >
              <option value="" disabled className="text-slate-400">
                -- เลือกแผนก --
              </option>
              {DEPARTMENTS.map((d, i) => (
                <option key={i} value={d} className="text-slate-900">
                  {d}
                </option>
              ))}
            </select>

            {/* Custom Dept Input */}
            {formData.dept === "อื่นๆ" && (
              <input
                type="text"
                id="otherDept"
                value={formData.otherDept}
                onChange={handleChange}
                className="w-full mt-3 px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white text-base animate-in slide-in-from-top-2 duration-300"
                placeholder="ระบุแผนก/โซนของคุณ"
                required
              />
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm ml-1">
              เบอร์ติดต่อกลับ (ถ้ามี)
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white text-base placeholder:text-slate-400"
              placeholder="08X-XXX-XXXX"
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>

          <div className="py-2">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
          </div>

          {/* Issue Type */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm ml-1">
              ประเภทอาการ
            </label>
            <div className="relative">
              <input
                type="text"
                id="issueType"
                list="issue-options"
                value={formData.issueType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white text-base placeholder:text-slate-400"
                placeholder="คลิกเพื่อเลือกหรือพิมพ์อาการ"
                required
              />
              <datalist id="issue-options">
                {ISSUE_TYPES.map((t, i) => (
                  <option key={i} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm ml-1">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              id="details"
              value={formData.details}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white text-base placeholder:text-slate-400 resize-none"
              placeholder="เช่น หมายเลขเครื่อง หรือ จุดสังเกตอาการเสีย"
            ></textarea>
          </div>

          {/* Urgency */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm ml-1">
              ความเร่งด่วน
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["ปกติ", "ด่วน", "ด่วนที่สุด"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, urgency: level }))
                  }
                  className={`py-2 text-sm font-bold rounded-lg transition-all border ${
                    formData.urgency === level
                      ? level === "ปกติ"
                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20"
                        : level === "ด่วน"
                          ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20"
                          : "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-500"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="mb-4">
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 text-sm ml-1">
              รูปภาพประกอบ (ถ้ามี)
            </label>
            <div className="relative group">
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="imageFile"
                className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600">
                    {file ? file.name : "เลือกรูปภาพ หรือ ถ่ายรูป"}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>กำลังบันทึก...</span>
              </div>
            ) : (
              "ส่งข้อมูลแจ้งซ่อม"
            )}
          </button>
        </form>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-2xl shadow-blue-500/50"></div>
          <div className="mt-6 text-white text-xl font-black tracking-wider">
            ระบบกำลังประมวลผล...
          </div>
        </div>
      )}
    </div>
  );
}
