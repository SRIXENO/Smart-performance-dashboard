'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Students', href: '/students', icon: '👥' },
  { name: 'Subjects', href: '/subjects', icon: '📚' },
  { name: 'Performance', href: '/performance', icon: '📈' },
  { name: 'Import Data', href: '/import', icon: '📤' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = user?.role === 'admin'
    ? [...navigation, { name: 'Login History', href: '/admin/login-history', icon: 'A' }]
    : navigation;

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">SPID Dashboard</h1>
      </div>
      
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
