'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

type NavItem = {
  name: string;
  href: string;
  icon: ReactNode;
};

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-8h8V3h-8v10z" />
      </svg>
    )
  },
  {
    name: 'Students',
    href: '/students',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m8-2.13a4 4 0 10-8 0 4 4 0 008 0zM6 9a3 3 0 100-6 3 3 0 000 6zm12 0a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    )
  },
  {
    name: 'Subjects',
    href: '/subjects',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.483 9.246 5 7.5 5 4.462 5 2 6.567 2 8.5v9c0 1.933 2.462 3.5 5.5 3.5 1.746 0 3.332-.483 4.5-1.253m0-13C13.168 5.483 14.754 5 16.5 5 19.538 5 22 6.567 22 8.5v9c0 1.933-2.462 3.5-5.5 3.5-1.746 0-3.332-.483-4.5-1.253" />
      </svg>
    )
  },
  {
    name: 'Performance',
    href: '/performance',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8L10 18l-4-4-5 5" />
      </svg>
    )
  },
  {
    name: 'Import Data',
    href: '/import',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
      </svg>
    )
  }
];

const adminItem: NavItem = {
  name: 'Login History',
  href: '/admin/login-history',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = user?.role === 'admin' ? [...navigation, adminItem] : navigation;

  return (
    <aside className="relative text-white w-72 min-h-screen p-5 bg-slate-950 border-r border-slate-800 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.12),_transparent_45%)] pointer-events-none" />

      <div className="relative z-10 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] tracking-wide uppercase bg-slate-800/80 text-slate-300 border border-slate-700">
          Live Workspace
        </div>
        <h1 className="text-2xl font-black mt-3 tracking-tight">SPID Command</h1>
        <p className="text-slate-400 text-sm mt-1">Performance Intelligence</p>
      </div>

      <nav className="relative z-10 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white border border-transparent'
              }`}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cyan-300" />}
              <span>{item.icon}</span>
              <span className="tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative z-10 mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="text-xs text-slate-400">Signed in as</div>
        <div className="text-sm font-semibold mt-1 truncate">{user?.name || 'User'}</div>
        <div className="text-xs uppercase tracking-wide mt-2 text-cyan-300">{user?.role || 'guest'}</div>
      </div>
    </aside>
  );
}
