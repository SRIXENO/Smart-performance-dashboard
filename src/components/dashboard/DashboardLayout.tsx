'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === 'viewer' && user.approvalStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-xl shadow border border-slate-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Approval Pending</h1>
          <p className="mt-3 text-slate-600">
            Your account is waiting for admin approval. You will get access after approval.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Account: <span className="font-medium text-slate-700">{user.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-font flex min-h-screen bg-slate-50">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuToggle={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
