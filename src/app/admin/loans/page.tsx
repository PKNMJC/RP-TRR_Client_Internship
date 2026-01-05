"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import {
  Search,
  Package,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Check,
  X as XIcon,
} from "lucide-react";

interface Loan {
  id: number;
  itemName: string;
  description: string;
  quantity: number;
  borrowDate: string;
  expectedReturnDate: string;
  returnDate?: string;
  status: string;
  borrowedBy: {
    id: number;
    name: string;
    email: string;
    department?: string;
    phoneNumber?: string;
    lineId?: string;
  };
  borrowerName?: string;
  borrowerDepartment?: string;
  borrowerPhone?: string;
  borrowerLineId?: string;
}

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    quantity: 1,
    expectedReturnDate: "",
    borrowerName: "",
    borrowerPhone: "",
    borrowerDepartment: "",
    borrowerLineId: "",
  });

  const loanStats = {
    total: loans.length,
    active: loans.filter((l) => l.status === "BORROWED").length,
    returned: loans.filter((l) => l.status === "RETURNED").length,
    overdue: loans.filter((l) => l.status === "OVERDUE").length,
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลทั้งหมด สำหรับแอดมิน
      const data = await apiFetch("/api/loans/admin/all");
      setLoans(data || []);
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrowedBy.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || loan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleReturnItem = async (loanId: number) => {
    if (!confirm("ยืนยันการคืนของ?")) return;

    try {
      await apiFetch(`/api/loans/${loanId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "RETURNED",
          returnDate: new Date().toISOString(),
        }),
      });
      fetchLoans();
      alert("ทำการอัปเดตเป็นคืนแล้ว");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleOpenEditModal = (loan: Loan) => {
    console.log("📝 Opening edit modal for loan:", loan.id);
    setSelectedLoan(loan);

    // แปลง date เป็น YYYY-MM-DD สำหรับ date input
    const dateObj = new Date(loan.expectedReturnDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    const editFormData = {
      itemName: loan.itemName,
      description: loan.description,
      quantity: loan.quantity,
      expectedReturnDate: formattedDate,
      borrowerName: loan.borrowerName || loan.borrowedBy.name,
      borrowerPhone: loan.borrowerPhone || loan.borrowedBy.phoneNumber || "",
      borrowerDepartment:
        loan.borrowerDepartment || loan.borrowedBy.department || "",
      borrowerLineId: loan.borrowerLineId || loan.borrowedBy.lineId || "",
    };

    console.log("📋 Edit form data:", editFormData);
    setFormData(editFormData);
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleOpenAddModal = () => {
    console.log("➕ Opening add modal");
    setSelectedLoan(null);
    setFormData({
      itemName: "",
      description: "",
      quantity: 1,
      expectedReturnDate: "",
      borrowerName: "",
      borrowerPhone: "",
      borrowerDepartment: "",
      borrowerLineId: "",
    });
    setShowModal(true);
  };

  const handleCloseEditModal = () => {
    console.log("✕ Closing edit modal");
    setShowEditModal(false);
    setSelectedLoan(null);
    setFormData({
      itemName: "",
      description: "",
      quantity: 1,
      expectedReturnDate: "",
      borrowerName: "",
      borrowerPhone: "",
      borrowerDepartment: "",
      borrowerLineId: "",
    });
  };

  const handleDelete = async (loanId: number) => {
    if (!confirm("ลบรายการยืมนี้?")) return;

    try {
      await apiFetch(`/api/loans/${loanId}`, { method: "DELETE" });
      fetchLoans();
      alert("ลบสำเร็จ");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleAddLoan = async () => {
    if (!formData.itemName || !formData.expectedReturnDate) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setIsSaving(true);
      const dataToSend = {
        itemName: formData.itemName,
        description: formData.description || "",
        quantity: Number(formData.quantity) || 1,
        expectedReturnDate: new Date(formData.expectedReturnDate).toISOString(),
        borrowerName: formData.borrowerName || "",
        borrowerPhone: formData.borrowerPhone || "",
        borrowerDepartment: formData.borrowerDepartment || "",
        borrowerLineId: formData.borrowerLineId || "",
      };

      console.log("=== handleAddLoan START ===");
      console.log("📤 Sending data:", dataToSend);

      if (selectedLoan) {
        // แก้ไขการยืมที่มีอยู่
        console.log(`🔄 Updating loan ${selectedLoan.id}...`);

        const response = await apiFetch(`/api/loans/${selectedLoan.id}`, {
          method: "PUT",
          body: JSON.stringify(dataToSend),
        });

        console.log("✅ Update successful:", response);
        alert("อัปเดตการยืมสำเร็จ");

        // ปิด edit modal
        handleCloseEditModal();
      } else {
        // สร้างการยืมใหม่
        console.log("➕ Creating new loan...");

        const response = await apiFetch("/api/loans", {
          method: "POST",
          body: JSON.stringify(dataToSend),
        });

        console.log("✅ Create successful:", response);
        alert("เพิ่มรายการสำเร็จ");

        // ปิด add modal
        setShowModal(false);
        setFormData({
          itemName: "",
          description: "",
          quantity: 1,
          expectedReturnDate: "",
          borrowerName: "",
          borrowerPhone: "",
          borrowerDepartment: "",
          borrowerLineId: "",
        });
      }

      // ปิด detail modal ถ้ามี
      setShowDetailModal(false);

      // Refresh ข้อมูล
      console.log("🔄 Refreshing loans data...");
      await fetchLoans();

      console.log("✅ Loans refreshed!");
      console.log("=== handleAddLoan END ===");
    } catch (err: unknown) {
      const error = err as Error;
      console.error("❌ Error:", error.message);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RETURNED":
        return <CheckCircle size={18} className="text-green-600" />;
      case "OVERDUE":
        return <AlertCircle size={18} className="text-red-600" />;
      case "BORROWED":
        return <Clock size={18} className="text-blue-600" />;
      default:
        return <Package size={18} className="text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RETURNED":
        return { label: "คืนแล้ว", color: "bg-green-100 text-green-700" };
      case "OVERDUE":
        return { label: "เกินกำหนด", color: "bg-red-100 text-red-700" };
      case "BORROWED":
        return { label: "กำลังยืม", color: "bg-blue-100 text-blue-700" };
      case "LOST":
        return { label: "หายไป", color: "bg-orange-100 text-orange-700" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700" };
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400 animate-pulse">
        กำลังโหลด...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              ระบบยืมของ (IT)
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              จัดการการยืมคืนของทั้งหมด
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
          >
            <Plus size={20} />
            เพิ่มการยืมใหม่
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="ทั้งหมด" count={loanStats.total} icon="📊" />
          <StatCard label="กำลังยืม" count={loanStats.active} icon="📦" />
          <StatCard label="คืนแล้ว" count={loanStats.returned} icon="✓" />
          <StatCard label="เกินกำหนด" count={loanStats.overdue} icon="⚠" />
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อของ, ผู้ยืม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 transition-all text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 cursor-pointer transition-all"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="BORROWED">กำลังยืม</option>
            <option value="RETURNED">คืนแล้ว</option>
            <option value="OVERDUE">เกินกำหนด</option>
            <option value="LOST">หายไป</option>
          </select>
          <button
            onClick={fetchLoans}
            className="p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg transition-all border border-zinc-200"
          >
            <RefreshCw size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  ชื่อของ
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  รายละเอียด
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  ผู้ยืม
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  วันยืม / วันคืน
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-600">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-zinc-600">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredLoans.map((loan) => (
                <tr
                  key={loan.id}
                  className="hover:bg-zinc-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-semibold text-zinc-900">
                    {loan.itemName}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 max-w-xs truncate">
                    {loan.description}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">
                        {loan.borrowerName || loan.borrowedBy.name}
                      </span>
                      {loan.borrowerPhone && (
                        <span className="text-xs text-zinc-400">
                          {loan.borrowerPhone}
                        </span>
                      )}
                      {loan.borrowerDepartment && (
                        <span className="text-xs text-zinc-400">
                          {loan.borrowerDepartment}
                        </span>
                      )}
                      {loan.borrowerLineId && (
                        <span className="text-xs text-zinc-400">
                          Line: {loan.borrowerLineId}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    <div className="space-y-1">
                      <div>
                        {new Date(loan.borrowDate).toLocaleDateString("th-TH")}
                      </div>
                      <div className="text-xs text-zinc-500">
                        ต้องคืน:{" "}
                        {new Date(loan.expectedReturnDate).toLocaleDateString(
                          "th-TH"
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold ${
                        getStatusLabel(loan.status).color
                      }`}
                    >
                      {getStatusIcon(loan.status)}
                      {getStatusLabel(loan.status).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowDetailModal(true);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(loan)}
                        className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="แก้ไข"
                      >
                        <Package size={16} />
                      </button>
                      {loan.status === "BORROWED" && (
                        <button
                          onClick={() => handleReturnItem(loan.id)}
                          className="p-1.5 text-zinc-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="บันทึกการคืน"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLoans.length === 0 && (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-4 text-zinc-300" size={48} />
              <p className="text-zinc-500 text-sm">ไม่พบรายการยืมของ</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add */}
      {showModal && !showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                เพิ่มการยืมใหม่
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 p-1 rounded"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* ข้อมูลอุปกรณ์ */}
              <div className="pb-4 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-900 mb-3">
                  ข้อมูลอุปกรณ์
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    ชื่อของ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData({ ...formData, itemName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอกชื่อของที่ยืม"
                    required
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400 resize-none"
                    rows={2}
                    placeholder=""
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* ข้อมูลผู้ยืม */}
              <div className="pb-4 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-900 mb-3">
                  ข้อมูลผู้ยืม
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    ชื่อผู้ยืม
                  </label>
                  <input
                    type="text"
                    value={formData.borrowerName}
                    onChange={(e) =>
                      setFormData({ ...formData, borrowerName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอกชื่อผู้ยืม"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={formData.borrowerPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        borrowerPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="เช่น 089-123-4567"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    แผนก
                  </label>
                  <input
                    type="text"
                    value={formData.borrowerDepartment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        borrowerDepartment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอกชื่อแผนก"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    Line ID
                  </label>
                  <input
                    type="text"
                    value={formData.borrowerLineId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        borrowerLineId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอก Line ID"
                  />
                </div>
              </div>

              {/* วันที่ */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">
                  วันคืนคาดว่า <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedReturnDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-900 rounded-lg hover:bg-zinc-50 transition-all text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddLoan}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {showEditModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">แก้ไขการยืม</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  รหัส #{selectedLoan.id}
                </p>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 p-1 rounded"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* ข้อมูลอุปกรณ์ */}
              <div className="pb-4 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-900 mb-3">
                  ข้อมูลอุปกรณ์
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    ชื่อของ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData({ ...formData, itemName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอกชื่อของที่ยืม"
                    required
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400 resize-none"
                    rows={2}
                    placeholder=""
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* ข้อมูลผู้ยืม */}
              <div className="pb-4 border-b border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-900 mb-3">
                  ข้อมูลผู้ยืม
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    ชื่อผู้ยืม
                  </label>
                  <input
                    type="text"
                    value={formData.borrowerName}
                    onChange={(e) =>
                      setFormData({ ...formData, borrowerName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอกชื่อผู้ยืม"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={formData.borrowerPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        borrowerPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="เช่น 089-123-4567"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    แผนก
                  </label>
                  <input
                    type="text"
                    value={formData.borrowerDepartment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        borrowerDepartment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอกชื่อแผนก"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    Line ID
                  </label>
                  <input
                    type="text"
                    value={formData.borrowerLineId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        borrowerLineId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                    placeholder="กรอก Line ID"
                  />
                </div>
              </div>

              {/* วันที่ */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">
                  วันคืนคาดว่า <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedReturnDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-zinc-900 font-medium placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-900 rounded-lg hover:bg-zinc-50 transition-all text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddLoan}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "กำลังบันทึก..." : "อัปเดต"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail View */}
      {showDetailModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-zinc-50 to-white">
              <h2 className="text-lg font-semibold text-slate-800">
                รายละเอียดการยืม
              </h2>
              <p className="text-sm text-slate-500">
                รหัสรายการ #{selectedLoan.id}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* ข้อมูลอุปกรณ์ */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  ข้อมูลอุปกรณ์
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 font-semibold">ชื่อของ</p>
                    <p className="font-bold text-slate-900">
                      {selectedLoan.itemName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold">จำนวน</p>
                    <p className="font-bold text-slate-900">
                      {selectedLoan.quantity} ชิ้น
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-600 font-semibold text-sm">
                    รายละเอียด
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedLoan.description || "-"}
                  </p>
                </div>
              </section>

              <hr />

              {/* ผู้ยืม */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  ข้อมูลผู้ยืม
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p className="text-slate-600 font-semibold">ชื่อ</p>
                  <p className="font-bold text-slate-900">
                    {selectedLoan.borrowedBy.name}
                  </p>

                  <p className="text-slate-600 font-semibold">อีเมล</p>
                  <p className="font-medium text-slate-900">
                    {selectedLoan.borrowedBy.email}
                  </p>

                  {selectedLoan.borrowedBy.department && (
                    <>
                      <p className="text-slate-600 font-semibold">แผนก</p>
                      <p className="font-medium text-slate-900">
                        {selectedLoan.borrowedBy.department}
                      </p>
                    </>
                  )}

                  {selectedLoan.borrowedBy.phoneNumber && (
                    <>
                      <p className="text-slate-600 font-semibold">เบอร์โทร</p>
                      <p className="font-medium text-slate-900">
                        {selectedLoan.borrowedBy.phoneNumber}
                      </p>
                    </>
                  )}

                  {selectedLoan.borrowedBy.lineId && (
                    <>
                      <p className="text-slate-600 font-semibold">Line ID</p>
                      <p className="font-medium text-slate-900">
                        @{selectedLoan.borrowedBy.lineId}
                      </p>
                    </>
                  )}
                </div>
              </section>

              <hr />

              {/* วันที่ */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">วันที่</h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p className="text-slate-600 font-semibold">วันยืม</p>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedLoan.borrowDate).toLocaleDateString(
                      "th-TH",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>

                  <p className="text-slate-600 font-semibold">วันคืนที่คาด</p>
                  <p className="font-bold text-slate-900">
                    {new Date(
                      selectedLoan.expectedReturnDate
                    ).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  {selectedLoan.returnDate && (
                    <>
                      <p className="text-slate-600 font-semibold">วันคืนจริง</p>
                      <p className="font-bold text-green-700">
                        {new Date(selectedLoan.returnDate).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </>
                  )}
                </div>
              </section>

              <hr />

              {/* สถานะ */}
              <section className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-slate-600 font-semibold">สถานะ</p>
                  <p
                    className={`inline-block mt-2 px-3 py-1 rounded text-sm font-bold ${
                      getStatusLabel(selectedLoan.status).color
                    }`}
                  >
                    {getStatusLabel(selectedLoan.status).label}
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-slate-50 flex gap-3">
              {selectedLoan.status === "BORROWED" && (
                <button
                  onClick={() => {
                    handleReturnItem(selectedLoan.id);
                    setShowDetailModal(false);
                  }}
                  className="px-5 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                >
                  บันทึกการคืน
                </button>
              )}

              <button
                onClick={() => handleOpenEditModal(selectedLoan)}
                className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                แก้ไข
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 rounded-md text-sm text-slate-900 hover:bg-slate-200 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 p-4 rounded-lg hover:border-zinc-300 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{count}</p>
        </div>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}
