'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  aiAnalyticsAPI,
  approvalsAPI,
  activityAPI,
  dashboardAPI,
  performanceAPI,
  studentsAPI,
  subjectsAPI,
  systemAPI,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

type PendingApproval = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  authProvider?: string;
};

type MissingStudent = {
  _id: string;
  studentId: string;
  name: string;
  department?: string;
  year?: number;
  semester?: string;
  eligibleSubjectCount?: number;
  reasons?: string[];
};

type DepartmentComparisonRow = {
  _id: string;
  avgCGPA: number;
  studentCount: number;
};

type ImportActivity = {
  _id?: string;
  description?: string;
  timestamp?: string;
  userName?: string;
  metadata?: {
    attemptedRows?: number;
    validRows?: number;
    invalidRows?: number;
  };
};

type LoginAnomaly = {
  id: string;
  userName: string;
  email: string;
  date: string;
  role: string;
  anomalySeverity?: string | null;
  anomalyReasons?: string[];
};

type UrgentQueueRow = {
  id: string;
  student?: any;
  riskScore?: number;
  riskTrendScore?: number;
  riskLevel?: string;
};

type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  href?: string;
};

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electrical and Communication Engineering',
  'Electrical and Electronic Engineering',
  'Mechanical',
  'Civil',
  'Biotechnology',
];

