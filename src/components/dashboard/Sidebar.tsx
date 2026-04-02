'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';
import MotionReveal from '@/components/ui/MotionReveal';
import { hasPermission } from '@/lib/permissions';

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
    name: 'Faculty',
    href: '/faculty',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0118 16.5c0 1.061-.137 2.09-.394 3.07M12 14L5.84 10.578A12.083 12.083 0 006 16.5c0 1.061.137 2.09.394 3.07M8 20h8" />
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

const studentNavigation: NavItem[] = [
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
    name: 'My Profile',
    href: '/students',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
];

const adminItem: NavItem = {
  name: 'New Approvals',
  href: '/admin/approvals',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const loginHistoryItem: NavItem = {
  name: 'Login History',
  href: '/admin/login-history',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const viewersItem: NavItem = {
  name: 'Viewers',
  href: '/admin/viewers',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M7 20H2v-2a4 4 0 015-3.87m10-2.13a4 4 0 10-8 0 4 4 0 008 0zM7 10a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  )
};

export default function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const baseItems = user?.role === 'student' ? studentNavigation : navigation;
  const items = [
    ...baseItems,
    ...(hasPermission(user, 'approvals.manage') ? [adminItem] : []),
    ...(hasPermission(user, 'viewers.manage') ? [viewersItem] : []),
    ...(hasPermission(user, 'activities.view') ? [loginHistoryItem] : []),
  ];

  return (
    <>
      {isOpen && <button className="fixed inset-0 z-40 bg-slate-900/40 md:hidden" onClick={onClose} aria-label="Close menu overlay" />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] p-4 bg-slate-100 border-r border-slate-200 overflow-y-auto transform transition-transform duration-200 md:static md:z-0 md:w-64 md:max-w-none md:translate-x-0 md:min-h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <MotionReveal>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <img src="/spid-logo.svg" alt="SPID logo" className="h-7 w-7 rounded-full border border-slate-300" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">SPID Dashboard</h1>
        </div>
        <p className="text-slate-500 text-sm mt-1">Performance Intelligence</p>
      </div>
      </MotionReveal>

      <nav className="space-y-1.5">
        {items.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <MotionReveal key={item.name} delayMs={index * 28}>
            <Link
              href={item.href}
              onClick={onClose}
              className={`interactive-btn flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
            </MotionReveal>
          );
        })}
      </nav>

      <MotionReveal delayMs={260}>
      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs text-slate-500">Signed in as</div>
        <div className="text-sm font-semibold mt-1 text-slate-900 truncate">{user?.name || 'User'}</div>
        <div className="text-xs uppercase tracking-wide mt-1 text-slate-500">{user?.role || 'guest'}</div>
      </div>
      </MotionReveal>
      </aside>
    </>
  );
}
