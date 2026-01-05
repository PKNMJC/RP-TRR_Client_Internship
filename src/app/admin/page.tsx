'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Wrench, Users, Settings, LogOut, ClipboardList } from 'lucide-react';

const menuItems = [
  {
    icon: LayoutDashboard,
    label: 'แดชบอร์ด',
    description: 'ดูสถิติและรายงานอ้างอิง',
    href: '/admin/dashboard',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Wrench,
    label: 'จัดการงานซ่อม',
    description: 'บริหารรายการงานซ่อมทั้งหมด',
    href: '/admin/repairs',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: ClipboardList,
    label: 'งานที่มอบหมาย',
    description: 'จัดการงานของผู้รับผิดชอบ',
    href: '/admin/assigned-tasks',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Users,
    label: 'จัดการผู้ใช้งาน',
    description: 'บริหารบัญชีผู้ใช้และสิทธิ์การเข้าถึง',
    href: '/admin/users',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Settings,
    label: 'ตั้งค่าระบบ',
    description: 'กำหนดค่าพื้นฐานและการตั้งค่า',
    href: '/admin/settings',
    color: 'from-green-500 to-green-600',
  },
];

export default function AdminHome() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    router.push('/login');
  };

  return (
    <div className="min-h-screen -to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-600 text-sm mt-1">ระบบจัดการซ่อมแซมเครื่องอุปกรณ์</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Message */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ยินดีต้อนรับ Administrator
          </h2>
          <p className="text-gray-600">
            เลือกส่วนที่คุณต้องการจัดการ
          </p>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>

                {/* Content */}
                <div className="relative p-8 h-full flex flex-col items-start justify-between text-white">
                  <div className="mb-4 p-3 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all">
                    <Icon size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{item.label}</h3>
                    <p className="text-sm text-white text-opacity-90 group-hover:text-opacity-100">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute inset-0 border-2 border-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">ข้อมูลอ้างอิงอย่างรวดเร็ว</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-gray-600 text-sm font-medium mb-2">งานซ่อมทั้งหมด</div>
              <div className="text-3xl font-bold text-blue-600">1,935</div>
              <p className="text-xs text-gray-500 mt-2">+12% จากเดือนที่แล้ว</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-gray-600 text-sm font-medium mb-2">กำลังดำเนินการ</div>
              <div className="text-3xl font-bold text-orange-600">50</div>
              <p className="text-xs text-gray-500 mt-2">ต้องการความสนใจ</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-gray-600 text-sm font-medium mb-2">ผู้ใช้ทั้งหมด</div>
              <div className="text-3xl font-bold text-purple-600">156</div>
              <p className="text-xs text-gray-500 mt-2">+5 ผู้ใช้ใหม่</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-gray-600 text-sm font-medium mb-2">อัตราการเสร็จสิ้น</div>
              <div className="text-3xl font-bold text-green-600">95.5%</div>
              <p className="text-xs text-gray-500 mt-2">ประสิทธิภาพดี</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
