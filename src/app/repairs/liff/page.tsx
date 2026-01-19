"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Wrench,
  Search,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  ChevronLeft,
  Filter,
  Package,
  MapPin,
  User,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  LayoutDashboard,
  History,
  Check,
  MoreVertical,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";

export const dynamic = "force-dynamic";

// --- Types ---
interface Ticket {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription: string;
  problemCategory: string;
  location: string;
  urgency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reporterName: string;
  reporterPhone: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  logs?: any[];
  attachments?: any[];
}

// --- Components ---

const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    WAITING_PARTS: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PENDING: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${styles[status] || styles.PENDING}`}
    >
      {label}
    </span>
  );
};

const Shimmer = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`}></div>
);

function RepairLiffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const actionFromParam = searchParams.get("action");
  const ticketIdFromParam = searchParams.get("id");
  const action = actionFromParam || (ticketIdFromParam ? "history" : "status");

  const [lineUserId, setLineUserId] = useState<string>(
    searchParams.get("lineUserId") || "",
  );
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    pictureUrl?: string;
  } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(
    !searchParams.get("lineUserId"),
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null);

  // LIFF Init
  useEffect(() => {
    const initLiff = async () => {
      if (lineUserId && liff.isLoggedIn()) {
        try {
          const profile = await liff.getProfile();
          setUserProfile({
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          });
        } catch (err) {
          console.error("Profile Error:", err);
        }
        setIsInitializing(false);
        return;
      }
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
        await liff.init({ liffId, withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
        setUserProfile({
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        });
      } catch (err) {
        console.error("LIFF Error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initLiff();
  }, [lineUserId]);

  useEffect(() => {
    if (!lineUserId || isInitializing) return;
    if (action === "status") fetchTickets();
    else if (action === "history" && ticketIdFromParam)
      fetchTicketDetail(ticketIdFromParam);
  }, [action, lineUserId, isInitializing, ticketIdFromParam]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/repairs/liff/my-tickets?lineUserId=${lineUserId}`,
      );
      setTickets(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (code: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/repairs/liff/ticket/${code}?lineUserId=${lineUserId}`,
      );
      setTicketDetail(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (s: string) => {
    const labels: any = {
      COMPLETED: "เสร็จสิ้น",
      IN_PROGRESS: "กำลังทำ",
      WAITING_PARTS: "รออะไหล่",
      PENDING: "รอรับเรื่อง",
      CANCELLED: "ยกเลิก",
    };
    return labels[s] || s;
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case "CRITICAL":
        return "text-rose-600 bg-rose-50";
      case "URGENT":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const calendarDays = useMemo(() => {
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const end = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );
    const days = [];

    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayTickets = tickets.filter(
        (t) => new Date(t.createdAt).toISOString().split("T")[0] === dateStr,
      );
      days.push({ day: i, dateStr, tickets: dayTickets });
    }
    return days;
  }, [currentMonth, tickets]);

  if (isInitializing)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl mb-4"></div>
          <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
        </div>
      </div>
    );

  // --- Main Dashboard View ---
  if (action === "status") {
    const filteredTickets = selectedDate
      ? tickets.filter(
          (t) =>
            new Date(t.createdAt).toISOString().split("T")[0] === selectedDate,
        )
      : tickets;

    return (
      <div className="min-h-screen bg-[#FDFDFF] pb-24 font-sans text-slate-900">
        {/* Top Gradient Header */}
        <div className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-600 px-6 pt-12 pb-24 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-[20%] left-[-10%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl border-2 border-white/20 p-0.5 bg-white/10 backdrop-blur-md">
                  {userProfile?.pictureUrl ? (
                    <img
                      src={userProfile.pictureUrl}
                      alt="Profile"
                      className="w-full h-full rounded-[14px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[14px] bg-indigo-500 flex items-center justify-center text-white">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    สวัสดี, {userProfile?.displayName || "Reporter"}
                  </h1>
                  <p className="text-white/60 text-[11px] font-medium flex items-center gap-1.5">
                    <LayoutDashboard className="w-3 h-3" /> แดชบอร์ดระบบแจ้งซ่อม
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  router.push(`/repairs/liff/form?lineUserId=${lineUserId}`)
                }
                className="bg-white text-indigo-900 px-4 py-2.5 rounded-2xl shadow-xl shadow-indigo-950/20 flex items-center gap-2 font-black text-[13px] active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" /> แจ้งซ่อมใหม่
              </button>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "ทั้งหมด",
                  val: tickets.length,
                  color: "text-indigo-100",
                  icon: History,
                  bg: "bg-white/10",
                },
                {
                  label: "กำลังทำ",
                  val: tickets.filter((t) =>
                    ["PENDING", "IN_PROGRESS", "WAITING_PARTS"].includes(
                      t.status,
                    ),
                  ).length,
                  color: "text-amber-100",
                  icon: Clock,
                  bg: "bg-amber-400/20",
                },
                {
                  label: "สําเร็จ",
                  val: tickets.filter((t) => t.status === "COMPLETED").length,
                  color: "text-emerald-100",
                  icon: CheckCircle2,
                  bg: "bg-emerald-400/20",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`${s.bg} backdrop-blur-lg p-4 rounded-3xl border border-white/10 shadow-inner`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                    <p
                      className={`text-[9px] font-black uppercase tracking-wider ${s.color} opacity-70`}
                    >
                      {s.label}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-white">{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section (Shifted up) */}
        <div className="px-6 -mt-12 relative z-20 space-y-8">
          {/* Calendar Card */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-indigo-950/5 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm">
                  {currentMonth.toLocaleDateString("th-TH", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.setMonth(currentMonth.getMonth() - 1),
                      ),
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.setMonth(currentMonth.getMonth() + 1),
                      ),
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 text-center">
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-black text-slate-300 uppercase py-2"
                >
                  {d}
                </span>
              ))}
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center h-12 relative"
                >
                  {day && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedDate(
                            selectedDate === day.dateStr ? null : day.dateStr,
                          )
                        }
                        className={`w-9 h-9 flex items-center justify-center rounded-2xl text-[13px] font-bold transition-all relative
                          ${selectedDate === day.dateStr ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 active:scale-90" : "text-slate-600 hover:bg-slate-50"}
                          ${(day.tickets?.length || 0) > 0 && selectedDate !== day.dateStr ? "text-indigo-600" : ""}
                        `}
                      >
                        {day.day}
                        {(day.tickets?.length || 0) > 0 &&
                          selectedDate !== day.dateStr && (
                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 border-2 border-white"></div>
                          )}
                      </button>
                      {(day.tickets?.length || 0) > 0 && (
                        <div className="flex gap-0.5 mt-0.5 absolute bottom-0.5">
                          {day.tickets
                            .slice(0, 3)
                            .map((t: any, idx: number) => (
                              <div
                                key={idx}
                                className={`w-1 h-1 rounded-full ${t.status === "COMPLETED" ? "bg-emerald-400" : "bg-indigo-400"}`}
                              ></div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ticket List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                {selectedDate
                  ? `งานวันที่ ${new Date(selectedDate).toLocaleDateString("th-TH")}`
                  : "รายการแจ้งซ่อม"}
              </h3>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[11px] text-indigo-600 font-bold px-2 py-1 bg-indigo-50 rounded-lg"
                >
                  เรียกดูทั้งหมด
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                <Shimmer className="h-24" />
                <Shimmer className="h-24" />
                <Shimmer className="h-24" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold text-sm">
                  ไม่พบรายการแจ้งซ่อม
                </p>
                <p className="text-slate-300 text-[11px] mt-1">
                  ลองเลือกวันอื่นๆ หรือกดแจ้งซ่อมใหม่ข้างต้น
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() =>
                    router.push(
                      `/repairs/liff?action=history&id=${ticket.ticketCode}&lineUserId=${lineUserId}`,
                    )
                  }
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all flex items-start gap-5 group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:scale-110 duration-300 ${ticket.status === "COMPLETED" ? "bg-emerald-50 text-emerald-500" : "bg-indigo-50 text-indigo-500"}`}
                  >
                    {ticket.status === "COMPLETED" ? (
                      <Check className="w-7 h-7" />
                    ) : (
                      <Wrench className="w-7 h-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="text-[10px] font-mono font-bold text-slate-400">
                        #{ticket.ticketCode}
                      </p>
                      <StatusBadge
                        status={ticket.status}
                        label={getStatusLabel(ticket.status)}
                      />
                    </div>
                    <h4 className="font-black text-slate-900 truncate text-[15px] mb-2">
                      {ticket.problemTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "th-TH",
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                      {ticket.urgency !== "NORMAL" && (
                        <span
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${getUrgencyColor(ticket.urgency)}`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {ticket.urgency === "CRITICAL"
                            ? "ด่วนที่สุด"
                            : "ด่วน"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="self-center">
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Detailed Ticket & History View ---
  if (action === "history") {
    if (loading)
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            กำลังดึงข้อมูล...
          </p>
        </div>
      );

    if (!ticketDetail)
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">
            ไม่พบข้อมูลใบแจ้งซ่อม
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            รหัสที่คุณต้องการอาจไม่ถูกต้องหรือถูกลบไปแล้ว
          </p>
          <button
            onClick={() => router.back()}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase"
          >
            กลับหน้าแรก
          </button>
        </div>
      );

    return (
      <div className="min-h-screen bg-white pb-10 font-sans text-slate-900">
        {/* Sticky Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-xl z-30">
          <button
            onClick={() => router.back()}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-mono font-bold text-slate-400">
              #{ticketDetail.ticketCode}
            </p>
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-tight">
              รายละเอียดใบแจ้งซ่อม
            </h2>
          </div>
          <button className="p-2 opacity-0 pointer-events-none">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Status & Title Card */}
          <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-6">
              <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl flex items-center gap-1.5 uppercase-tracking-widest">
                <Package className="w-3.5 h-3.5" />
                {ticketDetail.problemCategory || "ทั่วไป"}
              </span>
              <StatusBadge
                status={ticketDetail.status}
                label={getStatusLabel(ticketDetail.status)}
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">
              {ticketDetail.problemTitle}
            </h1>
            <div className="bg-white/80 p-5 rounded-3xl text-slate-600 text-[13px] leading-relaxed border border-indigo-50 shadow-sm">
              {ticketDetail.problemDescription ||
                "ไม่ได้ระบุรายละเอียดเพิ่มเติม"}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                สถานที่
              </p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700">
                  {ticketDetail.location || "-"}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                ความเร่งด่วน
              </p>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 ${ticketDetail.urgency === "NORMAL" ? "text-blue-500" : "text-rose-500"}`}
                />
                <span
                  className={`text-xs font-bold ${ticketDetail.urgency === "NORMAL" ? "text-slate-700" : "text-rose-600"}`}
                >
                  {ticketDetail.urgency === "CRITICAL"
                    ? "ด่วนที่สุด"
                    : ticketDetail.urgency === "URGENT"
                      ? "ด่วน"
                      : "ปกติ"}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments Placeholder - In real world, we'd loop through ticketDetail.attachments */}
          {ticketDetail.attachments && ticketDetail.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> รูปภาพประกอบ
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {ticketDetail.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden border border-slate-100 shadow-sm group"
                  >
                    <img
                      src={file.fileUrl}
                      alt="attachment"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignee Card */}
          {ticketDetail.assignee && (
            <div className="bg-indigo-900 p-6 rounded-[2rem] shadow-xl shadow-indigo-950/20 text-white flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 p-0.5 backdrop-blur-md">
                <User className="w-full h-full text-white/40 p-3" />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
                  ช่างผู้ดูแล
                </p>
                <h4 className="font-black text-base">
                  {ticketDetail.assignee.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/70 font-bold bg-white/10 w-fit px-2 py-0.5 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  ทีม IT ประจำ TRR
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-8 relative py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" /> ประวัติการดำเนินการ
              </h3>
            </div>

            <div className="absolute left-[13px] top-12 bottom-0 w-[1.5px] bg-indigo-50"></div>

            {ticketDetail.logs && ticketDetail.logs.length > 0 ? (
              ticketDetail.logs.map((log: any, idx: number) => (
                <div key={idx} className="relative pl-10 pb-8 last:pb-2">
                  <div
                    className={`absolute left-0 top-1 w-7 h-7 rounded-2xl border-4 border-white shadow-md flex items-center justify-center z-10 
                      ${idx === 0 ? "bg-indigo-600 scale-110" : "bg-slate-100"}`}
                  >
                    {idx === 0 ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    )}
                  </div>
                  <div
                    className={`${idx === 0 ? "bg-indigo-50/30" : "bg-transparent"} p-3 rounded-2xl transition-all`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <p
                        className={`font-black text-[13px] ${idx === 0 ? "text-indigo-900" : "text-slate-800"}`}
                      >
                        {idx === 0 && (
                          <span className="mr-2 text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-md">
                            ล่าสุด
                          </span>
                        )}
                        {log.action || getStatusLabel(log.status)}
                      </p>
                      <p className="text-[10px] font-black text-slate-300">
                        {new Date(log.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        •
                        {new Date(log.createdAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {log.comment && (
                      <div className="relative mb-2.5">
                        <div className="absolute left-[-15px] top-1 bottom-1 w-0.5 bg-indigo-200/50 rounded-full"></div>
                        <p className="text-[12px] text-slate-500 font-medium italic pl-3 leading-relaxed">
                          "{log.comment}"
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                        <User className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        โดย {log.user?.name || "System"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="pl-10">
                <p className="text-xs text-slate-300 font-bold italic">
                  กำลังรอการดำเนินการจากเจ้าหน้าที่...
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              router.push(
                `/repairs/liff?action=status&lineUserId=${lineUserId}`,
              )
            }
            className="w-full mt-8 bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> กลับสู่แดชบอร์ด
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function RepairLiffPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full"></div>
        </div>
      }
    >
      <RepairLiffContent />
    </Suspense>
  );
}
