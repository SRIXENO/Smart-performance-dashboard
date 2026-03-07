'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [clock, setClock] = useState(new Date());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const applyTheme = (mode: 'light' | 'dark') => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    root.classList.add(mode);
    body.classList.add(mode);
    root.style.colorScheme = mode;
  };

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | null) || null;
    const initial = saved || 'light';
    setTheme(initial);
    localStorage.setItem('theme', initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-start gap-2">
          <button
            type="button"
            onClick={onMenuToggle}
            className="interactive-btn md:hidden inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Live insights | {clock.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="interactive-btn inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          <div className="hidden sm:flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/80">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-sm">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
              <div className="text-slate-500 capitalize text-xs dark:text-slate-400">{user?.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="interactive-btn bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