export default function CommandCenterDashboard() {
  const { user } = useAuth();
  const canManageApprovals = hasPermission(user, 'approvals.manage');
  const canViewActivities = hasPermission(user, 'activities.view');
  const canImport = hasPermission(user, 'import.manage');
  const canManageStudents = hasPermission(user, 'students.manage');
  const canEditPerformance = hasPermission(user, 'performance.edit');
  const canAssignSubjects = hasPermission(user, 'subjects.assign');
  const canExportReports = hasPermission(user, 'reports.export');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [missingSummary, setMissingSummary] = useState<any>(null);
  const [weakDepartments, setWeakDepartments] = useState<DepartmentComparisonRow[]>([]);
  const [importIssues, setImportIssues] = useState<ImportActivity[]>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<LoginAnomaly[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [urgentQueue, setUrgentQueue] = useState<UrgentQueueRow[]>([]);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [baselineForm, setBaselineForm] = useState({ limit: 20, marks: 70, attendancePercentage: 85, perStudentMaxSubjects: 1 });
  const [baselineResult, setBaselineResult] = useState<any>(null);
  const [promotionForm, setPromotionForm] = useState({ department: '', year: '', semester: '', status: 'active' });
  const [promotionResult, setPromotionResult] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({ department: '', year: '', semester: '', fromStatus: 'active', toStatus: 'inactive' });
  const [statusResult, setStatusResult] = useState<any>(null);
  const [subjectForm, setSubjectForm] = useState({ department: '', year: '', semester: '', subjectLines: '' });
  const [subjectResult, setSubjectResult] = useState<any>(null);
  const [exportForm, setExportForm] = useState({ department: '', year: '', semester: '', status: '' });

  const loadDashboard = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const tasks: Array<Promise<any>> = [
        dashboardAPI.getSummary(),
        performanceAPI.getMissingSummary({ limit: 12 }),
        dashboardAPI.getDepartmentComparison(),
        aiAnalyticsAPI.getDashboardInsights(),
        aiAnalyticsAPI.getAtRiskStudentsAI({ limit: 12 }),
        systemAPI.getStatus(),
      ];

      if (canManageApprovals) {
        tasks.push(approvalsAPI.getPending());
      } else {
        tasks.push(Promise.resolve({ data: { data: [] } }));
      }

      if (canViewActivities) {
        tasks.push(activityAPI.getLoginHistory({ limit: 6, anomalyOnly: true }));
      } else {
        tasks.push(Promise.resolve({ data: { data: { items: [] } } }));
      }

      tasks.push(activityAPI.getRecentActivities({ action: 'data_imported', limit: 12 }));

      const [
        summaryRes,
        missingRes,
        departmentRes,
        aiRes,
        atRiskRes,
        healthRes,
        approvalsRes,
        anomaliesRes,
        importRes,
      ] = await Promise.all(tasks);

      const departments = (departmentRes.data?.data || []) as DepartmentComparisonRow[];
      const weakDeptRows = [...departments]
        .sort((a, b) => Number(a.avgCGPA || 0) - Number(b.avgCGPA || 0))
        .slice(0, 4);

      const importRows = ((importRes.data?.data?.items || []) as ImportActivity[])
        .filter((item) => Number(item.metadata?.invalidRows || 0) > 0)
        .slice(0, 5);

      const urgentRows = (atRiskRes.data?.data || []).map((row: any) => ({
        id: String(row._id || ''),
        student: row.studentId,
        riskScore: Number(row.riskScore || 0),
        riskTrendScore: Number(row?.interventionScoring?.riskTrendScore || 0),
        riskLevel: row.riskLevel,
      }));
      urgentRows.sort((a: UrgentQueueRow, b: UrgentQueueRow) =>
        (b.riskTrendScore || b.riskScore || 0) - (a.riskTrendScore || a.riskScore || 0)
      );

      setSummary(summaryRes.data?.data || null);
      setMissingSummary(missingRes.data?.data || null);
      setWeakDepartments(weakDeptRows);
      setAiInsights(aiRes.data?.data || null);
      setSystemStatus(healthRes.data || null);
      setPendingApprovals(approvalsRes.data?.data || []);
      setRecentAnomalies(anomaliesRes.data?.data?.items || []);
      setImportIssues(importRows);
      setUrgentQueue(urgentRows.slice(0, 6));
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load command center dashboard');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    loadDashboard();
    const interval = setInterval(() => {
      if (!document.hidden && active) {
        setRefreshing(true);
        loadDashboard({ silent: true });
      }
    }, 45000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const clearActionFeedback = () => {
    setActionError('');
    setActionMessage('');
  };

  const handleBaselineAction = async (dryRun = false) => {
    clearActionFeedback();
    setActionLoading(dryRun ? 'baseline-preview' : 'baseline-create');
    try {
      const response = await performanceAPI.bootstrapMissing({
        dryRun,
        limit: Number(baselineForm.limit) || 20,
        marks: Number(baselineForm.marks) || 70,
        attendancePercentage: Number(baselineForm.attendancePercentage) || 85,
        perStudentMaxSubjects: Number(baselineForm.perStudentMaxSubjects) || 1,
      });
      setBaselineResult(response.data?.data || null);
      setActionMessage(response.data?.message || (dryRun ? 'Baseline preview generated.' : 'Baseline records created.'));
      await loadDashboard({ silent: true });
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to process baseline performance action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveNext = async () => {
    if (!pendingApprovals.length) return;
    clearActionFeedback();
    setActionLoading('approve-next');
    try {
      await approvalsAPI.updateDecision(pendingApprovals[0]._id, 'approved');
      setActionMessage(`Approved ${pendingApprovals[0].name}.`);
      await loadDashboard({ silent: true });
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to approve account');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteSemester = async () => {
    clearActionFeedback();
    setActionLoading('promote-semester');
    try {
      const response = await studentsAPI.bulkPromoteSemester({
        department: promotionForm.department || undefined,
        year: promotionForm.year ? Number(promotionForm.year) : undefined,
        semester: promotionForm.semester ? Number(promotionForm.semester) : undefined,
        status: promotionForm.status || undefined,
      });
      setPromotionResult(response.data?.data || null);
      setActionMessage(response.data?.message || 'Semester promotion completed.');
      await loadDashboard({ silent: true });
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to promote semester');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkStatus = async () => {
    clearActionFeedback();
    setActionLoading('bulk-status');
    try {
      const response = await studentsAPI.bulkUpdateStatus({
        department: statusForm.department || undefined,
        year: statusForm.year ? Number(statusForm.year) : undefined,
        semester: statusForm.semester ? Number(statusForm.semester) : undefined,
        fromStatus: statusForm.fromStatus || undefined,
        toStatus: statusForm.toStatus,
      });
      setStatusResult(response.data?.data || null);
      setActionMessage(response.data?.message || 'Bulk status update completed.');
      await loadDashboard({ silent: true });
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to update student status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubjectMapping = async () => {
    clearActionFeedback();
    setActionLoading('subject-mapping');
    try {
      const subjects = subjectForm.subjectLines
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [code, ...nameParts] = line.split(',');
          return { code: String(code || '').trim(), name: nameParts.join(',').trim() };
        })
        .filter((item) => item.code && item.name);

      if (!subjects.length) {
        throw new Error('Enter at least one subject in the format CODE, Subject Name');
      }

      const response = await subjectsAPI.assign({
        department: subjectForm.department,
        year: Number(subjectForm.year),
        semester: Number(subjectForm.semester),
        subjects,
      });
      setSubjectResult(response.data?.data || null);
      setActionMessage(response.data?.message || 'Bulk subject mapping completed.');
      await loadDashboard({ silent: true });
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to assign subject mapping');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportReport = async () => {
    clearActionFeedback();
    setActionLoading('export-report');
    try {
      const response = await studentsAPI.exportCsv({
        department: exportForm.department || undefined,
        year: exportForm.year ? Number(exportForm.year) : undefined,
        semester: exportForm.semester ? Number(exportForm.semester) : undefined,
        status: exportForm.status || undefined,
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students-filtered-report-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setActionMessage('Filtered student report exported.');
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to export report');
    } finally {
      setActionLoading(null);
    }
  };

  const alerts = useMemo<DashboardAlert[]>(() => {
    const nextAlerts: DashboardAlert[] = [];

    if ((aiInsights?.summary?.criticalRisk || 0) > 0) {
      nextAlerts.push({
        id: 'critical-risk',
        title: 'Critical student risk detected',
        detail: `${aiInsights.summary.criticalRisk} students are currently in critical risk.`,
        severity: 'critical',
        href: '/performance',
      });
    }

    if (pendingApprovals.length > 0) {
      nextAlerts.push({
        id: 'pending-approvals',
        title: 'Pending account approvals',
        detail: `${pendingApprovals.length} accounts are waiting for admin approval.`,
        severity: 'warning',
        href: '/admin/approvals',
      });
    }

    if ((missingSummary?.summary?.totalMissing || 0) > 0) {
      nextAlerts.push({
        id: 'missing-performance',
        title: 'Missing performance data',
        detail: `${missingSummary.summary.totalMissing} students still have no performance records.`,
        severity: 'warning',
        href: '/performance',
      });
    }

    if (recentAnomalies.length > 0) {
      nextAlerts.push({
        id: 'login-anomaly',
        title: 'Suspicious login activity',
        detail: `${recentAnomalies.length} recent login anomalies need review.`,
        severity: 'critical',
        href: '/admin/login-history',
      });
    }

    if (importIssues.length > 0) {
      const rejected = importIssues.reduce((sum, item) => sum + Number(item.metadata?.invalidRows || 0), 0);
      nextAlerts.push({
        id: 'import-issues',
        title: 'Import validation issues found',
        detail: `${rejected} rows were rejected in recent imports.`,
        severity: 'info',
        href: '/import',
      });
    }

    return nextAlerts.slice(0, 6);
  }, [aiInsights, importIssues, missingSummary, pendingApprovals, recentAnomalies]);

  const topMissingStudents = (missingSummary?.students || []).slice(0, 5) as MissingStudent[];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-slate-600 shadow-sm">
          Loading command center...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Admin Ops</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Command Center Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">
              Alerts, approvals, missing data, weak departments, import validation, and system health in one screen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not refreshed yet'}
            </span>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadDashboard({ silent: true });
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {actionMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <ActionableCard
          title="Alerts"
          value={alerts.length}
          meta="active command-center flags"
          tone="rose"
          actionLabel="Schedule follow-up"
          actionHref="/performance"
        />
        <ActionableCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          meta="accounts waiting"
          tone="amber"
          actionLabel={pendingApprovals.length > 0 ? 'Approve next' : 'Open approvals'}
          actionHref={pendingApprovals.length > 0 ? undefined : '/admin/approvals'}
          onAction={pendingApprovals.length > 0 && canManageApprovals ? handleApproveNext : undefined}
          disabled={!canManageApprovals}
        />
        <ActionableCard
          title="Missing Performance"
          value={missingSummary?.summary?.totalMissing || 0}
          meta="students with no records"
          tone="violet"
          actionLabel="Open list"
          actionHref="/performance"
        />
        <ActionableCard
          title="Weak Departments"
          value={weakDepartments.length}
          meta="lowest CGPA clusters"
          tone="slate"
          actionLabel="Open overview"
          actionHref="/dashboard"
        />
        <ActionableCard
          title="Import Issues"
          value={importIssues.length}
          meta="recent rejected imports"
          tone="blue"
          actionLabel="Review imports"
          actionHref="/import"
          disabled={!canImport}
        />
        <ActionableCard
          title="System Status"
          value={systemStatus?.success && systemStatus?.dbConnected ? 'Healthy' : 'Degraded'}
          meta={systemStatus?.dbConnected ? `DB online - ${formatUptime(systemStatus?.uptimeSeconds)}` : 'database unavailable'}
          tone={systemStatus?.success && systemStatus?.dbConnected ? 'emerald' : 'rose'}
          actionLabel={refreshing ? 'Refreshing...' : 'Refresh status'}
          onAction={() => {
            setRefreshing(true);
            loadDashboard({ silent: true });
          }}
          disabled={refreshing}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
              <p className="text-sm text-slate-500">Highest priority items that need admin action now.</p>
            </div>
            <Link href="/performance" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Open performance
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {alerts.length > 0 ? alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            )) : (
              <EmptyState label="No critical operational alerts right now." />
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Urgent Queue</h2>
                <p className="text-sm text-slate-500">Ranked by risk trend score.</p>
              </div>
              <Link href="/performance" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Open list
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {urgentQueue.length ? urgentQueue.map((row) => (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{row.student?.name || 'Student'}</p>
                      <p className="text-xs text-slate-500">
                        {row.student?.studentId || 'ID'} • {row.student?.department || 'Department'} • Year {row.student?.year || 'N/A'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-700">Trend {row.riskTrendScore?.toFixed(1) || 0}</span>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 font-semibold text-slate-700">Risk {row.riskScore?.toFixed(1) || 0}</span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700">{row.riskLevel || 'unknown'}</span>
                      </div>
                    </div>
                    {row.student?._id ? (
                      <Link href={`/dashboard/student/${row.student._id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                        View
                      </Link>
                    ) : null}
                  </div>
                </div>
              )) : (
                <EmptyState label="No urgent students flagged right now." />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">System Status</h2>
                <p className="text-sm text-slate-500">Live API heartbeat and service readiness.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <SystemStatusRow
                label="API"
                value={systemStatus?.success ? 'Online' : 'Offline'}
                tone={systemStatus?.success ? 'emerald' : 'rose'}
              />
              <SystemStatusRow
                label="Database"
                value={systemStatus?.dbConnected ? 'Connected' : 'Disconnected'}
                tone={systemStatus?.dbConnected ? 'emerald' : 'rose'}
              />
              <SystemStatusRow
                label="Service"
                value={systemStatus?.service || 'spid-api'}
                tone="slate"
              />
              <SystemStatusRow
                label="Uptime"
                value={formatUptime(systemStatus?.uptimeSeconds)}
                tone="blue"
              />
              <SystemStatusRow
                label="Timestamp"
                value={systemStatus?.timestamp ? new Date(systemStatus.timestamp).toLocaleString() : 'N/A'}
                tone="violet"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Pending Approvals"
          subtitle="New accounts that cannot enter the system until approved."
          actionHref={canManageApprovals ? '/admin/approvals' : undefined}
          actionLabel={canManageApprovals ? 'Open approvals' : undefined}
        >
          {canManageApprovals ? (
            pendingApprovals.length > 0 ? (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 5).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">{item.email}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        {item.authProvider || 'local'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Requested {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No pending approvals." />
            )
          ) : (
            <EmptyState label="Your account cannot manage approvals." />
          )}
        </Panel>

        <Panel
          title="Missing Performance Data"
          subtitle="Newly created students or unmapped enrollments that still need records."
          actionHref="/performance"
          actionLabel="Open performance"
        >
          {topMissingStudents.length > 0 ? (
            <div className="space-y-3">
              {topMissingStudents.map((student) => (
                <div key={student._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.studentId} â€¢ {student.department || 'No department'} â€¢ Year {student.year || 'N/A'}</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {student.eligibleSubjectCount || 0} subjects
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{student.semester || 'Semester unavailable'}</p>
                  <p className="mt-1 text-xs text-amber-700">{student.reasons?.join(', ') || 'No performance record yet'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No students are waiting for first performance records." />
          )}
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Weak Departments"
          subtitle="Lowest performing departments by average CGPA."
          actionHref="/faculty"
          actionLabel="Open faculty insights"
        >
          {weakDepartments.length > 0 ? (
            <div className="space-y-3">
              {weakDepartments.map((department, index) => (
                <div key={department._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rank #{index + 1}</p>
                      <p className="mt-1 font-semibold text-slate-900">{department._id || 'Unknown department'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-rose-600">{Number(department.avgCGPA || 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{department.studentCount || 0} students</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Department comparison is not available yet." />
          )}
        </Panel>

        <Panel
          title="Import Issues"
          subtitle="Recent imports where rows were rejected during validation."
          actionHref={canImport ? '/import' : undefined}
          actionLabel={canImport ? 'Open import' : undefined}
        >
          {importIssues.length > 0 ? (
            <div className="space-y-3">
              {importIssues.map((item, index) => (
                <div key={item._id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.description || 'Performance import completed'}</p>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      {item.metadata?.invalidRows || 0} rejected
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.userName || 'System'} â€¢ attempted {item.metadata?.attemptedRows || 0} â€¢ valid {item.metadata?.validRows || 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Timestamp unavailable'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No recent import rejections found." />
          )}
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Risk Alerts"
          subtitle="Recent AI-generated student alerts needing intervention."
          actionHref="/performance"
          actionLabel="Review at-risk data"
        >
          {(aiInsights?.recentAlerts || []).length > 0 ? (
            <div className="space-y-3">
              {aiInsights.recentAlerts.slice(0, 5).map((item: any, index: number) => (
                <div key={`${item.studentId || index}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.studentName}</p>
                      <p className="text-sm text-slate-500">{item.studentId}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClasses(item.alert?.severity)}`}>
                      {item.alert?.severity || 'info'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.alert?.message || 'No alert details'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No AI alerts are active right now." />
          )}
        </Panel>

        <Panel
          title="Login Anomalies"
          subtitle="Suspicious authentication patterns from recent login history."
          actionHref={canViewActivities ? '/admin/login-history' : undefined}
          actionLabel={canViewActivities ? 'Open login history' : undefined}
        >
          {canViewActivities ? (
            recentAnomalies.length > 0 ? (
              <div className="space-y-3">
                {recentAnomalies.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.userName}</p>
                        <p className="text-sm text-slate-500">{item.email}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClasses(item.anomalySeverity)}`}>
                        {item.anomalySeverity || 'anomaly'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{(item.anomalyReasons || []).join(', ') || 'Suspicious login pattern detected'}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.date).toLocaleString()} â€¢ {item.role}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No recent login anomalies." />
            )
          ) : (
            <EmptyState label="Your account cannot view login history." />
          )}
        </Panel>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Bulk Actions</h2>
            <p className="text-sm text-slate-500">High-volume operational actions for performance, students, subjects, and exports.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <BulkCard
            title="Assign Baseline Performance"
            description="Create first performance records for students who still have none."
            disabled={!canEditPerformance}
            disabledLabel="Your account cannot edit performance."
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Student limit">
                <input type="number" min={1} max={100} value={baselineForm.limit} onChange={(e) => setBaselineForm((prev) => ({ ...prev, limit: Number(e.target.value) }))} className="bulk-input" />
              </Field>
              <Field label="Max subjects">
                <input type="number" min={1} max={6} value={baselineForm.perStudentMaxSubjects} onChange={(e) => setBaselineForm((prev) => ({ ...prev, perStudentMaxSubjects: Number(e.target.value) }))} className="bulk-input" />
              </Field>
              <Field label="Baseline marks">
                <input type="number" min={0} max={100} value={baselineForm.marks} onChange={(e) => setBaselineForm((prev) => ({ ...prev, marks: Number(e.target.value) }))} className="bulk-input" />
              </Field>
              <Field label="Attendance %">
                <input type="number" min={0} max={100} value={baselineForm.attendancePercentage} onChange={(e) => setBaselineForm((prev) => ({ ...prev, attendancePercentage: Number(e.target.value) }))} className="bulk-input" />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleBaselineAction(true)} disabled={actionLoading !== null} className="bulk-secondary-btn">
                {actionLoading === 'baseline-preview' ? 'Previewing...' : 'Preview'}
              </button>
              <button type="button" onClick={() => handleBaselineAction(false)} disabled={actionLoading !== null} className="bulk-primary-btn">
                {actionLoading === 'baseline-create' ? 'Creating...' : 'Assign Baseline'}
              </button>
            </div>
            {baselineResult && (
              <p className="mt-3 text-sm text-slate-600">
                Candidates: {baselineResult.candidates || 0} â€¢ Records: {baselineResult.recordsToCreate ?? baselineResult.recordsCreated ?? 0}
              </p>
            )}
          </BulkCard>

          <BulkCard
            title="Promote Semester"
            description="Move matching students to the next semester and auto-refresh enrollment mapping."
            disabled={!canManageStudents}
            disabledLabel="Your account cannot manage students."
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Department">
                <select value={promotionForm.department} onChange={(e) => setPromotionForm((prev) => ({ ...prev, department: e.target.value }))} className="bulk-input">
                  <option value="">All departments</option>
                  {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </Field>
              <Field label="Year">
                <select value={promotionForm.year} onChange={(e) => setPromotionForm((prev) => ({ ...prev, year: e.target.value }))} className="bulk-input">
                  <option value="">All years</option>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </Field>
              <Field label="Current semester">
                <select value={promotionForm.semester} onChange={(e) => setPromotionForm((prev) => ({ ...prev, semester: e.target.value }))} className="bulk-input">
                  <option value="">All semesters</option>
                  {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </Field>
              <Field label="Current status">
                <select value={promotionForm.status} onChange={(e) => setPromotionForm((prev) => ({ ...prev, status: e.target.value }))} className="bulk-input">
                  {['active', 'inactive', 'graduated', 'suspended'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </Field>
            </div>
            <button type="button" onClick={handlePromoteSemester} disabled={actionLoading !== null} className="mt-4 bulk-primary-btn">
              {actionLoading === 'promote-semester' ? 'Promoting...' : 'Promote Semester'}
            </button>
            {promotionResult && (
              <p className="mt-3 text-sm text-slate-600">
                Matched: {promotionResult.matchedStudents || 0} â€¢ Promoted: {promotionResult.promoted || 0} â€¢ Graduated: {promotionResult.graduated || 0}
              </p>
            )}
          </BulkCard>

          <BulkCard
            title="Bulk Subject Mapping"
            description="Assign subject groups to all matching students in one operation."
            disabled={!canAssignSubjects}
            disabledLabel="Your account cannot assign subjects."
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Department">
                <select value={subjectForm.department} onChange={(e) => setSubjectForm((prev) => ({ ...prev, department: e.target.value }))} className="bulk-input">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </Field>
              <Field label="Year">
                <select value={subjectForm.year} onChange={(e) => setSubjectForm((prev) => ({ ...prev, year: e.target.value }))} className="bulk-input">
                  <option value="">Select year</option>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </Field>
              <Field label="Semester">
                <select value={subjectForm.semester} onChange={(e) => setSubjectForm((prev) => ({ ...prev, semester: e.target.value }))} className="bulk-input">
                  <option value="">Select semester</option>
                  {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Subjects (one per line: CODE, Subject Name)">
              <textarea value={subjectForm.subjectLines} onChange={(e) => setSubjectForm((prev) => ({ ...prev, subjectLines: e.target.value }))} className="bulk-input min-h-[130px]" placeholder={'CS301, Database Systems\nCS302, Operating Systems'} />
            </Field>
            <button type="button" onClick={handleSubjectMapping} disabled={actionLoading !== null} className="mt-4 bulk-primary-btn">
              {actionLoading === 'subject-mapping' ? 'Assigning...' : 'Bulk Subject Mapping'}
            </button>
            {subjectResult && <p className="mt-3 text-sm text-slate-600">Subject group updated successfully.</p>}
          </BulkCard>

          <BulkCard
            title="Bulk Status Change"
            description="Move entire student cohorts between active, inactive, suspended, or graduated."
            disabled={!canManageStudents}
            disabledLabel="Your account cannot manage students."
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Department">
                <select value={statusForm.department} onChange={(e) => setStatusForm((prev) => ({ ...prev, department: e.target.value }))} className="bulk-input">
                  <option value="">All departments</option>
                  {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </Field>
              <Field label="Year">
                <select value={statusForm.year} onChange={(e) => setStatusForm((prev) => ({ ...prev, year: e.target.value }))} className="bulk-input">
                  <option value="">All years</option>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </Field>
              <Field label="Semester">
                <select value={statusForm.semester} onChange={(e) => setStatusForm((prev) => ({ ...prev, semester: e.target.value }))} className="bulk-input">
                  <option value="">All semesters</option>
                  {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </Field>
              <Field label="From status">
                <select value={statusForm.fromStatus} onChange={(e) => setStatusForm((prev) => ({ ...prev, fromStatus: e.target.value }))} className="bulk-input">
                  {['active', 'inactive', 'graduated', 'suspended'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </Field>
              <Field label="To status">
                <select value={statusForm.toStatus} onChange={(e) => setStatusForm((prev) => ({ ...prev, toStatus: e.target.value }))} className="bulk-input">
                  {['active', 'inactive', 'graduated', 'suspended'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </Field>
            </div>
            <button type="button" onClick={handleBulkStatus} disabled={actionLoading !== null} className="mt-4 bulk-primary-btn">
              {actionLoading === 'bulk-status' ? 'Updating...' : 'Bulk Status Change'}
            </button>
            {statusResult && (
              <p className="mt-3 text-sm text-slate-600">
                Matched: {statusResult.matchedStudents || 0} â€¢ Students updated: {statusResult.modifiedStudents || 0} â€¢ Login accounts updated: {statusResult.modifiedUsers || 0}
              </p>
            )}
          </BulkCard>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Field label="Export department">
              <select value={exportForm.department} onChange={(e) => setExportForm((prev) => ({ ...prev, department: e.target.value }))} className="bulk-input">
                <option value="">All departments</option>
                {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </Field>
            <Field label="Export year">
              <select value={exportForm.year} onChange={(e) => setExportForm((prev) => ({ ...prev, year: e.target.value }))} className="bulk-input">
                <option value="">All years</option>
                {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
              </select>
            </Field>
            <Field label="Export semester">
              <select value={exportForm.semester} onChange={(e) => setExportForm((prev) => ({ ...prev, semester: e.target.value }))} className="bulk-input">
                <option value="">All semesters</option>
                {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </Field>
            <Field label="Export status">
              <select value={exportForm.status} onChange={(e) => setExportForm((prev) => ({ ...prev, status: e.target.value }))} className="bulk-input">
                <option value="">All statuses</option>
                {['active', 'inactive', 'graduated', 'suspended'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </Field>
            <div className="min-w-[220px]">
              <button type="button" onClick={handleExportReport} disabled={!canExportReports || actionLoading !== null} className="bulk-primary-btn w-full disabled:opacity-60">
                {actionLoading === 'export-report' ? 'Exporting...' : 'Export Filtered Report'}
              </button>
            </div>
          </div>
          {!canExportReports && <p className="mt-3 text-sm text-slate-500">Your account cannot export reports.</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Operational Snapshot</h2>
            <p className="text-sm text-slate-500">Top-line academic and risk indicators from the current data set.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickLink href="/students" label="Students" />
            <QuickLink href="/performance" label="Performance" />
            <QuickLink href="/subjects" label="Subjects" />
            <QuickLink href="/faculty" label="Faculty" />
            <QuickLink href="/import" label="Import" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SnapshotCard title="Total Students" value={summary?.totalStudents || 0} hint={`${summary?.activeStudents || 0} active`} />
          <SnapshotCard title="Average CGPA" value={Number(summary?.avgCGPA || 0).toFixed(2)} hint="overall academic standing" />
          <SnapshotCard title="Pass Percentage" value={`${Number(summary?.passPercentage || 0).toFixed(1)}%`} hint="based on performance records" />
          <SnapshotCard title="Critical Risk" value={aiInsights?.summary?.criticalRisk || 0} hint={`${aiInsights?.summary?.highRisk || 0} high-risk students`} />
        </div>
      </section>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BulkCard({
  title,
  description,
  children,
  disabled,
  disabledLabel,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {disabled ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          {disabledLabel || 'This action is not available for your account.'}
        </div>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function OpsMetricCard({
  title,
  value,
  meta,
  tone,
}: {
  title: string;
  value: string | number;
  meta: string;
  tone: 'rose' | 'amber' | 'violet' | 'slate' | 'blue' | 'emerald';
}) {
  const tones = {
    rose: 'border-rose-200 bg-rose-50/70',
    amber: 'border-amber-200 bg-amber-50/70',
    violet: 'border-violet-200 bg-violet-50/70',
    slate: 'border-slate-200 bg-slate-50',
    blue: 'border-blue-200 bg-blue-50/70',
    emerald: 'border-emerald-200 bg-emerald-50/70',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{meta}</p>
    </div>
  );
}

function ActionableCard({
  title,
  value,
  meta,
  tone,
  actionLabel,
  actionHref,
  onAction,
  disabled = false,
}: {
  title: string;
  value: string | number;
  meta: string;
  tone: 'rose' | 'amber' | 'violet' | 'slate' | 'blue' | 'emerald';
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  const tones = {
    rose: 'border-rose-200 bg-rose-50/70',
    amber: 'border-amber-200 bg-amber-50/70',
    violet: 'border-violet-200 bg-violet-50/70',
    slate: 'border-slate-200 bg-slate-50',
    blue: 'border-blue-200 bg-blue-50/70',
    emerald: 'border-emerald-200 bg-emerald-50/70',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{meta}</p>
        </div>
        {actionHref && !disabled ? (
          <Link href={actionHref} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            disabled={disabled || !onAction}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: DashboardAlert }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${severityClasses(alert.severity)}`}>
              {alert.severity}
            </span>
            <p className="font-semibold text-slate-900">{alert.title}</p>
          </div>
          <p className="mt-2 text-sm text-slate-600">{alert.detail}</p>
        </div>
        {alert.href ? (
          <Link href={alert.href} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Open
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function SnapshotCard({ title, value, hint }: { title: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function SystemStatusRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClasses(tone)}`}>{value}</span>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      {label}
    </Link>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{label}</div>;
}

function severityClasses(level?: string | null) {
  switch (String(level || '').toLowerCase()) {
    case 'critical':
      return 'semantic-danger';
    case 'high':
    case 'warning':
      return 'semantic-warning';
    case 'medium':
    case 'info':
    case 'blue':
      return 'semantic-info';
    case 'emerald':
    case 'success':
      return 'semantic-success';
    case 'violet':
      return 'semantic-info';
    default:
      return 'semantic-neutral';
  }
}

function formatUptime(seconds?: number) {
  const total = Number(seconds || 0);
  if (!total) return '0m';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}




