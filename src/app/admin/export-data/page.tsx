"use client";

import { useState } from "react";
import {
  Download,
  FileJson,
  FileText,
  Database,
  BarChart3,
  Users,
  Wrench,
  Package,
  LogIn,
  ArrowRight,
  CheckCircle,
  Clock,
  FileSpreadsheet,
} from "lucide-react";

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number }>;
  formats: ("csv" | "json" | "pdf" | "xlsx")[];
  color: string;
  bgColor: string;
  count?: number;
  lastExport?: string;
}

export default function ExportDataPage() {
  const [selectedFormat, setSelectedFormat] = useState<
    "csv" | "json" | "pdf" | "xlsx"
  >("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([
    {
      id: 1,
      name: "Repairs Export",
      format: "CSV",
      date: "2025-01-27",
      time: "14:30",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Users Export",
      format: "JSON",
      date: "2025-01-25",
      time: "10:15",
      size: "1.2 MB",
    },
    {
      id: 3,
      name: "Analytics Report",
      format: "PDF",
      date: "2025-01-20",
      time: "16:45",
      size: "3.8 MB",
    },
  ]);

  const exportOptions: ExportOption[] = [
    {
      id: "repairs",
      title: "งานซ่อมแซม",
      description: "ข้อมูลทั้งหมดของงานซ่อมแซมรวมถึงสถานะและรายละเอียด",
      icon: Wrench,
      formats: ["csv", "json", "pdf", "xlsx"],
      color: "text-amber-500",
      bgColor: "bg-amber-900/20",
      count: 248,
      lastExport: "27 ม.ค. 2565",
    },
    {
      id: "users",
      title: "ข้อมูลผู้ใช้",
      description: "รายชื่อผู้ใช้ทั้งหมด สิทธิ์ การเข้าถึง และแผนก",
      icon: Users,
      formats: ["csv", "json", "xlsx"],
      color: "text-blue-500",
      bgColor: "bg-blue-900/20",
      count: 156,
      lastExport: "25 ม.ค. 2565",
    },
    {
      id: "loans",
      title: "บันทึกยืม-คืน",
      description: "รายการทั้งหมดของการยืมและการคืนอุปกรณ์",
      icon: Package,
      formats: ["csv", "json", "pdf", "xlsx"],
      color: "text-emerald-500",
      bgColor: "bg-emerald-900/20",
      count: 78,
      lastExport: "20 ม.ค. 2565",
    },
    {
      id: "analytics",
      title: "รายงานสถิติ",
      description: "วิเคราะห์ข้อมูล กราฟ และรายงานประสิทธิภาพ",
      icon: BarChart3,
      formats: ["json", "pdf", "xlsx"],
      color: "text-purple-500",
      bgColor: "bg-purple-900/20",
      lastExport: "27 ม.ค. 2565",
    },
    {
      id: "audit-logs",
      title: "บันทึกการเข้าถึง",
      description: "บันทึกการกระทำของผู้ใช้ และเหตุการณ์ระบบ",
      icon: LogIn,
      formats: ["csv", "json", "xlsx"],
      color: "text-cyan-500",
      bgColor: "bg-cyan-900/20",
      lastExport: "27 ม.ค. 2565",
    },
    {
      id: "database",
      title: "ส่งออกฐานข้อมูล",
      description: "ดาวน์โหลดข้อมูลฐานข้อมูลทั้งหมดในรูปแบบไฟล์สำรอง",
      icon: Database,
      formats: ["json", "xlsx"],
      color: "text-pink-500",
      bgColor: "bg-pink-900/20",
      lastExport: "27 ม.ค. 2565",
    },
  ];

  const handleExport = async (optionId: string) => {
    try {
      setIsExporting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const option = exportOptions.find((o) => o.id === optionId);
      if (option) {
        // Add to history
        setExportHistory([
          {
            id: exportHistory.length + 1,
            name: `${option.title} Export`,
            format: selectedFormat.toUpperCase(),
            date: new Date().toLocaleDateString("th-TH"),
            time: new Date().toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            size: (Math.random() * 5 + 0.5).toFixed(1) + " MB",
          },
          ...exportHistory,
        ]);

        // Simulate file download
        let dataStr: string;
        let mimeType: string;
        let fileExtension: string;

        if (selectedFormat === "json") {
          dataStr = JSON.stringify(
            {
              data: option.title,
              exportedAt: new Date().toISOString(),
            },
            null,
            2,
          );
          mimeType = "application/json";
          fileExtension = "json";
        } else if (selectedFormat === "csv") {
          dataStr = `Data,Value\n${option.title},${option.count || "N/A"}`;
          mimeType = "text/csv;charset=utf-8;";
          fileExtension = "csv";
        } else if (selectedFormat === "xlsx") {
          // ส่งออก JSON (สำหรับ demo) ใน production ใช้ library xlsx
          dataStr = JSON.stringify(
            {
              data: option.title,
              count: option.count,
              exportedAt: new Date().toISOString(),
            },
            null,
            2,
          );
          mimeType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          fileExtension = "xlsx";
        } else {
          dataStr = `PDF Report: ${option.title}`;
          mimeType = "application/pdf";
          fileExtension = "pdf";
        }

        const element = document.createElement("a");
        element.setAttribute(
          "href",
          `data:${mimeType},${encodeURIComponent(dataStr)}`,
        );
        element.setAttribute(
          "download",
          `${option.id}-export.${fileExtension}`,
        );
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        alert(
          `ส่งออก ${option.title} เป็น ${selectedFormat === "xlsx" ? "EXCEL" : selectedFormat.toUpperCase()} เรียบร้อย`,
        );
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">นำออกข้อมูล</h1>
        <p className="text-slate-300">
          ส่งออกข้อมูลต่างๆ ในรูปแบบที่ต้องการ (CSV, JSON, PDF, Excel)
        </p>
      </div>

      {/* Format Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">เลือกรูปแบบไฟล์</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["csv", "json", "pdf", "xlsx"].map((format) => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format as any)}
              className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                selectedFormat === format
                  ? "bg-blue-600/30 border-blue-500 text-blue-300"
                  : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              {format === "csv" && (
                <FileText className="inline mr-2" size={20} />
              )}
              {format === "json" && (
                <FileJson className="inline mr-2" size={20} />
              )}
              {format === "pdf" && (
                <Download className="inline mr-2" size={20} />
              )}
              {format === "xlsx" && (
                <FileSpreadsheet className="inline mr-2" size={20} />
              )}
              {format === "xlsx" ? "EXCEL" : format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          เลือกข้อมูลที่ต้องการ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isAvailable = option.formats.includes(selectedFormat);

            return (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-xl border transition-all ${
                  isAvailable
                    ? "border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600"
                    : "border-slate-700/50 bg-slate-800/10 opacity-50"
                }`}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute top-0 right-0 w-24 h-24 ${option.bgColor} rounded-full -mr-12 -mt-12 blur-xl`}
                />

                <div className="relative z-10 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-lg ${option.bgColor} border border-slate-700 flex items-center justify-center`}
                    >
                      <span className={option.color}>
                        <Icon size={24} />
                      </span>
                    </div>
                    {option.count && (
                      <span className="text-xs font-semibold text-slate-400">
                        {option.count} รายการ
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {option.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {option.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-slate-400 text-xs">
                      <Clock size={14} className="mr-2" />
                      <span>อัปเดตล่าสุด: {option.lastExport}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {option.formats.map((format) => (
                        <span
                          key={format}
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            format === selectedFormat
                              ? "bg-blue-600/30 text-blue-300"
                              : "bg-slate-700/50 text-slate-400"
                          }`}
                        >
                          {format.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleExport(option.id)}
                    disabled={!isAvailable || isExporting}
                    className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      isAvailable
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Download size={18} />
                    {isExporting ? "กำลังส่งออก..." : "ส่งออก"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">ประวัติการส่งออก</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
          <div className="divide-y divide-slate-700">
            {exportHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-700/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle size={20} className="text-green-500" />
                  <div>
                    <p className="text-slate-200 font-medium">{item.name}</p>
                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                      <span>{item.format}</span>
                      <span>•</span>
                      <span>
                        {item.date} {item.time}
                      </span>
                      <span>•</span>
                      <span>{item.size}</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm font-medium transition-all">
                  <Download size={16} className="inline mr-1" />
                  ดาวน์โหลด
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
