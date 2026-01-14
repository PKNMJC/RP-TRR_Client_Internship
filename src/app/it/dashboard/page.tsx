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
    <div className="min-h-screen bg-[#fcfcfd] pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header Section */}
        <div className="mb-6 md:mb-12">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10 transition-transform hover:scale-105">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl md:text-4xl font-black text-neutral-900 tracking-tight">
                IT Dashboard
              </h1>
              <p className="text-[10px] md:text-base text-neutral-500 font-medium tracking-wide flex items-center gap-1.5">
                <Clock size={12} className="text-neutral-400" />
                ภาพรวมการทำงาน IT Support
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-8 md:mb-12">
          {/* Loans Stats */}
          <StatCard
            title="ระบบยืมของ"
            icon={<Package size={22} />}
            stats={[
              { label: 'พัสดุทั้งหมด', value: stats.totalLoans, color: 'text-neutral-900' },
              { label: 'กำลังถูกยืม', value: stats.activeLoans, color: 'text-neutral-600' },
              { label: 'เกินกำหนดคืน', value: stats.overdueLoans, color: 'text-amber-600' },
            ]}
            variant="dark"
          />

          {/* Repairs Stats */}
          <StatCard
            title="งานซ่อมแซม"
            icon={<Wrench size={22} />}
            stats={[
              { label: 'รายการทั้งหมด', value: stats.totalRepairs, color: 'text-neutral-900' },
              { label: 'รอรับการแก้ไข', value: stats.pendingRepairs, color: 'text-rose-600' },
              { label: 'ซ่อมเสร็จสิ้น', value: stats.completedRepairs, color: 'text-emerald-600' },
            ]}
            variant="light"
          />

          {/* Productivity Overview */}
          <div className="relative group overflow-hidden bg-white border border-neutral-100 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={120} />
            </div>
            
            <div className="relative flex items-center justify-between mb-4 md:mb-6">
              <h3 className="font-bold text-neutral-900 text-sm md:text-lg tracking-tight">Productivity</h3>
              <div className="px-2 py-0.5 bg-neutral-100 rounded-full text-[8px] md:text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Realtime
              </div>
            </div>
            
            <div className="relative space-y-4 md:space-y-5">
              <div className="flex justify-between items-end">
                <div>
                  <span className="block text-[10px] md:text-sm text-neutral-400 font-bold uppercase tracking-tighter mb-0.5 md:mb-1">กิจกรรมวันนี้</span>
                  <span className="text-3xl md:text-5xl font-black text-neutral-900 leading-none">{stats.activeLoans + stats.pendingRepairs}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] md:text-[10px] text-neutral-400 font-bold uppercase mb-0.5 md:mb-1">Status</span>
                  <span className="px-2 py-0.5 bg-black text-white rounded-lg text-[8px] md:text-[10px] font-black italic">ACTIVE</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-neutral-50 border border-neutral-100 rounded-full h-2.5 md:h-3 overflow-hidden">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                    style={{ width: `${Math.min(((stats.activeLoans + stats.pendingRepairs) / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[9px] md:text-[11px] text-neutral-400 font-bold text-center tracking-wide italic">
                  * จำนวนรายการที่กำลังดำเนินการอยู่ในขณะนี้
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Recent Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Quick Actions - Left Column */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <div className="bg-neutral-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 shadow-2xl shadow-neutral-200">
              <h2 className="text-white font-black text-lg md:text-xl mb-4 md:mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <QuickActionButton href="/it/loans" icon={<Package size={20} />} label="ยืมของ" bg="bg-white/5" border="border-white/10" text="text-white" />
                <QuickActionButton href="/it/repairs" icon={<Wrench size={20} />} label="ซ่อมแซม" bg="bg-white/5" border="border-white/10" text="text-white" />
                <QuickActionButton href="/it/settings/profile" icon={<Users size={20} />} label="โปรไฟล์" bg="bg-white/5" border="border-white/10" text="text-white" />
                <QuickActionButton href="/it/settings/security" icon={<AlertCircle size={20} />} label="ความปลอดภัย" bg="bg-white/5" border="border-white/10" text="text-white" />
              </div>
            </div>
          </div>

          {/* Activity Feed - Right Column */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Loans */}
            <ActivityCard icon={<Package size={18} />} title="Recent Loans" />
            {/* Recent Repairs */}
            <ActivityCard icon={<Wrench size={18} />} title="Recent Repairs" />
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
  variant = 'light',
}: {
  title: string;
  icon: React.ReactNode;
  stats: Array<{ label: string; value: number; color: string }>;
  variant?: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';
  return (
    <div className={`group relative overflow-hidden rounded-[2rem] p-6 md:p-8 transition-all duration-500 ${
      isDark 
        ? 'bg-neutral-900 text-white shadow-2xl shadow-neutral-200 border border-neutral-800' 
        : 'bg-white text-neutral-900 shadow-sm border border-neutral-100 hover:shadow-xl'
    }`}>
      {/* Gloss Effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
      
      <div className="relative flex items-center justify-between mb-6 md:mb-8">
        <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${isDark ? 'bg-white/10' : 'bg-neutral-50'} transition-transform group-hover:rotate-12`}>
          {icon}
        </div>
        <div className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] px-2 md:px-3 py-0.5 md:py-1 rounded-full ${isDark ? 'bg-white/10 border border-white/5' : 'bg-neutral-50 border border-neutral-100'}`}>
          Overview
        </div>
      </div>

      <div className="relative space-y-4">
        <h3 className={`text-base md:text-lg font-black tracking-tight ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>{title}</h3>
        <div className="space-y-3">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex justify-between items-center group/item">
              <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isDark ? 'text-neutral-500 group-hover/item:text-neutral-300' : 'text-neutral-400 group-hover/item:text-neutral-600'}`}>
                {stat.label}
              </span>
              <span className={`text-xl md:text-2xl font-black font-mono transition-transform group-hover/item:scale-110 ${stat.color} ${isDark && !stat.color.includes('neutral') ? '' : ''}`}>
                {stat.value.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 shadow-sm hover:shadow-xl transition-all duration-500 group">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 md:p-3 bg-neutral-50 rounded-xl md:rounded-2xl text-neutral-400 group-hover:bg-black group-hover:text-white transition-all duration-300">
            {icon}
          </div>
          <h2 className="font-black text-neutral-900 text-sm md:text-base tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-8 md:py-16 bg-neutral-50/50 rounded-xl md:rounded-2xl border border-dashed border-neutral-200">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
          <Clock className="text-neutral-300" size={24} />
        </div>
        <p className="text-[10px] md:text-sm text-neutral-400 font-bold uppercase tracking-widest italic">
          Coming Soon
        </p>
      </div>
    </div>
  );
}

function QuickActionButton({
  href,
  icon,
  label,
  bg = "bg-white",
  border = "border-neutral-100",
  text = "text-neutral-900",
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  bg?: string;
  border?: string;
  text?: string;
}) {
  return (
    <a
      href={href}
      className={`group flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-6 ${bg} border-2 ${border} rounded-xl md:rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-95`}
    >
      <div className={`p-2.5 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 group-hover:scale-110 ${text === 'text-white' ? 'bg-white/10 group-hover:bg-white text-white group-hover:text-black' : 'bg-neutral-50 group-hover:bg-black text-neutral-400 group-hover:text-white'}`}>
        {icon}
      </div>
      <span className={`text-[9px] md:text-xs font-black uppercase tracking-widest text-center transition-colors ${text === 'text-white' ? 'text-neutral-400 group-hover:text-white' : 'text-neutral-600 group-hover:text-black'}`}>
        {label}
      </span>
    </a>
  );
}
