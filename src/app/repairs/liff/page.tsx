"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AlertCircle, CheckCircle2, Phone, Mail, Clock } from "lucide-react";
import { apiFetch } from "@/services/api";

export const dynamic = "force-dynamic";

function RepairLiffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const action = searchParams.get("action") || "create";
  const [lineUserId, setLineUserId] = useState<string>("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = searchParams.get("lineUserId") || "";
    setLineUserId(id);


    // โหลดข้อมูลเมื่อ action เป็น status หรือ history
    if (action === "status") {
      fetchTickets();
    } else if (action === "history") {
      const ticketId = searchParams.get("id");
      if (ticketId) {
        fetchTicketDetail(ticketId);
      }
    }
  }, [action, searchParams]);

  const [ticketDetail, setTicketDetail] = useState<any>(null);

  const fetchTicketDetail = async (code: string) => {
    setLoading(true);
    const lineId = searchParams.get("lineUserId");
    if (!lineId) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch(`/api/repairs/liff/ticket/${code}?lineUserId=${lineId}`);
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
      const data = await apiFetch("/api/repairs/user/my-tickets");
      setTickets(data || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Action: Create Repair - redirect to LIFF form (no login required)
  useEffect(() => {
    if (action === "create") {
      router.push(`/repairs/liff/form?lineUserId=${lineUserId}`);
    }
  }, [action, lineUserId, router]);

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

  // Action: Check Status
  if (action === "status") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                📋 สถานะการซ่อมของฉัน
              </h1>
              <p className="text-gray-600 text-sm">
                ตรวจสอบรายการแจ้งซ่อมล่าสุด 5 รายการ
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">กำลังโหลดข้อมูล...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="font-semibold text-yellow-800 mb-2">
                  ไม่พบรายการแจ้งซ่อม
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
                  คุณยังไม่มีรายการแจ้งซ่อม กรุณากด "🔧 แจ้งซ่อม"
                  เพื่อสร้างรายการใหม่
                </p>
                <button
                  onClick={() =>
                    router.push(`/repairs?lineUserId=${lineUserId}`)
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition inline-block"
                >
                  แจ้งซ่อมตอนนี้
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm font-bold text-blue-600">
                          {ticket.ticketCode}
                        </p>
                        <h3 className="font-semibold text-gray-800 mt-1">
                          {ticket.problemTitle}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : ticket.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : ticket.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {ticket.problemDescription}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        📅{" "}
                        {new Date(ticket.createdAt).toLocaleDateString("th-TH")}
                      </span>
                      <span>
                        ⏳{" "}
                        {ticket.urgency === "CRITICAL"
                          ? "ด่วนมาก"
                          : ticket.urgency === "URGENT"
                          ? "ด่วน"
                          : "ปกติ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Action: FAQ
  if (action === "faq") {
    const faqs = [
      {
        question: "จะแจ้งซ่อมได้ยังไง?",
        answer: "กด 🔧 แจ้งซ่อม และกรอกแบบฟอร์มพร้อมรูปภาพของปัญหาที่พบ",
      },
      {
        question: "ตรวจสอบสถานะได้ยังไง?",
        answer: "กด 📋 ตรวจสอบสถานะ เพื่อดูรายการแจ้งซ่อมล่าสุดของคุณ",
      },
      {
        question: "เลขที่รายการ (Ticket) คืออะไร?",
        answer:
          "เลขที่อ้างอิงของรายการแจ้งซ่อม เช่น REP-20251228-0001 ใช้สำหรับติดตามสถานะ",
      },
      {
        question: "รายการแจ้งซ่อมใช้เวลานานเท่าไหร่?",
        answer:
          "ตามความเร่งด่วน:\n🟢 ปกติ (3-5 วัน)\n🟡 ด่วน (1-2 วัน)\n🔴 ด่วนมาก (วันเดียว)",
      },
      {
        question: "ถ้ายังไม่ได้รับการแก้ไขจะทำอย่างไร?",
        answer:
          "กรุณาติดต่อฝ่าย IT ผ่านโทรศัพท์หรือ LINE เพื่อติดตามความคืบหน้า",
      },
      {
        question: "สามารถแก้ไขรายการแจ้งซ่อมได้หรือไม่?",
        answer: "หากต้องแก้ไข โปรดติดต่อฝ่าย IT พร้อมเลขที่รายการ",
      },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                ❓ คำถามที่พบบ่อย (FAQ)
              </h1>
              <p className="text-gray-600 text-sm">
                ตอบคำถามที่เกี่ยวกับการแจ้งซ่อม
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {idx + 1}. {faq.question}
                  </h3>
                  <p className="text-gray-600 text-sm whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Action: Contact
  if (action === "contact") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                📞 ติดต่อฝ่าย IT
              </h1>
              <p className="text-gray-600 text-sm">
                ช่องทางการติดต่อ และเวลาทำการ
              </p>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Email</h3>
                </div>
                <p className="text-gray-700 font-mono text-sm ml-8">
                  it-support@company.com
                </p>
              </div>

              {/* Phone */}
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">โทรศัพท์</h3>
                </div>
                <p className="text-gray-700 font-mono text-sm ml-8">
                  02-123-4567 (ต่อ 1000)
                </p>
              </div>

              {/* LINE */}
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">💬</span>
                  <h3 className="font-semibold text-gray-800">LINE</h3>
                </div>
                <p className="text-gray-700 font-mono text-sm ml-8">
                  @it-support
                </p>
              </div>

              {/* Hours */}
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-blue-50">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-800">เวลาทำการ</h3>
                </div>
                <div className="ml-8 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">จันทร์ - ศุกร์:</span> 09:00
                    - 18:00 น.
                  </p>
                  <p>
                    <span className="font-semibold">วันหยุด:</span> ปิดทำการ
                  </p>
                  <p className="pt-2 border-t border-blue-200 mt-2">
                    <span className="font-semibold text-red-600">
                      ในกรณีฉุกเฉิน (24 ชม.):
                    </span>
                    <br />
                    081-456-7890
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Action: History (Detail View)
  if (action === "history") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {loading ? (
             <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">กำลังโหลดข้อมูล...</p>
              </div>
          ) : !ticketDetail ? (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">ไม่พบข้อมูล</h3>
              <p className="text-gray-600 mb-4">ไม่พบรายการแจ้งซ่อมที่คุณระบุ หรือคุณไม่มีสิทธิ์เข้าถึง</p>
              <button
                onClick={() => router.push(`/repairs/liff?action=status&lineUserId=${lineUserId}`)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                กลับไปหน้าตรวจสอบสถานะ
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {ticketDetail.ticketCode}
                    </span>
                    <h1 className="text-xl font-bold text-gray-800 mt-2">
                      {ticketDetail.problemTitle}
                    </h1>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      ticketDetail.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : ticketDetail.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : ticketDetail.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : ticketDetail.status === "CANCELLED"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                   {ticketDetail.status === 'PENDING' ? 'รอดำเนินการ' :
                    ticketDetail.status === 'IN_PROGRESS' ? 'กำลังดำเนินการ' :
                    ticketDetail.status === 'WAITING_PARTS' ? 'รออะไหล่' :
                    ticketDetail.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                    ticketDetail.status === 'CANCELLED' ? 'ยกเลิก' : ticketDetail.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-gray-500 text-xs">ความเร่งด่วน</p>
                    <p className={`font-medium ${
                      ticketDetail.urgency === 'CRITICAL' ? 'text-red-600' :
                      ticketDetail.urgency === 'URGENT' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {ticketDetail.urgency === 'CRITICAL' ? 'ด่วนที่สุด' :
                       ticketDetail.urgency === 'URGENT' ? 'ด่วน' : 'ทั่วไป'}
                    </p>
                  </div>
                  <div>
                     <p className="text-gray-500 text-xs">วันที่แจ้ง</p>
                     <p className="text-gray-800 font-medium">
                       {new Date(ticketDetail.createdAt).toLocaleDateString('th-TH', {
                         day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                       })}
                     </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                   <p className="text-gray-500 text-xs mb-1">รายละเอียดปัญหา</p>
                   <p className="text-gray-700 whitespace-pre-wrap">{ticketDetail.problemDescription}</p>
                </div>
              </div>

               {/* Timeline / History */}
               <div className="bg-white rounded-xl shadow-lg p-6">
                 <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Clock className="w-5 h-5 text-blue-600" />
                   ประวัติการดำเนินการ
                 </h2>
                 
                 {ticketDetail.logs && ticketDetail.logs.length > 0 ? (
                   <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                      {ticketDetail.logs.map((log: any, idx: number) => (
                        <div key={idx} className="relative flex items-start group is-active">
                          <div className={`absolute left-0 mt-1 rounded-full border-2 border-white w-5 h-5 flex items-center justify-center z-10 ${
                             log.status === 'COMPLETED' ? 'bg-green-500' : 
                             log.status === 'IN_PROGRESS' ? 'bg-blue-500' : 
                             log.status === 'WAITING_PARTS' ? 'bg-orange-500' : 'bg-gray-400'
                          }`}></div>
                          <div className="ml-8 w-full">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                               <span className="font-medium text-gray-900">
                                 {log.status === 'PENDING' ? 'แจ้งซ่อม' :
                                  log.status === 'IN_PROGRESS' ? 'เริ่มดำเนินการ' :
                                  log.status === 'WAITING_PARTS' ? 'รออะไหล่' :
                                  log.status === 'COMPLETED' ? 'ดำเนินการเสร็จสิ้น' :
                                  log.status === 'CANCELLED' ? 'ยกเลิกรายการ' : log.action}
                               </span>
                               <span className="text-xs text-gray-500 font-mono">
                                 {new Date(log.createdAt).toLocaleDateString('th-TH', { 
                                   day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'
                                 })}
                               </span>
                            </div>
                            {log.comment && (
                               <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1 border border-gray-100">
                                 "{log.comment}"
                               </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              โดย: {log.user?.name || 'System'}
                            </p>
                          </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <p className="text-gray-500 text-center py-4">ยังไม่มีประวัติการดำเนินการ</p>
                 )}
               </div>

               <button
                  onClick={() => router.push(`/repairs/liff?action=status&lineUserId=${lineUserId}`)}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition shadow-sm"
                >
                  กลับหน้ารายการของฉัน
               </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">ข้อมูลไม่พบ</h1>
          <p className="text-gray-600">
            ข้อขอนี้ไม่มีข้อมูลที่ถูกต้อง กรุณาลองอีกครั้ง
          </p>
        </div>
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
