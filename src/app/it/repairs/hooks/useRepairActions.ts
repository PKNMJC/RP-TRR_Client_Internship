import { useState } from "react";
import { apiFetch } from "@/services/api";
import { RepairTicket, User } from "../types/repair.types";

export const useRepairActions = (onSuccess: () => void) => {
  const [submitting, setSubmitting] = useState(false);

  const handleAcceptRepair = async (id: number, currentUser: User | null) => {
    if (!currentUser) {
      alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาล็อกอินใหม่");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch(`/api/repairs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "IN_PROGRESS",
          assignedTo: currentUser.id,
        }),
      });
      onSuccess();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการรับเรื่อง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRepair = async (repair: RepairTicket) => {
    if (!repair.assignee) {
      alert("ไม่สามารถจบงานได้ เนื่องจากยังไม่มีผู้รับผิดชอบ\nกรุณามอบหมายงานก่อนปิดงาน");
      return;
    }

    if (!confirm("ยืนยันการเสร็จสิ้นงานซ่อมนี้?")) return;
    try {
      setSubmitting(true);
      await apiFetch(`/api/repairs/${repair.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        }),
      });
      onSuccess();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกงานเสร็จสิ้น");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: number, form: { title: string; description: string; priority: string; assigneeId: string; location: string; reporterDepartment: string }) => {
    if (!form.title.trim()) {
      alert("กรุณากรอกหัวข้อแจ้งซ่อม");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch(`/api/repairs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          problemTitle: form.title,
          problemDescription: form.description,
          urgency: form.priority,
          location: form.location,
          reporterDepartment: form.reporterDepartment,
          assignedTo: form.assigneeId ? parseInt(form.assigneeId) : null,
        }),
      });
      onSuccess();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferRepair = async (id: number, newAssigneeId: number) => {
    try {
      setSubmitting(true);
      await apiFetch(`/api/repairs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          assignedTo: newAssigneeId,
        }),
      });
      onSuccess();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการโอนงาน");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    handleAcceptRepair,
    handleCompleteRepair,
    handleSaveEdit,
    handleTransferRepair,
  };
};
