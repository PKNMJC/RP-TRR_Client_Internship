'use client';

import { ProtectedRoute } from '@/hooks/useAuth';
import ITSidebar from '@/components/ITSidebar';

export default function ITLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute requireIT>
      <div className="flex min-h-screen bg-gray-50">
        <ITSidebar />
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
