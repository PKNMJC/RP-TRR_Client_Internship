"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
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
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  User,
  Clock,
  Search,
  ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/services/api";

interface RepairEvent {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription?: string;
  status: string;
  urgency: string;
  createdAt: string;
  reporterName: string;
  location: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> =
  {
    PENDING: { label: "รอรับงาน", color: "text-amber-600", bg: "bg-amber-50" },
    IN_PROGRESS: {
      label: "กำลังดำเนินการ",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    COMPLETED: {
      label: "เสร็จสิ้น",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    CANCELLED: { label: "ยกเลิก", color: "text-gray-600", bg: "bg-gray-50" },
    WAITING_PARTS: {
      label: "รออะไหล่",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  };

function CalendarContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<RepairEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

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

  // Statistics
  const stats = useMemo(() => {
    return {
      total: events.length,
      pending: events.filter((e) => e.status === "PENDING").length,
      inProgress: events.filter((e) => e.status === "IN_PROGRESS").length,
      completed: events.filter((e) => e.status === "COMPLETED").length,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        e.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.reporterName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || e.status === filterStatus;
      const matchesPriority =
        filterPriority === "all" || e.urgency === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [events, searchQuery, filterStatus, filterPriority]);

  const todayEvents = useMemo(() => {
    const today = new Date();
    return filteredEvents.filter((e) =>
      isSameDay(parseISO(e.createdAt), today),
    );
  }, [filteredEvents]);

  const upcomingEvents = useMemo(() => {
    const today = endOfDay(new Date());
    return filteredEvents
      .filter((e) => isAfter(parseISO(e.createdAt), today))
      .sort(
        (a, b) =>
          parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime(),
      );
  }, [filteredEvents]);

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const hasEvents = events.some((e) =>
          isSameDay(parseISO(e.createdAt), cloneDay),
        );
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`relative flex flex-col items-center justify-center h-10 w-10 cursor-pointer rounded-full transition-all
              ${!isCurrentMonth ? "text-gray-300" : "text-gray-700 font-medium"}
              ${isSelected ? "bg-blue-500 text-white shadow-md shadow-blue-200" : "hover:bg-gray-100"}
            `}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span>{formattedDate}</span>
            {hasEvents && !isSelected && (
              <div className="flex gap-0.5 mt-0.5">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full opacity-50"></div>
              </div>
            )}
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>,
      );
      days = [];
    }

    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((d) => (
            <div
              key={d}
              className="text-center text-xs text-gray-400 font-medium py-2"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-1">{rows}</div>
      </div>
    );
  };

  const RepairCard = ({ event }: { event: RepairEvent }) => {
    const status = statusMap[event.status] || {
      label: event.status,
      color: "text-gray-600",
      bg: "bg-gray-100",
    };
    return (
      <div className="bg-gray-100/60 p-5 rounded-2xl relative border border-transparent hover:border-gray-200 transition-all group">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {event.problemTitle}
            <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-gray-600 font-bold">
              i
            </div>
          </h3>
          <div
            className={`px-4 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 shadow-sm ${status.color}`}
          >
            {status.label}
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4 pr-12 line-clamp-1">
          {event.problemDescription ||
            "สัญญาณอินเตอร์เน็ตติดๆดับๆ อินเตอร์เน็ตหลุดบ่อยมาก"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Clock size={16} className="text-gray-400" />
            <span>{format(parseISO(event.createdAt), "HH:mm:ss")}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MapPin size={16} className="text-gray-400" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <User size={16} className="text-gray-400" />
            <span>{event.reporterName}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "รายการซ่อมทั้งหมด", value: stats.total },
            { label: "รอรับงาน", value: stats.pending },
            { label: "กำลังดำเนินการ", value: stats.inProgress },
            { label: "เสร็จสิ้น", value: stats.completed },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-gray-200/80 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm"
            >
              <span className="text-gray-600 font-medium text-lg">
                {stat.label}
              </span>
              <span className="text-5xl font-bold text-gray-800 tracking-tight">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-gray-600"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้แจ้ง/เลขรหัส"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-200/80 rounded-xl pl-11 pr-4 py-3 text-gray-700 placeholder-gray-500 font-medium outline-none focus:bg-gray-200 transition-all border border-transparent focus:border-gray-300"
            />
          </div>
          <button className="bg-gray-200/80 px-6 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-300 transition-colors border border-transparent">
            ค้นหา
          </button>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-gray-200/80 pl-4 pr-10 py-3 rounded-xl font-bold text-gray-700 outline-none hover:bg-gray-300 transition-all cursor-pointer border border-transparent focus:border-gray-300"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="PENDING">รอรับงาน</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>

          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none bg-gray-200/80 pl-4 pr-10 py-3 rounded-xl font-bold text-gray-700 outline-none hover:bg-gray-300 transition-all cursor-pointer border border-transparent focus:border-gray-300"
            >
              <option value="all">ทุกความสำคัญ</option>
              <option value="CRITICAL">เร่งด่วนที่สุด</option>
              <option value="URGENT">เร่งด่วน</option>
              <option value="NORMAL">ปกติ</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* Today Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">วันนี้</h2>
              <div className="space-y-4">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event) => (
                    <RepairCard key={event.id} event={event} />
                  ))
                ) : (
                  <p className="text-gray-400 italic py-4">
                    ไม่มีรายการซ่อมสำหรับวันนี้
                  </p>
                )}
              </div>
            </section>

            {/* Upcoming Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                วันที่กำลังจะมาถึง
              </h2>
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <RepairCard key={event.id} event={event} />
                  ))
                ) : (
                  <p className="text-gray-400 italic py-4">
                    ไม่มีรายการซ่อมที่กำลังจะมาถึง
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">{renderMiniCalendar()}</div>
        </div>
      </div>
    </div>
  );
}

export default function RepairSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
