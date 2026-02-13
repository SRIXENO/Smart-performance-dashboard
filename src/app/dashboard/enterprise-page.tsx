'use client';

import { useEffect, useState } from 'react';
import { dashboardAPI, aiAnalyticsAPI } from '@/lib/api';
import EnhancedKPICard from '@/components/dashboard/EnhancedKPICard';
import ChartCard, { MultiLineChart, StackedBarChart, GradientLineChart } from '@/components/dashboard/ChartCard';
import SmartFilter from '@/components/dashboard/SmartFilter';
import { DashboardSkeleton } from '@/components/dashboard/SkeletonLoader';
import { DashboardSummary } from '@/types';

export default function EnterpriseD ashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [gradeData, setGradeData] = useState<any>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [departmentComparison, setDepartmentComparison] = useState<any[]>([]);
  const [cgpaDistribution, setCgpaDistribution] = useState<any[]>([]);
  const [performanceGrowth, setPerformanceGrowth] = useState<any[]>([]);
  const [difficultSubjects, setDifficultSubjects] = useState<any[]>([]);
  const [attendanceCorrelation, setAttendanceCorrelation] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        summaryRes,
        attendanceRes,
        gradeRes,
        atRiskRes,
        deptCompRes,
        cgpaDistRes,
        growthRes,
        difficultRes,
        correlationRes,
        recentRes,
        aiInsightsRes
      ] = await Promise.all([
        dashboardAPI.getSummary(filters),
        dashboardAPI.getAttendanceTrend(),
        dashboardAPI.getGradeDistribution(),
        dashboardAPI.getAtRiskStudents({ limit: 10 }),
        dashboardAPI.getDepartmentComparison(),
        dashboardAPI.getCGPADistribution(),
        dashboardAPI.getPerformanceGrowth(),
        dashboardAPI.getDifficultSubjects({ limit: 5 }),
        dashboardAPI.getAttendancePerformanceCorrelation(),
        dashboardAPI.getRecentStudents({ limit: 5 }),
        aiAnalyticsAPI.getDashboardInsights()
      ]);

      setSummary(summaryRes.data.data);
      setAttendanceData(attendanceRes.data.data);
      setGradeData(gradeRes.data.data);
      setAtRiskStudents(atRiskRes.data.data);
      setDepartmentComparison(deptCompRes.data.data);
      setCgpaDistribution(cgpaDistRes.data.data);
      setPerformanceGrowth(growthRes.data.data);
      setDifficultSubjects(difficultRes.data.data);
      setAttendanceCorrelation(correlationRes.data.data);
      setRecentStudents(recentRes.data.data);
      setAiInsights(aiInsightsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Prepare chart data
  const attendanceChartData = attendanceData ? {
    labels: attendanceData.months,
    datasets: [{
      label: 'Average Attendance %',
      data: attendanceData.attendancePercentages,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const gradeChartData = gradeData ? {
    labels: ['A', 'B', 'C', 'D', 'F'],
    datasets: [{
      label: 'Number of Students',
      data: [gradeData.A, gradeData.B, gradeData.C, gradeData.D, gradeData.F],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderWidth: 0
    }]
  } : null;

  const departmentChartData = departmentComparison.length > 0 ? {
    labels: departmentComparison.map(d => d._id.split(' ')[0]),
    datasets: [{
      label: 'Average CGPA',
      data: departmentComparison.map(d => d.avgCGPA.toFixed(2)),
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: 'rgb(139, 92, 246)',
      borderWidth: 2
    }]
  } : null;

  const cgpaDistChartData = cgpaDistribution.length > 0 ? {
    labels: cgpaDistribution.map(d => `${d._id}-${d._id + 1}`),
    datasets: [{
      label: 'Number of Students',
      data: cgpaDistribution.map(d => d.count),
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 2
    }]
  } : null;

  const performanceGrowthData = performanceGrowth.length > 0 ? {
    labels: performanceGrowth.map(p => p.semester),
    datasets: [
      {
        label: 'SGPA',
        data: performanceGrowth.map(p => p.sgpa),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.4
      },
      {
        label: 'Growth Rate %',
        data: performanceGrowth.map(p => p.growthRate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        tension: 0.4
      }
    ]
  } : null;

  const correlationChartData = attendanceCorrelation.length > 0 ? {
    labels: attendanceCorrelation.map(c => `${c._id}%+`),
    datasets: [{
      label: 'Average Marks',
      data: attendanceCorrelation.map(c => c.avgMarks.toFixed(1)),
      backgroundColor: 'rgba(236, 72, 153, 0.8)',
      borderColor: 'rgb(236, 72, 153)',
      borderWidth: 2
    }]
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📊 Enterprise Analytics Dashboard</h1>
        <p className="text-blue-100">Comprehensive student performance insights powered by AI</p>
      </div>

      {/* Smart Filters */}
      <SmartFilter
        onFilterChange={setFilters}
        showDepartment
        showYear
        showSemester
        showPerformanceCategory
      />

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedKPICard
          label="Total Students"
          value={summary?.totalStudents || 0}
          icon="👥"
          color="blue"
          subtitle="Enrolled students"
          miniChart={[45, 52, 48, 60, 58, 65]}
        />
        <EnhancedKPICard
          label="Active Students"
          value={summary?.activeStudents || 0}
          icon="✅"
          color="green"
          subtitle="Currently active"
          trend="up"
        />
        <EnhancedKPICard
          label="Average CGPA"
          value={summary?.avgCGPA?.toFixed(2) || '0.00'}
          icon="🎓"
          color="purple"
          subtitle="Overall performance"
          miniChart={[6.5, 6.8, 7.0, 7.2, 7.3, 7.4]}
        />
        <EnhancedKPICard
          label="Average Attendance"
          value={`${summary?.avgAttendance || 0}%`}
          change={summary?.avgAttendanceChange}
          icon="📊"
          color="indigo"
          subtitle="Last 6 months"
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedKPICard
          label="Pass Percentage"
          value={`${summary?.passPercentage || 0}%`}
          icon="✨"
          color="green"
          trend="up"
        />
        <EnhancedKPICard
          label="Excellent Students"
          value={summary?.excellentStudents || 0}
          icon="🏆"
          color="yellow"
          subtitle="CGPA ≥ 9.0"
        />
        <EnhancedKPICard
          label="At-Risk Students"
          value={summary?.criticalRiskStudents || 0}
          icon="⚠️"
          color="red"
          alert
          subtitle="Critical risk level"
        />
        <EnhancedKPICard
          label="Improving Students"
          value={summary?.improvingStudents || 0}
          icon="📈"
          color="green"
          subtitle="Positive trend"
          trend="up"
        />
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="text-xl font-bold">AI-Powered Insights</h2>
              <p className="text-sm text-purple-100">Real-time intelligent analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{aiInsights.summary?.criticalRisk || 0}</div>
              <div className="text-sm text-purple-100">Critical Risk Students</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{aiInsights.summary?.improvingStudents || 0}</div>
              <div className="text-sm text-purple-100">Improving Performance</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{aiInsights.recentAlerts?.length || 0}</div>
              <div className="text-sm text-purple-100">Active Alerts</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {attendanceChartData && (
          <GradientLineChart
            title="Attendance Trend"
            subtitle="Last 6 months average"
            data={attendanceChartData}
            height={300}
          />
        )}
        {gradeChartData && (
          <ChartCard
            title="Grade Distribution"
            subtitle="Current semester"
            type="doughnut"
            data={gradeChartData}
            height={300}
          />
        )}
      </div>

      {/* Department & CGPA Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentChartData && (
          <ChartCard
            title="Department Performance Comparison"
            subtitle="Average CGPA by department"
            type="bar"
            data={departmentChartData}
            height={300}
          />
        )}
        {cgpaDistChartData && (
          <ChartCard
            title="CGPA Distribution"
            subtitle="Student distribution across CGPA ranges"
            type="bar"
            data={cgpaDistChartData}
            height={300}
          />
        )}
      </div>

      {/* Performance Growth & Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {performanceGrowthData && (
          <MultiLineChart
            title="Performance Growth Timeline"
            subtitle="SGPA and growth rate over semesters"
            data={performanceGrowthData}
            height={300}
          />
        )}
        {correlationChartData && (
          <ChartCard
            title="Attendance vs Performance Correlation"
            subtitle="Impact of attendance on marks"
            type="bar"
            data={correlationChartData}
            height={300}
          />
        )}
      </div>

      {/* Bottom Section: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Students */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">⚠️ At-Risk Students</h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {atRiskStudents.length}
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {atRiskStudents.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    {student.department} - Year {student.year}
                  </div>
                </div>
                <span className="bg-red-200 text-red-900 text-xs font-medium px-2.5 py-1 rounded-full">
                  {student.alertMessage}
                </span>
              </div>
            ))}
            {atRiskStudents.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                ✅ No at-risk students found
              </div>
            )}
          </div>
        </div>

        {/* Difficult Subjects */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📚 Most Difficult Subjects</h3>
          </div>
          <div className="space-y-3">
            {difficultSubjects.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{subject.subjectName}</div>
                  <div className="text-sm text-gray-500">
                    {subject.studentCount} students
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-700">{subject.avgMarks}%</div>
                  <div className="text-xs text-gray-500">{subject.failureRate.toFixed(1)}% fail rate</div>
                </div>
              </div>
            ))}
            {difficultSubjects.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recently Added Students */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🆕 Recently Added Students</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentStudents.map((student, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="font-medium text-gray-900 mb-1">{student.name}</div>
              <div className="text-sm text-gray-600">{student.studentId}</div>
              <div className="text-xs text-gray-500 mt-2">{student.department}</div>
              <div className="text-xs text-gray-500">Year {student.year}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
