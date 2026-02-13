'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { academicAPI, aiAnalyticsAPI, activityAPI } from '@/lib/api';
import { AcademicRecord, AIAnalytics, ActivityLog } from '@/types';
import ChartCard, { GradientLineChart } from '@/components/dashboard/ChartCard';
import { DashboardSkeleton } from '@/components/dashboard/SkeletonLoader';

export default function StudentAnalyticsPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [academicRecord, setAcademicRecord] = useState<AcademicRecord | null>(null);
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalytics | null>(null);
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudentAnalytics();
    }
  }, [studentId]);

  const fetchStudentAnalytics = async () => {
    try {
      setLoading(true);
      const [academicRes, aiRes, timelineRes] = await Promise.all([
        academicAPI.getAcademicRecord(studentId),
        aiAnalyticsAPI.getStudentAnalytics(studentId),
        activityAPI.getStudentTimeline(studentId, { limit: 20 })
      ]);

      setAcademicRecord(academicRes.data.data);
      setAiAnalytics(aiRes.data.data);
      setTimeline(timelineRes.data.data);
    } catch (error) {
      console.error('Failed to fetch student analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const cgpaTrendData = academicRecord?.semesters
    .filter(s => s.status === 'completed')
    .map(s => ({
      semester: `Sem ${s.semester}`,
      sgpa: s.sgpa
    })) || [];

  const cgpaChartData = cgpaTrendData.length > 0 ? {
    labels: cgpaTrendData.map(d => d.semester),
    datasets: [{
      label: 'SGPA',
      data: cgpaTrendData.map(d => d.sgpa),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      default: return 'from-green-500 to-green-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🎓 Student Analytics & AI Insights</h1>
        <p className="text-indigo-100">Comprehensive academic performance analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Current CGPA</div>
          <div className="text-4xl font-bold">{academicRecord?.cgpa.toFixed(2) || '0.00'}</div>
          <div className="text-sm mt-2 opacity-75">Out of 10.0</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Credits Earned</div>
          <div className="text-4xl font-bold">{academicRecord?.totalCreditsEarned || 0}</div>
          <div className="text-sm mt-2 opacity-75">Total credits</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Academic Status</div>
          <div className="text-2xl font-bold capitalize">{academicRecord?.academicStatus || 'N/A'}</div>
          <div className="text-sm mt-2 opacity-75">Current standing</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Semesters Completed</div>
          <div className="text-4xl font-bold">
            {academicRecord?.semesters.filter(s => s.status === 'completed').length || 0}
          </div>
          <div className="text-sm mt-2 opacity-75">Out of {academicRecord?.semesters.length || 0}</div>
        </div>
      </div>

      {aiAnalytics && (
        <div className={`bg-gradient-to-r ${getRiskBgColor(aiAnalytics.riskLevel)} rounded-xl shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">🤖 AI Risk Assessment</h2>
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

          {aiAnalytics.riskFactors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Risk Factors:</div>
              <div className="flex flex-wrap gap-2">
                {aiAnalytics.riskFactors.map((factor, idx) => (
                  <span key={idx} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {factor.factor}: {factor.value.toFixed(1)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {aiAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">🔮</span>
              <div>
                <h3 className="font-semibold text-gray-900">Predicted CGPA</h3>
                <p className="text-sm text-gray-500">End of program</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-600">{aiAnalytics.predictedCGPA?.toFixed(2) || 'N/A'}</div>
            <div className="mt-2 text-sm text-gray-500">
              Confidence: {aiAnalytics.confidenceScore}%
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="font-semibold text-gray-900">Next Semester SGPA</h3>
                <p className="text-sm text-gray-500">Prediction</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-green-600">{aiAnalytics.predictedNextSemesterSGPA?.toFixed(2) || 'N/A'}</div>
            <div className="mt-2 text-sm text-gray-500">Based on current trend</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="font-semibold text-gray-900">Expected Grade</h3>
                <p className="text-sm text-gray-500">Final classification</p>
              </div>
            </div>
            <div className="text-lg font-bold text-purple-600">{aiAnalytics.predictedFinalGrade || 'N/A'}</div>
            {aiAnalytics.peerComparison && (
              <div className="mt-2 text-sm text-gray-500">
                Rank: {aiAnalytics.peerComparison.departmentRank} | Percentile: {aiAnalytics.peerComparison.percentile}%
              </div>
            )}
          </div>
        </div>
      )}

      {cgpaChartData && (
        <GradientLineChart
          title="SGPA Trend Over Semesters"
          subtitle="Academic performance progression"
          data={cgpaChartData}
          height={300}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Semester-wise Performance</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aiAnalytics && aiAnalytics.alerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Smart Alerts</h3>
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

        {aiAnalytics && aiAnalytics.suggestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Improvement Suggestions</h3>
            <div className="space-y-3">
              {aiAnalytics.suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {suggestion.priority} priority
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{suggestion.category}</span>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">{suggestion.suggestion}</div>
                  <div className="text-sm text-gray-600">{suggestion.expectedImpact}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
