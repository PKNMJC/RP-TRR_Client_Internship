"use client";

import { ProtectedRoute } from "@/hooks/useAuth";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute requireAdmin>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 lg:ml-56 pt-16 lg:pt-0 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
