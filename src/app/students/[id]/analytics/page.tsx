'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { academicAPI, aiAnalyticsAPI, activityAPI, studentsAPI } from '@/lib/api';
import { AcademicRecord, AIAnalytics, ActivityLog, Student } from '@/types';
import ChartCard, { GradientLineChart } from '@/components/dashboard/ChartCard';
import { DashboardSkeleton } from '@/components/dashboard/SkeletonLoader';

type TabKey = 'overview' | 'trends' | 'risk' | 'attendance' | 'notes';

type ChecklistItem = {
  key: string;
  label: string;
  impact?: string;
  priority?: 'low' | 'medium' | 'high';
  checked: boolean;
};

export default function StudentAnalyticsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params?.id as string;
  const focusMode = String(searchParams?.get('focus') || '').toLowerCase() === '1';

  const [student, setStudent] = useState<Student | null>(null);
  const [academicRecord, setAcademicRecord] = useState<AcademicRecord | null>(null);
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalytics | null>(null);
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudentAnalytics();
    }
  }, [studentId]);

  const fetchStudentAnalytics = async () => {
    try {
      setLoading(true);
      const [profileRes, academicRes, aiRes, timelineRes] = await Promise.all([
        studentsAPI.getProfile(studentId),
        academicAPI.getAcademicRecord(studentId),
        aiAnalyticsAPI.getStudentAnalytics(studentId),
        activityAPI.getStudentTimeline(studentId, { limit: 20 })
      ]);

      setStudent(profileRes.data?.data?.student || null);
      setAcademicRecord(academicRes.data.data);
      setAiAnalytics(aiRes.data.data);
      setTimeline(timelineRes.data.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch student analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedSemesters = academicRecord?.semesters.filter((s) => s.status === 'completed') || [];

  const sgpaTrendData = completedSemesters.map((s) => ({
    semester: `Sem ${s.semester}`,
    sgpa: s.sgpa
  }));

  const sgpaChartData = sgpaTrendData.length > 0 ? {
    labels: sgpaTrendData.map((d) => d.semester),
    datasets: [{
      label: 'SGPA',
      data: sgpaTrendData.map((d) => d.sgpa),
      borderColor: 'rgb(var(--chart-1))',
      backgroundColor: 'rgba(var(--chart-1), 0.12)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const attendanceTrendData = completedSemesters
    .filter((s) => typeof s.attendancePercentage === 'number')
    .map((s) => ({
      semester: `Sem ${s.semester}`,
      attendance: Number(s.attendancePercentage || 0)
    }));

  const attendanceChartData = attendanceTrendData.length > 0 ? {
    labels: attendanceTrendData.map((d) => d.semester),
    datasets: [{
      label: 'Attendance %',
      data: attendanceTrendData.map((d) => d.attendance),
      borderColor: 'rgb(var(--chart-2))',
      backgroundColor: 'rgba(var(--chart-2), 0.12)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const riskTimelineData = completedSemesters.map((s) => {
    const sgpaPenalty = typeof s.sgpa === 'number' ? (10 - s.sgpa) * 10 : 0;
    const attendancePenalty = typeof s.attendancePercentage === 'number'
      ? Math.max(0, 75 - s.attendancePercentage) * 0.6
      : 0;
    const score = Math.min(100, Math.max(0, sgpaPenalty + attendancePenalty));
    return {
      semester: `Sem ${s.semester}`,
      score: Number(score.toFixed(1))
    };
  });

  const riskChartData = riskTimelineData.length > 0 ? {
    labels: riskTimelineData.map((d) => d.semester),
    datasets: [{
      label: 'Risk Score',
      data: riskTimelineData.map((d) => d.score),
      borderColor: 'rgb(var(--chart-4))',
      backgroundColor: 'rgba(var(--chart-4), 0.12)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const baseChecklist = useMemo(() => {
    const items = aiAnalytics?.interventionScoring?.recommendations?.length
      ? aiAnalytics.interventionScoring.recommendations
      : (aiAnalytics?.suggestions || []);

    return items.map((item, index) => ({
      key: `${item.category}-${index}`,
      label: item.suggestion,
      impact: item.expectedImpact,
      priority: item.priority,
    }));
  }, [aiAnalytics]);

  useEffect(() => {
    if (!baseChecklist.length) {
      setChecklist([]);
      return;
    }
    setChecklist((prev) => {
      const prevMap = new Map(prev.map((item) => [item.key, item]));
      return baseChecklist.map((item) => ({
        ...item,
        checked: prevMap.get(item.key)?.checked ?? false,
      }));
    });
  }, [baseChecklist]);

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => prev.map((item) =>
      item.key === key ? { ...item, checked: !item.checked } : item
    ));
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      default: return 'from-green-500 to-green-600';
    }
  };

  const getPriorityTone = (value?: string) => {
    if (value === 'high') return 'bg-red-100 text-red-700';
    if (value === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Student 360 Hub</h1>
            <p className="text-slate-200">Unified academic intelligence profile</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <div className="text-sm uppercase tracking-wide text-slate-200">Student</div>
            <div className="text-lg font-semibold">
              {student?.name || 'Unknown'}
            </div>
            <div className="text-xs text-slate-200">
              {student?.studentId || 'ID'} | {student?.department || 'Department'} | Year {student?.year || 'N/A'}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a href={`/students/${studentId}`} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
            Student Profile
          </a>
          {focusMode ? (
            <a href={`/students/${studentId}/analytics`} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
              Exit Focus
            </a>
          ) : (
            <a href={`/students/${studentId}/analytics?focus=1`} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
              Focus Mode
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-2 flex flex-wrap gap-2">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'trends', label: 'Trends' },
          { key: 'risk', label: 'Risk' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'notes', label: 'Advisor Notes' }
        ] as { key: TabKey; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-500 mb-2">Current CGPA</div>
              <div className="text-3xl font-bold text-slate-900">{academicRecord?.cgpa.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-gray-500 mt-2">Out of 10.0</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-500 mb-2">Credits Earned</div>
              <div className="text-3xl font-bold text-slate-900">
                {(academicRecord?.semesters?.some((sem) => sem.status === 'completed' && sem.subjects?.length)
                  ? academicRecord?.totalCreditsEarned
                  : 0) || 0}
              </div>
              <div className="text-xs text-gray-500 mt-2">Total credits</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-500 mb-2">Risk Score</div>
              <div className="text-3xl font-bold text-slate-900">{aiAnalytics?.riskScore ?? 'N/A'}</div>
              <div className="text-xs text-gray-500 mt-2">AI assessment</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-500 mb-2">Attendance</div>
              <div className="text-3xl font-bold text-slate-900">
                {typeof student?.currentAttendance === 'number'
                  ? `${student?.currentAttendance.toFixed(1)}%`
                  : attendanceTrendData.length
                    ? `${attendanceTrendData[attendanceTrendData.length - 1].attendance.toFixed(1)}%`
                    : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-2">Latest semester</div>
            </div>
          </div>

          {aiAnalytics && (
            <div className={`bg-gradient-to-r ${getRiskBgColor(aiAnalytics.riskLevel)} rounded-xl shadow-lg p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">AI Risk Assessment</h2>
                  <p className="text-sm opacity-90 mt-1">Intelligent performance analysis</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold">{aiAnalytics.riskScore}</div>
                  <div className="text-sm opacity-75">Risk Score</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-sm opacity-90 mb-1">Risk Level</div>
                  <div className="text-xl font-bold capitalize">{aiAnalytics.riskLevel}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-sm opacity-90 mb-1">Attendance Trend</div>
                  <div className="text-xl font-bold capitalize">{aiAnalytics.attendanceTrend}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-sm opacity-90 mb-1">Performance Trend</div>
                  <div className="text-xl font-bold capitalize">{aiAnalytics.performanceTrend}</div>
                </div>
              </div>
            </div>
          )}

          {aiAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-500 mb-2">Predicted CGPA</div>
                <div className="text-4xl font-bold text-blue-600">{aiAnalytics.predictedCGPA?.toFixed(2) || 'N/A'}</div>
                <div className="mt-2 text-sm text-gray-500">Confidence: {aiAnalytics.confidenceScore}%</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-500 mb-2">Next Semester SGPA</div>
                <div className="text-4xl font-bold text-green-600">{aiAnalytics.predictedNextSemesterSGPA?.toFixed(2) || 'N/A'}</div>
                <div className="mt-2 text-sm text-gray-500">Based on current trend</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-500 mb-2">Expected Grade</div>
                <div className="text-lg font-bold text-purple-600">{aiAnalytics.predictedFinalGrade || 'N/A'}</div>
                {aiAnalytics.peerComparison && (
                  <div className="mt-2 text-sm text-gray-500">
                    Rank: {aiAnalytics.peerComparison.departmentRank} | Percentile: {aiAnalytics.peerComparison.percentile}%
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          {sgpaChartData ? (
            <GradientLineChart
              title="SGPA Trend Over Semesters"
              subtitle="Academic performance progression"
              data={sgpaChartData}
              height={320}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 text-sm text-gray-500">No completed semester data yet.</div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Semester-wise Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SGPA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {academicRecord?.semesters.map((sem, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Semester {sem.semester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Year {sem.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{sem.sgpa.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sem.totalCredits}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sem.status === 'completed' ? 'bg-green-100 text-green-800' :
                          sem.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sem.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-6">
          {riskChartData ? (
            <GradientLineChart
              title="Risk Timeline"
              subtitle="Estimated risk score by semester"
              data={riskChartData}
              height={320}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 text-sm text-gray-500">Risk timeline will appear after completed semesters.</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiAnalytics && aiAnalytics.alerts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Alerts</h3>
                <div className="space-y-3">
                  {aiAnalytics.alerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                      alert.severity === 'danger' ? 'bg-orange-50 border-orange-500' :
                      alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {alert.actionRequired && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            Action Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Intervention Checklist</h3>
                <span className="text-xs text-gray-500">Track action items</span>
              </div>
              {checklist.length ? (
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <label key={item.key} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklist(item.key)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      <span className="flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{item.label}</span>
                          {item.priority && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityTone(item.priority)}`}>
                              {item.priority}
                            </span>
                          )}
                        </span>
                        {item.impact && (
                          <span className="block text-xs text-slate-500 mt-1">{item.impact}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No interventions suggested yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {attendanceChartData ? (
            <GradientLineChart
              title="Attendance Trend"
              subtitle="Semester attendance progression"
              data={attendanceChartData}
              height={320}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 text-sm text-gray-500">Attendance trends will appear once semesters include attendance.</div>
          )}

          <ChartCard
            title="Attendance Breakdown"
            subtitle="Completed semesters"
            type="bar"
            data={{
              labels: attendanceTrendData.map((d) => d.semester),
              datasets: [{
                label: 'Attendance %',
                data: attendanceTrendData.map((d) => d.attendance),
                backgroundColor: 'rgba(var(--chart-2), 0.6)',
                borderRadius: 6
              }]
            }}
            height={260}
          />
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advisor Notes</h3>
            {((student as any)?.advisorNotes || []).length ? (
              <div className="space-y-4">
                {(student as any).advisorNotes.map((note: any, index: number) => (
                  <div key={note._id || index} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">{note.authorName || 'Advisor'}</div>
                      <div className="text-xs text-slate-500">
                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Date unavailable'}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No advisor notes yet.</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Timeline</h3>
            {timeline.length ? (
              <div className="space-y-3">
                {timeline.map((item) => (
                  <div key={item._id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{item.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{item.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No recent activity found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
