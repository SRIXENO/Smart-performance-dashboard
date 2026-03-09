'use client';

import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import CommandCenterDashboard from './command-center';
import StudentDashboard from './student-dashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const showCommandCenter =
    Boolean(user) &&
    (user?.role === 'admin'
      || hasPermission(user, 'approvals.manage')
      || hasPermission(user, 'activities.view')
      || hasPermission(user, 'import.manage'));

  return showCommandCenter ? <CommandCenterDashboard /> : <StudentDashboard />;
}
