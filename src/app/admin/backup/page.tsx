"use client";

import { useState } from "react";
import {
  Database,
  Plus,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw,
  Trash2,
  Lock,
  UnlockOpen,
} from "lucide-react";

interface Backup {
  id: string;
  name: string;
  size: string;
  date: string;
  time: string;
  type: "automatic" | "manual";
  status: "completed" | "failed" | "in-progress";
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: "1",
      name: "Automatic Backup - Jan 27",
      size: "2.4 GB",
      date: "27 ม.ค. 2565",
      time: "02:00",
      type: "automatic",
      status: "completed",
    },
    {
      id: "2",
      name: "Manual Backup - Admin",
      size: "2.3 GB",
      date: "25 ม.ค. 2565",
      time: "14:30",
      type: "manual",
      status: "completed",
    },
    {
      id: "3",
      name: "Automatic Backup - Jan 26",
      size: "2.2 GB",
      date: "26 ม.ค. 2565",
      time: "02:00",
      type: "automatic",
      status: "completed",
    },
    {
      id: "4",
      name: "Manual Backup - System",
      size: "2.1 GB",
      date: "20 ม.ค. 2565",
      time: "10:15",
      type: "manual",
      status: "completed",
    },
  ]);

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [isDatabaseLocked, setIsDatabaseLocked] = useState(false);

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      // Simulate backup creation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const newBackup: Backup = {
        id: Date.now().toString(),
        name: `Manual Backup - ${new Date().toLocaleString("th-TH")}`,
        size: (Math.random() * 0.5 + 2).toFixed(1) + " GB",
        date: new Date().toLocaleDateString("th-TH"),
        time: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "manual",
        status: "completed",
      };

      setBackups([newBackup, ...backups]);
      alert("สร้างสำรองข้อมูลเรียบร้อย");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการสร้างสำรอง");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (
      !window.confirm(
        "คุณแน่ใจหรือว่าต้องการกู้คืนข้อมูล? ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลจากสำรอง",
      )
    ) {
      return;
    }

    try {
      setIsRestoringBackup(true);
      // Simulate restore
      await new Promise((resolve) => setTimeout(resolve, 4000));
      alert("กู้คืนข้อมูลเรียบร้อย ระบบกำลังรีสตาร์ท...");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการกู้คืน");
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบสำรองข้อมูลนี้?")) {
      return;
    }

    try {
      setBackups(backups.filter((b) => b.id !== backupId));
      alert("ลบสำรองข้อมูลเรียบร้อย");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "in-progress":
        return "text-blue-400";
      default:
        return "text-slate-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "สำเร็จ";
      case "failed":
        return "ล้มเหลว";
      case "in-progress":
        return "กำลังดำเนิน";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          สำรองและกู้คืนข้อมูล
        </h1>
        <p className="text-slate-300">
          จัดการสำรองข้อมูลฐานข้อมูลและกู้คืนหากจำเป็น
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">ขนาดฐานข้อมูล</h3>
            <Database size={20} className="text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-white">2.5 GB</p>
          <p className="text-sm text-slate-400 mt-2">ใช้งาน 75% ของความจุ</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">สำรองล่าสุด</h3>
            <Clock size={20} className="text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-white">27 ม.ค.</p>
          <p className="text-sm text-slate-400 mt-2">02:00 (อัตโนมัติ)</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium">สถานะระบบ</h3>
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">ปกติ</p>
          <p className="text-sm text-slate-400 mt-2">พร้อมใช้งาน</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="rounded-xl border-2 border-amber-700/50 bg-amber-900/20 p-6 flex items-start gap-4">
        <AlertCircle size={24} className="text-amber-500 shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-100 mb-1">ข้อมูลสำคัญ</h3>
          <p className="text-amber-200 text-sm">
            สำรองข้อมูลอัตโนมัติจะทำการสำรองทุกวันเวลา 02:00 น.
            โปรดตรวจสอบให้แน่ใจว่าระบบทำงานอยู่ตลอดเวลา
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">การดำเนินการ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                กำลังสร้างสำรอง...
              </>
            ) : (
              <>
                <Plus size={20} />
                สร้างสำรองใหม่
              </>
            )}
          </button>

          <button
            onClick={() => setIsDatabaseLocked(!isDatabaseLocked)}
            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-medium transition-all flex items-center justify-center gap-2"
          >
            {isDatabaseLocked ? (
              <>
                <Lock size={20} />
                ล็อคฐานข้อมูล
              </>
            ) : (
              <>
                <UnlockOpen size={20} />
                ปลดล็อคฐานข้อมูล
              </>
            )}
          </button>

          <button className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-medium transition-all flex items-center justify-center gap-2">
            <Upload size={20} />
            นำเข้าสำรอง
          </button>
        </div>
      </div>

      {/* Backups List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          รายการสำรองข้อมูล ({backups.length})
        </h2>
        <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/30">
          <div className="divide-y divide-slate-700">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="p-6 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center shrink-0">
                      <HardDrive size={24} className="text-cyan-500" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-100">
                          {backup.name}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            backup.type === "automatic"
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-amber-900/30 text-amber-400"
                          }`}
                        >
                          {backup.type === "automatic"
                            ? "อัตโนมัติ"
                            : "ด้วยตนเอง"}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            backup.status === "completed"
                              ? "bg-green-900/30 text-green-400"
                              : backup.status === "failed"
                                ? "bg-red-900/30 text-red-400"
                                : "bg-blue-900/30 text-blue-400"
                          }`}
                        >
                          {getStatusLabel(backup.status)}
                        </span>
                      </div>

                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>📦 {backup.size}</span>
                        <span>📅 {backup.date}</span>
                        <span>⏰ {backup.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={isRestoringBackup}
                      className="px-4 py-2 bg-green-600/80 hover:bg-green-600 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw
                        size={16}
                        className={isRestoringBackup ? "animate-spin" : ""}
                      />
                      {isRestoringBackup ? "กำลัง..." : "กู้คืน"}
                    </button>
                    <button className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2">
                      <Download size={16} />
                      ดาวน์โหลด
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-red-900/30 border border-slate-600 hover:border-red-700/50 rounded-lg text-slate-200 hover:text-red-400 text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">
          ตั้งค่าการสำรองอัตโนมัติ
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">เวลาสำรองอัตโนมัติ</span>
            <select className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 text-sm">
              <option>02:00 น.</option>
              <option>03:00 น.</option>
              <option>04:00 น.</option>
            </select>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">ความถี่การสำรอง</span>
            <select className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 text-sm">
              <option>ทุกวัน</option>
              <option>ทุกสัปดาห์</option>
              <option>ทุกเดือน</option>
            </select>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300">เก็บสำรองไว้เป็นเวลา</span>
            <select className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 text-sm">
              <option>30 วัน</option>
              <option>60 วัน</option>
              <option>90 วัน</option>
              <option>ตลอดไป</option>
            </select>
          </div>
        </div>
        <button className="w-full mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all">
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
