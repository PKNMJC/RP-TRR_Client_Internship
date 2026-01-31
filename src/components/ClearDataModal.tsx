"use client";

import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  dataManagementService,
  DataTypeInfo,
} from "@/services/dataManagementService";

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClearDataModal({
  isOpen,
  onClose,
}: ClearDataModalProps) {
  const [step, setStep] = useState<
    "select" | "confirm" | "processing" | "result"
  >("select");
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [exportFirst, setExportFirst] = useState(true);
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    deleted?: Record<string, number>;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDataTypes();
      setStep("select");
      setSelectedTypes([]);
      setConfirmationText("");
      setResult(null);
    }
  }, [isOpen]);

  const fetchDataTypes = async () => {
    try {
      setLoading(true);
      const types = await dataManagementService.getDataTypes();
      setDataTypes(types);
      // Pre-select types with data > 0
      setSelectedTypes(
        types
          .filter((t: DataTypeInfo) => t.count > 0)
          .map((t: DataTypeInfo) => t.key),
      );
    } catch (error) {
      console.error("Failed to fetch data types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleClearData = async () => {
    try {
      setStep("processing");
      const response = await dataManagementService.clearData(
        selectedTypes,
        exportFirst,
      );

      if (exportFirst) {
        // Handle file download
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `data-backup-${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();

        // After download, show success (assuming API returns success status or we infer it)
        // Since blob doesn't contain JSON result, we assume success if no error thrown
        setResult({ success: true, deleted: {} }); // We don't get detailed stats with blob response easily
      } else {
        setResult(response);
      }

      setStep("result");
      // Refresh counts for next time
      fetchDataTypes();
    } catch (error) {
      console.error("Failed to clear data:", error);
      setResult({ success: false, error: "เกิดข้อผิดพลาดในการล้างข้อมูล" });
      setStep("result");
    }
  };

  const totalRecords = dataTypes
    .filter((t) => selectedTypes.includes(t.key))
    .reduce((sum, t) => sum + t.count, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">ระบบล้างข้อมูล</h2>
              <p className="text-red-100 text-xs">
                จัดการข้อมูลระบบอย่างระมัดระวัง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "select" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertTriangle
                  className="text-amber-600 shrink-0 mt-0.5"
                  size={20}
                />
                <div className="space-y-1">
                  <h3 className="font-semibold text-amber-800 text-sm">
                    คำเตือนสำคัญ
                  </h3>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    การล้างข้อมูลจะไม่สามารถกู้คืนได้
                    กรุณาตรวจสอบข้อมูลที่เลือกให้แน่ใจก่อนดำเนินการ
                    แนะนำให้ทำการสำรองข้อมูล (Export) ทุกครั้ง
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-sm">กำลังโหลดข้อมูล...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {dataTypes.map((type) => (
                    <div
                      key={type.key}
                      onClick={() => handleToggleType(type.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedTypes.includes(type.key)
                          ? "border-red-500 bg-red-50"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            selectedTypes.includes(type.key)
                              ? "bg-red-500 border-red-500"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {selectedTypes.includes(type.key) && (
                            <CheckCircle size={14} className="text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {type.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          type.count > 0
                            ? "bg-gray-100 text-gray-700"
                            : "bg-gray-50 text-gray-300"
                        }`}
                      >
                        {type.count} รายการ
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={exportFirst}
                    onChange={(e) => setExportFirst(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-blue-600" />
                      ส่งออก Excel ก่อนลบ (แนะนำ)
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      ระบบจะทำการดาวน์โหลดไฟล์ Excel ให้ก่อนที่จะลบข้อมูล
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={selectedTypes.length === 0}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow active:scale-[0.98]"
                >
                  ดำเนินการต่อ ({totalRecords} รายการ)
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">
                  ยืนยันการลบข้อมูล?
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  คุณกำลังจะลบข้อมูล {selectedTypes.length} ประเภท รวมทั้งหมด{" "}
                  <span className="font-bold text-red-600">{totalRecords}</span>{" "}
                  รายการ
                  {exportFirst ? " (จะทำการส่งออกไฟล์ Excel ก่อนลบ)" : ""}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-xl text-left border border-red-100">
                <label className="block text-xs font-semibold text-red-800 mb-2">
                  พิมพ์คำว่า &quot;ยืนยัน&quot; เพื่อดำเนินการ
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="ยืนยัน"
                  className="w-full px-4 py-2.5 rounded-lg border-red-200 focus:border-red-500 focus:ring-red-200"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleClearData}
                  disabled={confirmationText !== "ยืนยัน"}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ลบข้อมูลทันที
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 opacity-50" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  กำลังประมวลผล...
                </h3>
                <p className="text-gray-500 text-sm">
                  {exportFirst
                    ? "กำลังเตรียมไฟล์ Excel และลบข้อมูล"
                    : "กำลังลบข้อมูลออกจากระบบ"}
                </p>
                <p className="text-xs text-gray-400 mt-2">ห้ามปิดหน้าต่างนี้</p>
              </div>
            </div>
          )}

          {step === "result" && (
            <div className="py-8 text-center space-y-6">
              {result?.success ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {result?.success ? "ดำเนินการสำเร็จ" : "เกิดข้อผิดพลาด"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {result?.success
                    ? "ลบข้อมูลเรียบร้อยแล้ว " +
                      (exportFirst ? "และดาวน์โหลดไฟล์ Backup แล้ว" : "")
                    : result?.error}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
