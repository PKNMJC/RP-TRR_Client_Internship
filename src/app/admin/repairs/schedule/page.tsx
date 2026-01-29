"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  User,
  AlertCircle,
  Clock,
  Filter,
  Plus,
  Maximize2,
} from "lucide-react";
import { apiFetch } from "@/services/api";

interface RepairEvent {
  id: number;
  ticketCode: string;
  problemTitle: string;
  status: string;
  urgency: string;
  createdAt: string;
  reporterName: string;
  location: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  WAITING_PARTS: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const urgencyIcons: Record<string, React.ReactNode> = {
  CRITICAL: <AlertCircle size={12} className="text-red-500 animate-pulse" />,
  URGENT: <AlertCircle size={12} className="text-amber-500" />,
};

function CalendarContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<RepairEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/repairs/schedule");
      setEvents(data || []);
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg shadow-gray-200">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              ตารางซ่อมทั้งหมด
            </h1>
            <p className="text-sm text-gray-500">
              จัดการและติดตามสถานะงานซ่อมรายเดือน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm self-start md:self-center">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="px-4 py-1 text-center min-w-[140px]">
            <span className="text-sm font-bold text-gray-900 block capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: th })}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              เลือกเดือน
            </span>
          </div>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div
            key={i}
            className="text-center py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const dayEvents = events.filter((e) => {
          const date = parseISO(e.createdAt);
          const matchesDay = isSameDay(date, cloneDay);
          const matchesStatus =
            filterStatus === "all" || e.status === filterStatus;
          return matchesDay && matchesStatus;
        });
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            key={day.toString()}
            className={`relative min-h-[100px] md:min-h-[120px] bg-white border border-gray-100/50 p-2 transition-all duration-200 cursor-pointer group
              ${!isCurrentMonth ? "bg-gray-50/50 opacity-40" : "hover:bg-gray-50/80"}
              ${isSelected ? "ring-2 ring-gray-900 ring-inset z-10" : ""}
              ${isToday ? "after:absolute after:top-2 after:right-2 after:w-2 after:h-2 after:bg-gray-900 after:rounded-full" : ""}
            `}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span
              className={`text-sm font-bold ${isToday ? "text-gray-900" : "text-gray-400"} group-hover:text-gray-900 transition-colors`}
            >
              {formattedDate}
            </span>

            <div className="mt-2 space-y-1 overflow-hidden">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold truncate border flex items-center gap-1
                    ${statusColors[event.status] || "bg-gray-100 text-gray-600"}
                  `}
                >
                  {urgencyIcons[event.urgency]}
                  {event.problemTitle}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[9px] text-gray-400 font-bold pl-1">
                  + อีก {dayEvents.length - 3} รายการ
                </div>
              )}
            </div>

            <button className="absolute bottom-2 right-2 p-1.5 bg-gray-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 hidden md:block">
              <Plus size={12} />
            </button>
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>,
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100">
        {rows}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {renderHeader()}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Calendar Section */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {renderDays()}
            {loading ? (
              <div className="h-[400px] md:h-[600px] bg-white rounded-3xl border border-gray-100 shadow-xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-400 font-medium">
                    กำลังโหลดข้อมูล...
                  </span>
                </div>
              </div>
            ) : (
              renderCells()
            )}
          </div>

          {/* Side Info Section */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                กรองข้อมูล
              </h2>
              <div className="space-y-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-gray-900 outline-none"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="IN_PROGRESS">กำลังซ่อม</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="WAITING_PARTS">รออะไหล่</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 min-h-[300px] lg:h-[480px] flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                รายการสำหรับวัน
              </h2>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {selectedDate ? (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {format(selectedDate, "d MMMM yyyy", { locale: th })}
                    </div>
                    {events
                      .filter((e) =>
                        isSameDay(parseISO(e.createdAt), selectedDate),
                      )
                      .filter(
                        (e) =>
                          filterStatus === "all" || e.status === filterStatus,
                      )
                      .map((event) => (
                        <div
                          key={event.id}
                          className="p-4 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-gray-400">
                              {event.ticketCode}
                            </span>
                            <button className="text-gray-300 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 size={14} />
                            </button>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight">
                            {event.problemTitle}
                          </h3>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                              <MapPin size={12} strokeWidth={2.5} />
                              {event.location}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                              <User size={12} strokeWidth={2.5} />
                              {event.reporterName}
                            </div>
                          </div>
                          <div
                            className={`mt-3 px-2 py-0.5 rounded-full text-[9px] font-bold inline-block border ${statusColors[event.status]}`}
                          >
                            {event.status === "PENDING"
                              ? "รอดำเนินการ"
                              : event.status === "IN_PROGRESS"
                                ? "กำลังซ่อม"
                                : event.status === "COMPLETED"
                                  ? "เสร็จสิ้น"
                                  : event.status === "WAITING_PARTS"
                                    ? "รออะไหล่"
                                    : "ยกเลิก"}
                          </div>
                        </div>
                      ))}
                    {events.filter((e) => {
                      const date = parseISO(e.createdAt);
                      const matchesDay = isSameDay(date, selectedDate);
                      const matchesStatus =
                        filterStatus === "all" || e.status === filterStatus;
                      return matchesDay && matchesStatus;
                    }).length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <CalendarIcon size={20} className="text-gray-300" />
                        </div>
                        <p className="text-xs font-bold text-gray-400">
                          ไม่มีตารางงาน
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <CalendarIcon size={20} className="text-gray-300" />
                    </div>
                    <p className="text-xs font-bold text-gray-400">
                      เลือกวันที่เพื่อดูรายละเอียด
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}

export default function RepairSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          กำลังโหลด...
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
