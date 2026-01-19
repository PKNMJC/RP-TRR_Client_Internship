import { useMemo } from "react";
import { RepairTicket, User } from "../types/repair.types";

export const useRepairFilters = (
  repairs: RepairTicket[],
  currentUser: User | null,
  activeTab: string,
  searchTerm: string,
  filterStatus: string,
  filterPriority: string
) => {
  const filteredRepairs = useMemo(() => {
    return repairs.filter((repair) => {
      // 1. Tab Based Filter
      const isUnassigned = !repair.assignee;
      const isAssignedToMe = repair.assignee?.id === currentUser?.id;
      const isCompleted = repair.status === "COMPLETED";

      let matchesTab = false;
      if (activeTab === "available") {
        matchesTab = isUnassigned && !isCompleted && repair.status !== "CANCELLED";
      } else if (activeTab === "my-tasks") {
        matchesTab = isAssignedToMe && !isCompleted && repair.status !== "CANCELLED";
      } else if (activeTab === "completed") {
        matchesTab = isCompleted;
      }

      if (!matchesTab) return false;

      // 2. Search & Sub-filters
      const matchesSearch =
        repair.problemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repair.reporterName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || repair.status === filterStatus;
      const matchesPriority = filterPriority === "all" || repair.urgency === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [repairs, currentUser, activeTab, searchTerm, filterStatus, filterPriority]);

  const stats = useMemo(() => {
    return {
      available: repairs.filter(
        (r) => !r.assignee && r.status !== "COMPLETED" && r.status !== "CANCELLED"
      ).length,
      myTasks: repairs.filter(
        (r) => r.assignee?.id === currentUser?.id && r.status !== "COMPLETED" && r.status !== "CANCELLED"
      ).length,
      completed: repairs.filter((r) => r.status === "COMPLETED").length,
      urgent: repairs.filter((r) => r.urgency === "CRITICAL" || r.urgency === "URGENT").length,
    };
  }, [repairs, currentUser]);

  return { filteredRepairs, stats };
};
