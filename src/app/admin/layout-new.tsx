import type { Metadata } from "next";
import AdminSidebar from "../../components/AdminSidebar-new";
import "../../app/globals.css";

export const metadata: Metadata = {
  title: "Admin Portal | TRR-RP",
  description: "ระบบจัดการแอดมิน",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-slate-950 min-h-screen">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 lg:pt-0 pt-16 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 min-h-screen">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
