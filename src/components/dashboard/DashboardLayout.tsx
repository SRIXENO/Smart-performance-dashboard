'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ParallaxBackdrop from '@/components/ui/ParallaxBackdrop';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isFocusMode = String(searchParams?.get('focus') || '').toLowerCase() === '1';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

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

  if (isFocusMode) {
    return (
      <div className="dashboard-font relative min-h-screen dashboard-surface dashboard-pattern">
        <ParallaxBackdrop />
        <main className="relative min-h-screen overflow-x-auto overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-font relative flex min-h-screen dashboard-surface dashboard-pattern">
      <ParallaxBackdrop />
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="relative flex-1 flex flex-col min-w-0">
        <Topbar onMenuToggle={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
