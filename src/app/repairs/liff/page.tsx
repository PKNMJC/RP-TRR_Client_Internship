"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Wrench,
  Search,
  FilePlus,
  LayoutDashboard,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/services/api";
import liff from "@line/liff";

export const dynamic = "force-dynamic";

function RepairLiffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const actionFromParam = searchParams.get("action");
  const ticketIdFromParam = searchParams.get("id");

  // CHANGED: Default to "status" if no explicit action or id is provided
  // This makes the "Repair History" the default home screen
  const action = actionFromParam || (ticketIdFromParam ? "history" : "status");

  const [lineUserId, setLineUserId] = useState<string>(
    searchParams.get("lineUserId") || ""
  );
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(
    !searchParams.get("lineUserId")
  );

  // LIFF Initialization
  useEffect(() => {
    const initLiff = async () => {
      if (lineUserId) {
        setIsInitializing(false);
        return;
      }

      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
        if (!liffId) {
          console.error("LIFF ID missing");
          return;
        }

        await liff.init({ liffId, withLoginOnExternalBrowser: true });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setLineUserId(profile.userId);
      } catch (err) {
        console.error("LIFF Init Error:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initLiff();
  }, []);

  useEffect(() => {
    const idFromParam = searchParams.get("lineUserId");
    if (idFromParam) {
      setLineUserId(idFromParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!lineUserId || isInitializing) return;

    if (action === "status") {
      fetchTickets();
    } else if (action === "history") {
      const ticketId = searchParams.get("id");
      if (ticketId) {
        fetchTicketDetail(ticketId);
      }
    }
  }, [action, lineUserId, isInitializing, searchParams]);

  const [ticketDetail, setTicketDetail] = useState<any>(null);

  const fetchTicketDetail = async (code: string) => {
    if (!lineUserId) return;
    setLoading(true);
    const lineId = lineUserId;

    try {
      const data = await apiFetch(
        `/api/repairs/liff/ticket/${code}?lineUserId=${lineId}`
      );
      setTicketDetail(data);
    } catch (error) {
      console.error("Failed to fetch ticket detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let data;
      // Get lineUserId directly from params to avoid state race conditions
      const currentLineUserId = lineUserId;

      // If we have a lineUserId, use the public LIFF endpoint
      if (currentLineUserId) {
        data = await apiFetch(
          `/api/repairs/liff/my-tickets?lineUserId=${currentLineUserId}`
        );
      } else {
        // Fallback for testing or if auth token exists (legacy)
        data = await apiFetch("/api/repairs/user/my-tickets");
      }
      setTickets(data || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "WAITING_PARTS":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "เสร็จสิ้น";
      case "IN_PROGRESS":
        return "กำลังดำเนินการ";
      case "WAITING_PARTS":
        return "รออะไหล่";
      case "PENDING":
        return "รอดำเนินการ";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case "URGENT":
        return <AlertCircle className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  // Action: Create Repair - redirect to LIFF form (no login required)
  useEffect(() => {
    if (action === "create") {
      router.push(`/repairs/liff/form?lineUserId=${lineUserId}`);
    }
  }, [action, lineUserId, router, isInitializing]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">กำลังยืนยันตัวตน...</p>
        </div>
      </div>
    );
  }

  if (action === "create") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">กำลังเปิดแบบฟอร์ม...</p>
        </div>
      </div>
    );
  }

  // Action: Check Status (Home View)
  if (action === "status") {
    return (
      <div className="min-h-screen bg-white pb-12 font-sans selection:bg-blue-100">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
          <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  IT Support
                </h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">
                  Service Portal
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm mt-4 font-medium">
                กำลังโหลดข้อมูล...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                ไม่พบรายการแจ้งซ่อม
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                ขณะนี้คุณไม่มีรายการค้างในระบบ หากพบปัญหาใดเกี่ยวกับอุปกรณ์ IT
                สามารถแจ้งทีมงานได้ทันทีผ่านเมนู LINE
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Stats Summary - Cleaner Vertical Layout */}
              <div className="flex items-end justify-between border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {tickets.length}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    รายการทั้งหมด
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-blue-600">
                    {
                      tickets.filter((t) =>
                        ["IN_PROGRESS", "PENDING", "WAITING_PARTS"].includes(
                          t.status
                        )
                      ).length
                    }
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    กำลังดำเนินการ
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-300" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    ประวัติการทำงานของคุณ
                  </h3>
                </div>

                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() =>
                      router.push(
                        `/repairs/liff?action=history&id=${ticket.ticketCode}&lineUserId=${lineUserId}`
                      )
                    }
                    className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-100 hover:border-slate-200 transition-all duration-300 cursor-pointer relative overflow-hidden active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {getStatusLabel(ticket.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          {ticket.ticketCode}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {ticket.problemTitle}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-5 leading-relaxed">
                      {ticket.problemDescription}
                    </p>

                    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {new Date(ticket.createdAt).toLocaleDateString(
                              "th-TH",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getUrgencyIcon(ticket.urgency)}
                          <span className="text-xs text-slate-500">
                            {ticket.urgency === "CRITICAL"
                              ? "ด่วนมาก"
                              : ticket.urgency === "URGENT"
                              ? "ด่วน"
                              : "ปกติ"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Action: FAQ - Redesigned to be simpler
  if (action === "faq") {
    const faqs = [
      {
        question: "จะแจ้งซ่อมได้ยังไง?",
        answer:
          "ใช้เมนู 'แจ้งซ่อม' ใน LINE เพื่อกรอกรายละเอียดปัญหาและภาพถ่าย ระบบจะส่งงานให้ทีม IT ทันที",
      },
      {
        question: "ตรวจสอบสถานะได้ยังไง?",
        answer:
          "กดที่ 'ติดตามสถานะ' ในเมนู LINE เพื่อดูความคืบหน้าของงานทั้งหมดที่คุณเคยแจ้งไว้",
      },
      {
        question: "ระยะเวลาในการแก้ไขนานแค่ไหน?",
        answer:
          "ทีมงานจะจัดลำดับตามความเร่งด่วน: ด่วนมาก (ภายในวัน), ด่วน (1-2 วัน), และปกติ (3-5 วัน)",
      },
      {
        question: "ต้องการสอบถามข้อมูลเพิ่มเติม?",
        answer:
          "สามารถติดต่อฝ่าย IT ได้ทางโทรศัพท์เบอร์ภายใน 1000 หรือพิมพ์ทิ้งไว้ในช่องแชท LINE นี้ได้เลย",
      },
    ];

    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </button>

          <h1 className="text-3xl font-black text-slate-900 mb-2">
            คำถามที่พบบ่อย
          </h1>
          <p className="text-slate-500 mb-10">
            การใช้งานระบบและแนวทางการช่วยเหลือของทีม IT
          </p>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Action: Contact
  if (action === "contact") {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </button>

          <h1 className="text-3xl font-black text-slate-900 mb-2">ติดต่อเรา</h1>
          <p className="text-slate-500 mb-10">ช่องทางติดต่อทีม IT Support</p>

          <div className="grid gap-4">
            {[
              {
                icon: <Mail className="w-5 h-5" />,
                label: "Email",
                value: "it.support@trr.com",
                color: "text-blue-500",
              },
              {
                icon: <Phone className="w-5 h-5" />,
                label: "Call Center",
                value: "02-123-4567 (ต่อ 1000)",
                color: "text-green-500",
              },
              {
                icon: <Clock className="w-5 h-5" />,
                label: "Office Hours",
                value: "จันทร์ - ศุกร์ | 09:00 - 18:00",
                color: "text-orange-500",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-5"
              >
                <div
                  className={`${item.color} bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {item.label}
                  </p>
                  <p className="text-slate-900 font-bold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Action: History (Detail View)
  if (action === "history") {
    return (
      <div className="min-h-screen bg-white">
        {/* Detail Header */}
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
          <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
            <button
              onClick={() =>
                router.push(
                  `/repairs/liff?action=status&lineUserId=${lineUserId}`
                )
              }
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-900" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">
              รายละเอียดงานซ่อม
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
          ) : !ticketDetail ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">ไม่พบข้อมูลงานซ่อม</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md mb-2 inline-block">
                      {ticketDetail.ticketCode}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      {ticketDetail.problemTitle}
                    </h2>
                  </div>
                  <div
                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(
                      ticketDetail.status
                    )}`}
                  >
                    {getStatusLabel(ticketDetail.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                      ความเร่งด่วน
                    </p>
                    <div className="flex items-center gap-2">
                      {getUrgencyIcon(ticketDetail.urgency)}
                      <span className="font-bold text-slate-900 text-sm">
                        {ticketDetail.urgency === "CRITICAL"
                          ? "ด่วนที่สุด"
                          : ticketDetail.urgency === "URGENT"
                          ? "ด่วน"
                          : "ปกติ"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                      วันที่แจ้ง
                    </p>
                    <p className="text-slate-900 font-bold text-sm">
                      {new Date(ticketDetail.createdAt).toLocaleDateString(
                        "th-TH",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
                    รายละเอียดปัญหา
                  </p>
                  <div className="bg-slate-50 p-5 rounded-2xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                    "{ticketDetail.problemDescription}"
                  </div>
                </div>
              </div>

              {/* Modern Timeline */}
              <div className="pt-10 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  Timeline
                </h3>

                {ticketDetail.logs && ticketDetail.logs.length > 0 ? (
                  <div className="space-y-10 relative">
                    {/* Line connecting items */}
                    <div className="absolute left-[11.5px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                    {ticketDetail.logs.map((log: any, idx: number) => (
                      <div key={idx} className="relative flex gap-6 group">
                        <div
                          className={`mt-1.5 w-6 h-6 rounded-full border-4 border-white shadow-md flex-shrink-0 z-10 ${
                            log.status === "COMPLETED"
                              ? "bg-green-500"
                              : log.status === "IN_PROGRESS"
                              ? "bg-blue-500"
                              : log.status === "WAITING_PARTS"
                              ? "bg-orange-500"
                              : "bg-slate-300"
                          }`}
                        ></div>

                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2 bg-slate-50/50 p-4 rounded-2xl group-hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">
                                {log.status === "PENDING"
                                  ? "บันทึกข้อมูลแจ้งซ่อม"
                                  : log.status === "IN_PROGRESS"
                                  ? "ช่างรับงานและเริ่มดำเนินการ"
                                  : log.status === "WAITING_PARTS"
                                  ? "รออะไหล่/อุปกรณ์"
                                  : log.status === "COMPLETED"
                                  ? "ดำเนินการเสร็จสิ้น"
                                  : log.status === "CANCELLED"
                                  ? "ยกเลิกรายการ"
                                  : log.action}
                              </span>
                              {log.comment && (
                                <span className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">
                                  {log.comment}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-300 font-bold mt-3">
                                ดำเนินการโดย: {log.user?.name || "System"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-2 sm:mt-0 font-bold">
                              {new Date(log.createdAt).toLocaleTimeString(
                                "th-TH",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                              <span className="mx-1 text-slate-200">|</span>
                              {new Date(log.createdAt).toLocaleDateString(
                                "th-TH",
                                { day: "numeric", month: "short" }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      ยังไม่มีบันทึกการดำเนินการ
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-10 pb-12">
                <button
                  onClick={() =>
                    router.push(
                      `/repairs/liff?action=status&lineUserId=${lineUserId}`
                    )
                  }
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center text-slate-500">
      <div className="max-w-xs">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <h1 className="text-lg font-bold text-slate-900 mb-2">
          ไม่พบหน้ากระบวนการ
        </h1>
        <p className="text-sm">
          หากต้องการความช่วยเหลือ โปรดติดต่อฝ่ายไอทีโดยตรง
        </p>
      </div>
    </div>
  );
}

export default function RepairLiffPage() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <RepairLiffContent />
    </Suspense>
  );
}
