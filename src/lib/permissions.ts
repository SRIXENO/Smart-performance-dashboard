import { User } from '@/types';

const ROLE_PERMISSION_DEFAULTS = {
  admin: {
    studentsView: true,
    studentsManage: true,
    performanceView: true,
    performanceEdit: true,
    subjectsAssign: true,
    reportsExport: true,
    dashboardView: true,
    approvalsManage: true,
    viewersManage: true,
    facultyManage: true,
    importManage: true,
    activitiesView: true,
  },
  faculty: {
    studentsView: true,
    studentsManage: true,
    performanceView: true,
    performanceEdit: true,
    subjectsAssign: false,
    reportsExport: true,
    dashboardView: true,
    approvalsManage: false,
    viewersManage: false,
    facultyManage: false,
    importManage: false,
    activitiesView: false,
  },
  viewer: {
    studentsView: true,
    studentsManage: false,
    performanceView: true,
    performanceEdit: false,
    subjectsAssign: false,
    reportsExport: false,
    dashboardView: true,
    approvalsManage: false,
    viewersManage: false,
    facultyManage: false,
    importManage: false,
    activitiesView: false,
  },
  student: {
    studentsView: true,
    studentsManage: false,
    performanceView: false,
    performanceEdit: false,
    subjectsAssign: false,
    reportsExport: false,
    dashboardView: true,
    approvalsManage: false,
    viewersManage: false,
    facultyManage: false,
    importManage: false,
    activitiesView: false,
  },
} as const;

const PERMISSION_ALIASES: Record<string, keyof NonNullable<User['permissions']>> = {
  'students.view': 'studentsView',
  'students.manage': 'studentsManage',
  'performance.view': 'performanceView',
  'performance.edit': 'performanceEdit',
  'subjects.assign': 'subjectsAssign',
  'reports.export': 'reportsExport',
  'dashboard.view': 'dashboardView',
  'approvals.manage': 'approvalsManage',
  'viewers.manage': 'viewersManage',
  'faculty.manage': 'facultyManage',
  'import.manage': 'importManage',
  'activities.view': 'activitiesView',
};

export const resolvePermissions = (user: User | null | undefined) => ({
  ...(ROLE_PERMISSION_DEFAULTS[(user?.role || 'viewer') as keyof typeof ROLE_PERMISSION_DEFAULTS] || {}),
  ...((user?.permissions && typeof user.permissions === 'object') ? user.permissions : {}),
});

export const hasPermission = (user: User | null | undefined, permission: string) => {
  const resolved = resolvePermissions(user);
  const key = (PERMISSION_ALIASES[permission] || permission) as keyof typeof resolved;
  return Boolean(resolved[key]);
};
