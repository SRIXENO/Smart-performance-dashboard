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
    studentsView: false,
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
};

const PERMISSION_ALIASES = {
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

const resolvePermissions = (user) => {
  const role = String(user?.role || 'viewer');
  return {
    ...(ROLE_PERMISSION_DEFAULTS[role] || {}),
    ...((user?.permissions && typeof user.permissions === 'object') ? user.permissions : {}),
  };
};

const hasPermission = (user, permission) => {
  const resolvedKey = PERMISSION_ALIASES[permission] || permission;
  const permissions = resolvePermissions(user);
  return Boolean(permissions[resolvedKey]);
};

module.exports = {
  ROLE_PERMISSION_DEFAULTS,
  PERMISSION_ALIASES,
  resolvePermissions,
  hasPermission,
};
