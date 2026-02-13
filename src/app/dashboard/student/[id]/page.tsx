'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Line, Bar } from 'react-chartjs-2';
import { studentsAPI, subjectsAPI } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function IndividualStudentDashboard() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);

  const [creditsHistory] = useState([
    { date: '2025-02-01', time: '10:30 AM', credits: 400, activity: 'Semester Exam Excellence', cumulative: 400 },
    { date: '2025-02-02', time: '04:15 PM', credits: 5, activity: 'Class Participation', cumulative: 405 },
    { date: '2025-02-05', time: '09:00 AM', credits: 50, activity: 'Assignment Submission', cumulative: 455 },
    { date: '2025-02-08', time: '02:30 PM', credits: 25, activity: 'Quiz Performance', cumulative: 480 },
    { date: '2025-02-10', time: '11:45 AM', credits: 100, activity: 'Project Completion', cumulative: 580 }
  ]);

  useEffect(() => {
    fetchStudent();
  }, [params.id]);

  const fetchStudent = async () => {
    try {
      const response = await studentsAPI.getById(params.id as string);
      const studentData = response.data.data.student;
      setStudent(studentData);
      
      // Fetch subjects for student's department and year
      if (studentData.department && studentData.year) {
        try {
          const subjectsResponse = await subjectsAPI.getByDeptYear(studentData.department, studentData.year);
          const subjects = subjectsResponse.data.data.subjectGroup?.subjects || [];
          setAssignedSubjects(subjects);
        } catch (error) {
          console.error('Failed to fetch subjects:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch student:', error);
    } finally {
      setLoading(false);
    }
  };

  const creditsChartData = {
    labels: creditsHistory.map(c => `${c.date} ${c.time}`),
    datasets: [{
      label: 'Credits Earned',
      data: creditsHistory.map(c => c.credits),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const cumulativeChartData = {
    labels: creditsHistory.map(c => c.date),
    datasets: [{
      label: 'Cumulative Credits',
      data: creditsHistory.map(c => c.cumulative),
      backgroundColor: '#10b981',
      borderRadius: 4
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">Student not found</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 text-blue-600 hover:text-blue-800">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-600">{student.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-gray-500">ID: {student.studentId} | Year {student.year} | {student.department}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Credits</p>
            <p className="text-3xl font-bold text-gray-900">{creditsHistory[creditsHistory.length - 1]?.cumulative || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Average Marks</p>
            <p className="text-3xl font-bold text-gray-900">N/A</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Attendance</p>
            <p className="text-3xl font-bold text-gray-900">{student.attendance || 'N/A'}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">CGPA</p>
            <p className="text-3xl font-bold text-gray-900">{student.cgpa || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="semester">Current Semester</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="all">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credits Earned Over Time</h3>
            <div style={{ height: '300px' }}>
              <Line data={creditsChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true },
                  tooltip: { 
                    callbacks: {
                      label: (context) => `Credits: +${context.parsed.y}`
                    }
                  }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Credits</h3>
            <div style={{ height: '300px' }}>
              <Bar data={cumulativeChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: true } }
              }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Credits History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits Earned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumulative</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditsHistory.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        +{entry.credits}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{entry.cumulative}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{entry.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Performance - Assigned Subjects</h3>
          {assignedSubjects.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {assignedSubjects.map((subject) => (
                <div key={subject.code} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">{subject.code}</p>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{subject.name}</p>
                  <p className="text-2xl font-bold text-gray-900">N/A</p>
                  <p className="text-xs text-gray-500 mt-1">Marks</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No subjects assigned for {student.department} Year {student.year}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
