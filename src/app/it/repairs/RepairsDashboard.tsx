"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRepairs } from "./hooks/useRepairs";
import { useRepairActions } from "./hooks/useRepairActions";
import { useRepairFilters } from "./hooks/useRepairFilters";
import { StatusIndicator } from "./ui/StatusIndicator";
import { LoadingState } from "./ui/LoadingSpinner";
import { RepairStats } from "./RepairStats";
import { RepairTabs } from "./RepairTabs";
import { RepairFilters } from "./RepairFilters";
import { RepairTable } from "./RepairTable";
import { RepairCard } from "./RepairCard";
import { RepairDetailModal } from "./RepairDetailModal";
import { RepairEditModal } from "./RepairEditModal";
import { RepairTransferModal } from "./RepairTransferModal";
import { RepairTicket } from "./types/repair.types";

export function RepairsDashboard() {
  const {
    repairs,
    loading,
    itStaff,
    currentUser,
    lastUpdated,
    isAutoRefresh,
    setIsAutoRefresh,
    refresh,
  } = useRepairs();

  const [activeTab, setActiveTab] = useState<
    "available" | "my-tasks" | "completed"
  >("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedRepair, setSelectedRepair] = useState<RepairTicket | null>(
    null,
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectionForTransfer, setSelectionForTransfer] =
    useState<RepairTicket | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    priority: "NORMAL",
    description: "",
    assigneeId: "",
    location: "",
    problemCategory: "OTHER",
  });

  const {
    submitting,
    handleAcceptRepair,
    handleCompleteRepair,
    handleSaveEdit,
    handleTransferRepair,
  } = useRepairActions(refresh);

  const { filteredRepairs, stats } = useRepairFilters(
    repairs,
    currentUser,
    activeTab,
    searchTerm,
    filterStatus,
    filterPriority,
  );

  const handleOpenEdit = () => {
    if (selectedRepair) {
      setEditForm({
        title: selectedRepair.problemTitle,
        priority: selectedRepair.urgency,
        description: selectedRepair.problemDescription || "",
        assigneeId: selectedRepair.assignee?.id.toString() || "",
        location: selectedRepair.location || "",
        problemCategory: selectedRepair.problemCategory || "OTHER",
      });
      setShowEditModal(true);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-neutral-900 pb-5 md:pb-6">
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">
            แจ้งซ่อมทั้งหมด
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5 md:mt-2">
            <p className="text-[10px] md:text-base text-slate-500 font-medium leading-relaxed">
              จัดการคำขอรับบริการและการซ่อมบำรุงในระบบทั้งหมด
            </p>
            <StatusIndicator
              isAutoRefresh={isAutoRefresh}
              lastUpdated={lastUpdated}
              loading={loading}
              onRefresh={refresh}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <RepairStats
        stats={stats}
        activeTab={activeTab}
        totalThisWeek={repairs.length}
      />

      {/* Tab Navigation */}
      <RepairTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />

      {/* Filters & Search */}
      <RepairFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
      />

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-100">
        {filteredRepairs.map((repair) => (
          <RepairCard
            key={repair.id}
            repair={repair}
            activeTab={activeTab}
            onAccept={(id) => handleAcceptRepair(id, currentUser)}
            onTransfer={setSelectionForTransfer}
            onView={setSelectedRepair}
            submitting={submitting}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <RepairTable
        repairs={filteredRepairs}
        activeTab={activeTab}
        onAccept={(id) => handleAcceptRepair(id, currentUser)}
        onTransfer={setSelectionForTransfer}
        onView={setSelectedRepair}
        submitting={submitting}
      />

      {/* Modals */}
      <RepairDetailModal
        repair={selectedRepair}
        onClose={() => setSelectedRepair(null)}
        onEdit={handleOpenEdit}
        onComplete={handleCompleteRepair}
        submitting={submitting}
      />

      <RepairEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(form) => handleSaveEdit(selectedRepair!.id, form)}
        editForm={editForm}
        setEditForm={setEditForm}
        itStaff={itStaff}
        submitting={submitting}
      />

      <RepairTransferModal
        repair={selectionForTransfer}
        onClose={() => setSelectionForTransfer(null)}
        onTransfer={(id, staffId) => handleTransferRepair(id, staffId)}
        itStaff={itStaff}
        submitting={submitting}
      />
    </div>
  );
}
