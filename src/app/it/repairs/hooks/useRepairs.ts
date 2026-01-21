import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import { RepairTicket, User } from "../types/repair.types";

export const useRepairs = () => {
  const router = useRouter();
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [itStaff, setItStaff] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchRepairs = useCallback(
    async (isBackground = false) => {
      try {
        const token =
          localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        if (!isBackground) setLoading(true);
        const data = await apiFetch("/api/repairs");
        setRepairs(Array.isArray(data) ? data : []);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to fetch repairs:", err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [router]
  );

  const fetchSupportingData = async () => {
    try {
      const staff = await apiFetch("/users/it-staff");
      if (Array.isArray(staff)) setItStaff(staff);

      const profile = await apiFetch("/auth/profile");
      if (profile) setCurrentUser(profile);
    } catch (err) {
      console.error("Failed to fetch supporting data:", err);
    }
  };

  useEffect(() => {
    fetchRepairs();
    fetchSupportingData();

    const interval = setInterval(() => {
      if (isAutoRefresh) {
        fetchRepairs(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRepairs, isAutoRefresh]);

  return {
    repairs,
    loading,
    itStaff,
    currentUser,
    lastUpdated,
    isAutoRefresh,
    setIsAutoRefresh,
    refresh: (isBackground = false) => fetchRepairs(isBackground),
  };
};
