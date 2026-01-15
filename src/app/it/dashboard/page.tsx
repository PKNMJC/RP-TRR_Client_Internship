'use client';

import { useEffect, useState, useCallback } from 'react';
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
  ArrowUpRight,
  ChevronRight,
  LayoutDashboard,
  Activity,
} from 'lucide-react';
import { safeFormat } from '@/lib/date-utils';

// --- Types ---
interface ActivityItem {
  id: number;
  itemName?: string;
  problemTitle?: string;
  borrowerName?: string;
  borrowAt?: string;
  ticketCode?: string;
  createdAt?: string;
  status: string;
}

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  totalRepairs: number;
  pendingRepairs: number;
  completedRepairs: number;
  recentLoans: ActivityItem[];
  recentRepairs: ActivityItem[];
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
    recentLoans: [],
    recentRepairs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null;
      const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

      if (!token || (role !== 'IT' && role !== 'ADMIN')) {
        router.push('/login');
        return;
      }

      // Parallel Data Fetching
      const [repairsData, loansData] = await Promise.all([
        apiFetch('/api/repairs').catch(() => []),
        apiFetch('/api/loans').catch(() => []),
      ]);

      const repairs = Array.isArray(repairsData) ? repairsData : [];
      const loans = Array.isArray(loansData) ? loansData : [];

      setStats({
        totalRepairs: repairs.length,
        pendingRepairs: repairs.filter((r: any) => r.status === 'PENDING').length,
        completedRepairs: repairs.filter((r: any) => r.status === 'COMPLETED').length,
        recentRepairs: repairs.slice(0, 5),
        totalLoans: loans.length,
        activeLoans: loans.filter((l: any) => l.status === 'BORROWED').length,
        overdueLoans: loans.filter((l: any) => l.status === 'OVERDUE').length,
        recentLoans: loans.slice(0, 5),
      });
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 minute is enough for production
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header: Minimalist & Strong */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-6 bg-black rounded-full" />
              <span className="text-sm font-bold uppercase tracking-[0.3em] text-neutral-400">Management</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-neutral-900 md:text-5xl">
              SYSTEM <span className="text-neutral-400">OVERVIEW</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-neutral-500 bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System Status: {new Date().toLocaleTimeString('th-TH')}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
          <StatCard 
            className="md:col-span-4"
            title="Inventory & Loans"
            mainValue={stats.totalLoans}
            subStats={[
              { label: 'Active Borrow', value: stats.activeLoans },
              { label: 'Overdue', value: stats.overdueLoans, urgent: true },
            ]}
            icon={<Package size={24} />}
            dark={true}
          />
          <StatCard 
            className="md:col-span-4"
            title="Maintenance"
            mainValue={stats.totalRepairs}
            subStats={[
              { label: 'Pending Task', value: stats.pendingRepairs },
              { label: 'Resolved', value: stats.completedRepairs },
            ]}
            icon={<Wrench size={24} />}
          />
          <StatCard 
            className="md:col-span-4"
            title="System Load"
            mainValue={Math.round(((stats.activeLoans + stats.pendingRepairs) / 20) * 100)}
            unit="%"
            subStats={[
              { label: 'Operational Status', value: 'OPTIMAL' },
            ]}
            icon={<Activity size={24} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Activity Column */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <SectionHeader title="Recent Transactions" icon={<Activity size={20} />} href="/it/loans" />
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <ActivityTable items={stats.recentLoans} type="loan" />
              </div>
            </section>

            <section>
              <SectionHeader title="Repair Tickets" icon={<Wrench size={20} />} href="/it/repairs" />
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <ActivityTable items={stats.recentRepairs} type="repair" />
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-neutral-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <LayoutDashboard size={120} />
              </div>
              <h3 className="text-xl font-bold mb-6 relative z-10">Quick Control</h3>
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <SidebarButton href="/it/loans" label="New Loan" icon={<Package size={18} />} />
                <SidebarButton href="/it/repairs" label="Ticket" icon={<Wrench size={18} />} />
                <SidebarButton href="/it/settings/profile" label="Profile" icon={<Users size={18} />} />
                <SidebarButton href="/it/settings/security" label="Logs" icon={<AlertCircle size={18} />} />
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-6">Service Health</h3>
              <div className="space-y-4">
                <HealthBar label="API Response" percentage={98} />
                <HealthBar label="Database" percentage={100} />
                <HealthBar label="Storage" percentage={45} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function StatCard({ title, mainValue, subStats, icon, dark = false, className = "", unit = "" }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] transition-all duration-300 ${dark ? 'bg-neutral-900 text-white shadow-xl' : 'bg-white border border-neutral-200 text-neutral-900 shadow-sm hover:border-neutral-900'} ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${dark ? 'bg-white/10' : 'bg-neutral-100'}`}>{icon}</div>
        <ArrowUpRight size={20} className={dark ? 'text-neutral-500' : 'text-neutral-300'} />
      </div>
      <div>
        <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{title}</p>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-5xl font-black font-mono tracking-tighter">{mainValue}</span>
          {unit && <span className="text-xl font-bold opacity-50">{unit}</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dashed border-neutral-700/50">
        {subStats.map((s: any, i: number) => (
          <div key={i}>
            <p className={`text-[10px] font-bold uppercase tracking-tight mb-1 ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>{s.label}</p>
            <p className={`text-lg font-black font-mono ${s.urgent ? 'text-rose-500' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, href }: any) {
  return (
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
        <span className="p-1.5 bg-black text-white rounded-lg">{icon}</span>
        <h2 className="text-lg font-black tracking-tight">{title}</h2>
      </div>
      <a href={href} className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-1">
        View All <ChevronRight size={14} />
      </a>
    </div>
  );
}

function ActivityTable({ items, type }: { items: ActivityItem[], type: 'loan' | 'repair' }) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-neutral-400 font-medium italic">
        No recent records found in the ledger.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50/50">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Identity / Item</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Assignee / Date</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-neutral-50 transition-colors group">
              <td className="px-6 py-4">
                <p className="font-bold text-sm text-neutral-900 group-hover:underline underline-offset-4">
                  {type === 'loan' ? item.itemName : item.problemTitle}
                </p>
                <p className="text-[10px] font-mono text-neutral-400">{type === 'loan' ? 'ASSET-LOAN' : `#${item.ticketCode}`}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-xs font-bold text-neutral-700">{type === 'loan' ? item.borrowerName : 'Technical Support'}</p>
                <p className="text-[10px] text-neutral-400">{safeFormat(type === 'loan' ? item.borrowAt : item.createdAt, 'dd MMM yyyy')}</p>
              </td>
              <td className="px-6 py-4 text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-tighter border ${getStatusStyle(item.status)}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SidebarButton({ href, label, icon }: any) {
  return (
    <a href={href} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300">
      <div className="mb-2">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </a>
  );
}

function HealthBar({ label, percentage }: any) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black uppercase mb-1">
        <span>{label}</span>
        <span className={percentage < 50 ? 'text-rose-500' : 'text-neutral-400'}>{percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${percentage < 50 ? 'bg-black' : 'bg-neutral-900'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'COMPLETED':
    case 'RETURNED':
      return 'bg-neutral-900 text-white border-neutral-900';
    case 'PENDING':
    case 'BORROWED':
      return 'bg-white text-neutral-900 border-neutral-200';
    case 'OVERDUE':
    case 'URGENT':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    default:
      return 'bg-neutral-50 text-neutral-400 border-neutral-100';
  }
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8 animate-pulse">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="h-12 w-64 bg-neutral-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[2.5rem] border border-neutral-200" />)}
        </div>
        <div className="h-96 bg-white rounded-3xl border border-neutral-200" />
      </div>
    </div>
  );
}