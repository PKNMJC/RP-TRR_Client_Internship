"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  AlertCircle,
  Bell,
  ShieldCheck,
  Database,
  Globe,
} from "lucide-react";

interface SystemSettings {
  systemName: string;
  systemEmail: string;
  maintenanceMode: boolean;
  maxUploadSize: number;
  sessionTimeout: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

type TabType = "general" | "notifications" | "access" | "backup";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [settings, setSettings] = useState<SystemSettings>({
    systemName: "Ticket Resolver System",
    systemEmail: "admin@company.com",
    maintenanceMode: false,
    maxUploadSize: 50,
    sessionTimeout: 30,
    emailNotifications: true,
    smsNotifications: false,
  });

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // จำลองการเชื่อมต่อ API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSuccessMessage("บันทึกการตั้งค่าเรียบร้อยแล้ว");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // ข้อมูลเมนู Sidebar
  const navigation = [
    { id: "general", label: "ทั่วไป", icon: Globe },
    { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
    { id: "access", label: "สิทธิ์การเข้าถึง", icon: ShieldCheck },
    { id: "backup", label: "การสำรองข้อมูล", icon: Database },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          ตั้งค่าระบบ
        </h1>
        <p className="text-gray-500 mt-1">
          จัดการโครงสร้างพื้นฐานและการกำหนดค่าระบบทั้งหมด
        </p>
      </header>

      {/* Alert Message */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">
            ✓
          </div>
          <p className="text-emerald-800 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8">
              {activeTab === "general" && (
                <section className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <SectionTitle icon={<SettingsIcon />} title="ข้อมูลพื้นฐาน" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="ชื่อระบบ"
                      value={settings.systemName}
                      onChange={(val) => handleChange("systemName", val)}
                    />
                    <InputField
                      label="อีเมลระบบ"
                      type="email"
                      value={settings.systemEmail}
                      onChange={(val) => handleChange("systemEmail", val)}
                    />
                    <InputField
                      label="ขนาดอัปโหลดสูงสุด (MB)"
                      type="number"
                      value={settings.maxUploadSize}
                      onChange={(val) =>
                        handleChange("maxUploadSize", parseInt(val))
                      }
                    />
                    <InputField
                      label="หมดเวลาเซสชัน (นาที)"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(val) =>
                        handleChange("sessionTimeout", parseInt(val))
                      }
                    />
                  </div>

                  <hr className="border-gray-100" />

                  <SectionTitle title="สถานะและความปลอดภัย" />
                  <ToggleField
                    title="โหมดบำรุงรักษา"
                    description="ปิดการเข้าถึงระบบชั่วคราวสำหรับผู้ใช้ทั่วไป"
                    checked={settings.maintenanceMode}
                    onChange={(val) => handleChange("maintenanceMode", val)}
                    warning={
                      settings.maintenanceMode
                        ? "ระบบกำลังอยู่ในโหมดบำรุงรักษา"
                        : undefined
                    }
                  />
                </section>
              )}

              {activeTab === "notifications" && (
                <section className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <SectionTitle
                    icon={<Bell />}
                    title="การตั้งค่าการแจ้งเตือน"
                  />
                  <div className="space-y-4">
                    <ToggleField
                      title="อีเมล"
                      description="ส่งการแจ้งเตือนงานใหม่ผ่านทางอีเมล"
                      checked={settings.emailNotifications}
                      onChange={(val) =>
                        handleChange("emailNotifications", val)
                      }
                    />
                    <ToggleField
                      title="SMS"
                      description="ส่งรหัสยืนยันและประกาศด่วนผ่าน SMS"
                      checked={settings.smsNotifications}
                      onChange={(val) => handleChange("smsNotifications", val)}
                    />
                  </div>
                </section>
              )}

              {/* Tab อื่นๆ สามารถเพิ่มได้ตรงนี้ */}
              {["access", "backup"].includes(activeTab) && (
                <div className="py-20 text-center text-gray-400">
                  <div className="mb-2">อยู่ระหว่างการพัฒนา</div>
                  <p className="text-sm">
                    ฟีเจอร์นี้จะพร้อมใช้งานในเวอร์ชันถัดไป
                  </p>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="bg-gray-50 px-8 py-4 flex justify-end border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:bg-gray-300 font-bold shadow-lg shadow-blue-100"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                <span>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Sub-components (Helpers) ---

function SectionTitle({
  icon,
  title,
}: {
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
      {icon && <span className="text-blue-600">{icon}</span>}
      {title}
    </h2>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-gray-900"
      />
    </div>
  );
}

function ToggleField({
  title,
  description,
  checked,
  onChange,
  warning,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  warning?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      {warning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs">
          <AlertCircle size={14} />
          {warning}
        </div>
      )}
    </div>
  );
}
