'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/services/api';
import {
  Package,
  Wrench,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  totalRepairs: number;
  pendingRepairs: number;
  completedRepairs: number;
}

export default function ITDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    activeLoans: 0,
    overdueLoans: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    completedRepairs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || (role !== 'IT' && role !== 'ADMIN')) {
          router.push('/login');
          return;
        }

        // Fetch loans data
        try {
          const loansData = await apiFetch('/api/loans');
          const loans = Array.isArray(loansData) ? loansData : [];
          setStats((prev) => ({
            ...prev,
            totalLoans: loans.length,
            activeLoans: loans.filter((l) => l.status === 'BORROWED').length,
            overdueLoans: loans.filter((l) => l.status === 'OVERDUE').length,
          }));
        } catch (err) {
          console.error('Failed to fetch loans:', err);
        }

        // Fetch repairs data
        try {
          const repairsData = await apiFetch('/api/repairs');
          const repairs = Array.isArray(repairsData) ? repairsData : [];
          setStats((prev) => ({
            ...prev,
            totalRepairs: repairs.length,
            pendingRepairs: repairs.filter((r) => r.status === 'PENDING').length,
            completedRepairs: repairs.filter((r) => r.status === 'COMPLETED').length,
          }));
        } catch (err) {
          console.error('Failed to fetch repairs:', err);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
        fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">IT Dashboard</h1>
            <p className="text-zinc-500 mt-2">ภาพรวมการทำงาน IT Support</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Loans Stats */}
            <StatCard
              title="ระบบยืมของ"
              icon={<Package className="text-neutral-600" size={24} />}
              stats={[
                { label: 'รวม', value: stats.totalLoans, color: 'text-neutral-900' },
                { label: 'กำลังยืม', value: stats.activeLoans, color: 'text-neutral-700' },
                { label: 'เกินกำหนด', value: stats.overdueLoans, color: 'text-neutral-600' },
              ]}
              bgColor="bg-neutral-50 border-neutral-200"
            />

            {/* Repairs Stats */}
            <StatCard
              title="งานซ่อมแซม"
              icon={<Wrench className="text-neutral-600" size={24} />}
              stats={[
                { label: 'รวม', value: stats.totalRepairs, color: 'text-neutral-900' },
                { label: 'รอการแก้ไข', value: stats.pendingRepairs, color: 'text-neutral-700' },
                { label: 'เสร็จสิ้น', value: stats.completedRepairs, color: 'text-neutral-600' },
              ]}
              bgColor="bg-neutral-50 border-neutral-200"
            />

            {/* Overview */}
            <div className="bg-white border border-zinc-200 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900">สภาพรวม</h3>
                <TrendingUp className="text-zinc-400" size={20} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">กิจกรรมวันนี้</span>
                  <span className="text-lg font-bold text-zinc-900">{stats.activeLoans + stats.pendingRepairs}</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(((stats.activeLoans + stats.pendingRepairs) / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">รายการที่ต้องดำเนินการ</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-8">
            <h2 className="font-bold text-zinc-900 mb-4">ปุ่มลัด</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickActionButton href="/it/loans" icon={<Package size={20} />} label="ยืมของ" />
              <QuickActionButton href="/it/repairs" icon={<Wrench size={20} />} label="ซ่อมแซม" />
              <QuickActionButton href="/it/settings/profile" icon={<Users size={20} />} label="โปรไฟล์" />
              <QuickActionButton href="/it/settings/security" icon={<AlertCircle size={20} />} label="ความปลอดภัย" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Loans */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Package size={18} /> ยืมของล่าสุด
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-zinc-500 text-center py-8">
                  ไม่มีข้อมูล
                </p>
              </div>
            </div>

            {/* Recent Repairs */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Wrench size={18} /> งานซ่อมล่าสุด
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-zinc-500 text-center py-8">
                  ไม่มีข้อมูล
                </p>
              </div>
          </div>
        </div>
      </div>
  );
}

function StatCard({
  title,
  icon,
  stats,
  bgColor,
}: {
  title: string;
  icon: React.ReactNode;
  stats: Array<{ label: string; value: number; color: string }>;
  bgColor: string;
}) {
  return (
    <div className={`bg-white border border-zinc-200 p-6 rounded-lg ${bgColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        {icon}
      </div>
      <div className="space-y-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-xs text-zinc-600">{stat.label}</span>
            <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActionButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-2 p-4 border border-zinc-200 rounded-lg hover:bg-slate-50 hover:border-zinc-300 transition-all text-zinc-600 hover:text-zinc-900"
    >
      {icon}
      <span className="text-xs font-medium text-center">{label}</span>
    </a>
  );
}
