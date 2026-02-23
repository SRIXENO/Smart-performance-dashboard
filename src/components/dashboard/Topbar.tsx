'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Live insights • {clock.toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-sm">
              <div className="font-semibold text-slate-900">{user?.name}</div>
              <div className="text-slate-500 capitalize text-xs">{user?.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
