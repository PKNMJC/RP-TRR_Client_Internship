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
    PENDING: { label: "รอรับงาน", color: "text-gray-900 font-bold", bg: "bg-white" },
    IN_PROGRESS: {
      label: "กำลังดำเนินการ",
      color: "text-gray-900 font-bold",
      bg: "bg-white",
    },
    COMPLETED: {
      label: "เสร็จสิ้น",
      color: "text-gray-900 font-bold",
      bg: "bg-white",
    },
    CANCELLED: { label: "ยกเลิก", color: "text-gray-900 font-bold", bg: "bg-white" },
    WAITING_PARTS: {
      label: "รออะไหล่",
      color: "text-gray-900 font-bold",
      bg: "bg-white",
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
        const hasEvents = events.filter((e) =>
          isSameDay(parseISO(e.createdAt), cloneDay),
        );
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`relative flex flex-col items-center justify-center h-10 w-10 cursor-pointer rounded-full transition-all group
              ${!isCurrentMonth ? "text-gray-300" : "text-gray-500"}
              ${isSelected ? "border-2 border-blue-400 text-blue-500 font-bold" : "hover:bg-gray-100"}
            `}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className="text-sm">{formattedDate}</span>
            {hasEvents.length > 0 && (
              <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                {hasEvents.slice(0, 3).map((_, idx) => (
                  <div key={idx} className="w-1 h-1 bg-blue-500 rounded-full"></div>
                ))}
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

    const monthYear = format(currentMonth, "MMMM yyyy", { locale: th });

    return (
      <div className="bg-white p-8 rounded-[20px] shadow-sm border border-gray-100/50 h-fit">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[1.4rem] font-bold text-gray-800">
            {monthYear}
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded text-gray-400"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded text-gray-400"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {daysOfWeek.map((d) => (
            <div
              key={d}
              className="text-center text-[0.8rem] text-gray-400 font-medium pb-2"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-4">{rows}</div>
      </div>
    );
  };

  const RepairCard = ({ event }: { event: RepairEvent }) => {
    const status = statusMap[event.status] || {
      label: event.status,
      color: "text-gray-900 font-bold",
      bg: "bg-white",
    };
    return (
      <div className="bg-gray-200/50 p-6 rounded-sm relative border border-transparent hover:border-gray-300 transition-all group">
         {/* Status Badge */}
        <div className="absolute top-5 right-5">
          <div
            className={`px-4 py-2 rounded-sm text-sm font-bold bg-white border border-gray-300 shadow-sm ${status.color}`}
          >
            {status.label}
          </div>
        </div>

        <div className="flex flex-col mb-1">
          <h3 className="text-[1.2rem] font-bold text-gray-800 flex items-center gap-2">
            {event.problemTitle}
            <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-500 font-bold">
              i
            </div>
          </h3>
        </div>
        
        <p className="text-[1rem] text-gray-800 font-medium mb-4 pr-32">
          {event.problemDescription ||
            "สัญญาณอินเตอร์เน็ตติดๆดับๆ อินเตอร์เน็ตหลุดบ่อยมาก"}
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-800 font-medium">
            <Clock size={18} className="text-gray-600" />
            <span>{format(parseISO(event.createdAt), "HH:mm:ss")}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-800 font-medium">
            <MapPin size={18} className="text-gray-600" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-800 font-medium">
            <User size={18} className="text-gray-600" />
            <span>{event.reporterName}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-[1400px] mx-auto space-y-10">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "รายการซ่อมทั้งหมด", value: stats.total },
            { label: "รอรับงาน", value: stats.pending },
            { label: "กำลังดำเนินการ", value: stats.inProgress },
            { label: "เสร็จสิ้น", value: stats.completed },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-gray-200/60 h-[140px] rounded-sm flex flex-col items-center justify-center text-center p-4"
            >
              <span className="text-gray-800 font-medium text-[1rem] mb-4">
                {stat.label}
              </span>
              <span className="text-[2.2rem] font-bold text-gray-800 leading-none">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex flex-1 max-w-md">
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้แจ้ง/เลขรหัส"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-200 border-none rounded-sm bg-gray-200 text-[1rem] placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
             <button className="ml-2 px-6 py-2.5 bg-gray-200 text-gray-800 text-[1rem] font-bold rounded-sm hover:bg-gray-300 transition-colors">
              ค้นหา
            </button>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-12 py-2.5 bg-gray-200 text-gray-800 text-[1rem] font-bold rounded-sm border-none focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="PENDING">รอรับงาน</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
            <ChevronDown
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            />
          </div>

          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none pl-4 pr-12 py-2.5 bg-gray-200 text-gray-800 text-[1rem] font-bold rounded-sm border-none focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="all">ทุกความสำคัญ</option>
              <option value="CRITICAL">เร่งด่วนที่สุด</option>
              <option value="URGENT">เร่งด่วน</option>
              <option value="NORMAL">ปกติ</option>
            </select>
            <ChevronDown
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            />
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {/* Today Section */}
            <section>
              <h2 className="text-[1.5rem] font-bold text-gray-800 mb-8">วันนี้</h2>
              <div className="space-y-6">
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
              <h2 className="text-[1.5rem] font-bold text-gray-800 mb-8">
                วันที่กำลังจะมาถึง
              </h2>
              <div className="space-y-6">
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

