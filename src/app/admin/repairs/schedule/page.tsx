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
  startOfDay,
  endOfDay,
  isAfter,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Clock,
  ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/services/api";

/* ================= TYPES ================= */

interface RepairEvent {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription?: string;
  status: string;
  urgency: string;
  createdAt: string;
  scheduledAt: string;
  completedAt?: string;
  reporterName: string;
  location: string;
}

const statusMap: Record<string, string> = {
  PENDING: "รอรับงาน",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  WAITING_PARTS: "รออะไหล่",
};

/* ================= PAGE ================= */

function CalendarContent() {
  const [events, setEvents] = useState<RepairEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  /* ========== FETCH ========== */
  const fetchEvents = useCallback(async () => {
    const data = await apiFetch("/api/repairs/schedule");
    setEvents(data || []);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ========== STATS ========== */
  const stats = useMemo(() => ({
    total: events.length,
    pending: events.filter(e => e.status === "PENDING").length,
    inProgress: events.filter(e => e.status === "IN_PROGRESS").length,
    completed: events.filter(e => e.status === "COMPLETED").length,
  }), [events]);

  /* ========== FILTER ========== */
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        e.problemTitle.toLowerCase().includes(q) ||
        e.ticketCode.toLowerCase().includes(q) ||
        e.reporterName.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" || e.status === filterStatus;

      const matchesPriority =
        filterPriority === "all" || e.urgency === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [events, searchQuery, filterStatus, filterPriority]);

  /* ========== DATE-BASED EVENTS ========== */
  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter(e =>
      isSameDay(parseISO(e.scheduledAt), selectedDate)
    );
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter(e =>
      isAfter(parseISO(e.scheduledAt), endOfDay(selectedDate))
    );
  }, [filteredEvents, selectedDate]);

  /* ========== CALENDAR MAP (FAST) ========== */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, RepairEvent[]>();
    events.forEach(e => {
      const key = format(parseISO(e.scheduledAt), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) || []), e]);
    });
    return map;
  }, [events]);

  /* ========== COMPONENTS ========== */

  const RepairCard = ({ event }: { event: RepairEvent }) => (
    <div className="bg-gray-200/60 p-6 rounded-sm relative">
      <div className="absolute top-5 right-5 px-4 py-2 bg-white border font-bold">
        {statusMap[event.status]}
      </div>

      <h3 className="text-xl font-bold mb-2">{event.problemTitle}</h3>
      <p className="mb-4 text-gray-700">
        {event.problemDescription || "-"}
      </p>

      <div className="space-y-2 text-gray-800">
        <div className="flex gap-2 items-center">
          <Clock size={16} /> {format(parseISO(event.scheduledAt), "HH:mm")}
        </div>
        <div className="flex gap-2 items-center">
          <MapPin size={16} /> {event.location}
        </div>
        <div className="flex gap-2 items-center">
          <User size={16} /> {event.reporterName}
        </div>
      </div>
    </div>
  );

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    let day = startDate;
    const rows = [];

    while (day <= endDate) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const key = format(day, "yyyy-MM-dd");
        const hasEvents = eventsByDate.get(key)?.length || 0;

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(day)}
            className={`h-10 w-10 rounded-full flex flex-col items-center justify-center cursor-pointer
              ${!isSameMonth(day, monthStart) ? "text-gray-300" : ""}
              ${isSameDay(day, selectedDate) ? "border-2 border-blue-400 font-bold" : "hover:bg-gray-100"}
            `}
          >
            {format(day, "d")}
            {hasEvents > 0 && (
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: Math.min(3, hasEvents) }).map((_, i) => (
                  <span key={i} className="w-1 h-1 bg-blue-500 rounded-full" />
                ))}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day.toString()} className="grid grid-cols-7">{days}</div>);
    }

    return (
      <div className="bg-white p-6 rounded-xl border">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </h3>
          <div className="flex gap-2">
            <ChevronLeft onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
            <ChevronRight onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
          </div>
        </div>
        <div className="space-y-2">{rows}</div>
      </div>
    );
  };

  /* ========== RENDER ========== */

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="bg-gray-200/60 h-[120px] flex flex-col items-center justify-center">
            <span className="font-medium">{k}</span>
            <span className="text-3xl font-bold">{v}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ค้นหา..."
          className="px-4 py-2 bg-gray-200 rounded"
        />

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">ทุกสถานะ</option>
          <option value="PENDING">รอรับงาน</option>
          <option value="IN_PROGRESS">กำลังดำเนินการ</option>
          <option value="COMPLETED">เสร็จสิ้น</option>
        </select>

        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">ทุกความสำคัญ</option>
          <option value="CRITICAL">เร่งด่วน</option>
          <option value="NORMAL">ปกติ</option>
        </select>
      </div>

      {/* Main */}
      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-8 space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-4">
              {format(selectedDate, "dd MMMM yyyy", { locale: th })}
            </h2>

            {selectedDateEvents.length ? (
              selectedDateEvents.map(e => <RepairCard key={e.id} event={e} />)
            ) : (
              <p className="italic text-gray-400">ไม่มีงานในวันนี้</p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">งานที่กำลังจะมาถึง</h2>
            {upcomingEvents.map(e => <RepairCard key={e.id} event={e} />)}
          </section>
        </div>

        <div className="col-span-4">{renderMiniCalendar()}</div>
      </div>
    </div>
  );
}

/* ================= EXPORT ================= */

export default function RepairSchedulePage() {
  return (
    <Suspense fallback={<div className="p-10">กำลังโหลด...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
