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
    phone: "",
    issueType: "",
    details: "",
    urgency: "ปกติ",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- LIFF Init (Only for closing window, no profile fetch) ---
  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (liffId) {
          await liff.init({ liffId });
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

      payload.append("reporterPhone", formData.phone);
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
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถเชื่อมต่อ Server ได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans p-5 flex items-center justify-center">
      <div className="w-full max-w-[500px] bg-white p-[30px] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-[#0d6efd] mb-1">
            แจ้งซ่อมออนไลน์
          </h3>
          <p className="text-[#6c757d] text-sm">
            กรอกรายละเอียดเพื่อแจ้งเจ้าหน้าที่
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label className="block font-semibold text-[#333] mb-2 text-sm">
              ชื่อผู้แจ้ง
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#dee2e6] rounded-md focus:outline-none focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd]/25 transition-all text-sm"
              placeholder="ระบุชื่อเล่น หรือชื่อจริง"
              required
            />
          </div>

          {/* Department */}
          <div className="mb-4">
            <label className="block font-semibold text-[#333] mb-2 text-sm">
              แผนก/โซน
            </label>
            <select
              id="dept"
              value={formData.dept}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#dee2e6] rounded-md focus:outline-none focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd]/25 transition-all text-sm bg-white"
              required
            >
              <option value="" disabled>
                -- เลือกแผนก --
              </option>
              {DEPARTMENTS.map((d, i) => (
                <option key={i} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block font-semibold text-[#333] mb-2 text-sm">
              เบอร์ติดต่อกลับ
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#dee2e6] rounded-md focus:outline-none focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd]/25 transition-all text-sm"
              placeholder="เช่น 0812345678"
              required
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>

          <hr className="my-6 border-t border-[#dee2e6]" />

          {/* Issue Type */}
          <div className="mb-4">
            <label className="block font-semibold text-[#333] mb-2 text-sm">
              ประเภทอาการ
            </label>
            <select
              id="issueType"
              value={formData.issueType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#dee2e6] rounded-md focus:outline-none focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd]/25 transition-all text-sm bg-white"
              required
            >
              <option value="" disabled>
                -- เลือกอาการ --
              </option>
              {ISSUE_TYPES.map((t, i) => (
                <option key={i} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Details */}
          <div className="mb-4">
            <label className="block font-semibold text-[#333] mb-2 text-sm">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              id="details"
              value={formData.details}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-[#dee2e6] rounded-md focus:outline-none focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd]/25 transition-all text-sm"
              placeholder="ระบุอาการเสีย หรือจุดสังเกตเพิ่มเติม"
            ></textarea>
          </div>

          {/* Urgency */}
          <div className="mb-4">
            <label className="block font-semibold text-[#333] mb-2 text-sm">
              ความเร่งด่วน
            </label>
            <select
              id="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#dee2e6] rounded-md focus:outline-none focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd]/25 transition-all text-sm bg-white"
            >
              <option value="ปกติ">ปกติ</option>
              <option value="ด่วน">ด่วน</option>
              <option value="ด่วนที่สุด">ด่วนที่สุด</option>
            </select>
          </div>

          {/* Image */}
          <div className="mb-6">
            <label className="block font-semibold text-[#333] mb-2 text-sm">
              รูปภาพประกอบ (ถ้ามี)
            </label>
            <input
              type="file"
              id="imageFile"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-[#dee2e6] rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#e9ecef] file:text-[#495057] hover:file:bg-[#dee2e6]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#06C755] hover:bg-[#05a546] text-white rounded-full font-bold shadow-sm transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "กำลังบันทึกข้อมูล..." : "ยืนยันแจ้งซ่อม"}
          </button>
        </form>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 z-[9999] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#0d6efd] border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-3 text-[#6c757d] font-bold">
            กำลังบันทึกข้อมูล...
          </div>
        </div>
      )}
    </div>
  );
}
