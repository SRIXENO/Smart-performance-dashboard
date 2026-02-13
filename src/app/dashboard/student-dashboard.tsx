'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { studentsAPI } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StudentDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [sortOrder, setSortOrder] = useState('asc');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getAll({ limit: 1000 });
      const studentData = response.data.data.students || [];
      setStudents(studentData);
      setFilteredStudents(studentData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterStudents();
  }, [selectedYear, selectedGrade, students]);

  const filterStudents = () => {
    let filtered = [...students];
    if (selectedYear !== 'All') {
      const yearNum = parseInt(selectedYear.split(' ')[1]);
      filtered = filtered.filter(s => s.year === yearNum);
    }
    if (selectedGrade !== 'All') {
      const gradeNum = parseInt(selectedGrade.split(' ')[1]);
      filtered = filtered.filter(s => s.grade === gradeNum);
    }
    setFilteredStudents(filtered);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  };

  const handleSort = () => {
    const sorted = [...filteredStudents].sort((a, b) => {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    setFilteredStudents(sorted);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleEditStudent = (student) => {
    setEditingStudent({...student});
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const updatedStudents = students.map(s => 
      s.id === editingStudent.id ? editingStudent : s
    );
    setStudents(updatedStudents);
    setShowEditModal(false);
  };

  const handleSubjectChange = (subject, value) => {
    const updatedSubjects = {...editingStudent.subjects, [subject]: parseFloat(value) || 0};
    const subjectValues = Object.values(updatedSubjects);
    const averageMarks = subjectValues.reduce((a, b) => a + b, 0) / subjectValues.length;
    setEditingStudent({
      ...editingStudent,
      subjects: updatedSubjects,
      averageMarks: Math.round(averageMarks)
    });
  };


  const gradeGenderData = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
    datasets: [
      {
        label: 'Male',
        data: [1, 2, 3, 4].map(year => 
          filteredStudents.filter(s => s.year === year && (s.gender === 'Male' || s.gender === 'male')).length
        ),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: 'Female',
        data: [1, 2, 3, 4].map(year => 
          filteredStudents.filter(s => s.year === year && (s.gender === 'Female' || s.gender === 'female')).length
        ),
        backgroundColor: '#ec4899',
        borderRadius: 4
      }
    ]
  };


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Student Performance Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Data refreshed at {lastRefreshed.toLocaleString()}</span>
              <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Select Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option>All</option>
                  <option>Year 1</option>
                  <option>Year 2</option>
                  <option>Year 3</option>
                  <option>Year 4</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Select Grade</label>
                <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <option>All</option>
                  <option>Grade 1</option>
                  <option>Grade 2</option>
                  <option>Grade 3</option>
                  <option>Grade 4</option>
                  <option>Grade 5</option>
                </select>
              </div>
            </div>
          </div>

          <div className="col-span-10 space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active Students</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredStudents.filter(s => s.status === 'active').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Departments</p>
                    <p className="text-2xl font-bold text-gray-900">{new Set(students.map(s => s.department)).size}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg CGPA</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredStudents.filter(s => s.cgpa).length > 0 
                        ? (filteredStudents.reduce((sum, s) => sum + (parseFloat(s.cgpa) || 0), 0) / filteredStudents.filter(s => s.cgpa).length).toFixed(2)
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredStudents.filter(s => s.attendance).length > 0
                        ? (filteredStudents.reduce((sum, s) => sum + (parseFloat(s.attendance) || 0), 0) / filteredStudents.filter(s => s.attendance).length).toFixed(1) + '%'
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Academic Details of Students</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <button onClick={handleSort} className="flex items-center space-x-1 hover:text-gray-700">
                          <span>Student Name</span>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                          </svg>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGPA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No students found. Add students to see them here.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                      <tr key={student._id} className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.gender || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Year {student.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.cgpa || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.attendance ? student.attendance + '%' : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            student.status === 'active' ? 'bg-green-100 text-green-700' :
                            student.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                            student.status === 'graduated' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button onClick={() => router.push(`/dashboard/student/${student._id}`)} className="text-blue-600 hover:text-blue-800 font-medium">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Students by Department</h3>
                <p className="text-xs text-gray-500 mb-4">Distribution across departments</p>
                <div style={{ height: '300px' }}>
                  <Bar data={{
                    labels: Array.from(new Set(students.map(s => s.department))),
                    datasets: [{
                      label: 'Students',
                      data: Array.from(new Set(students.map(s => s.department))).map(dept => 
                        filteredStudents.filter(s => s.department === dept).length
                      ),
                      backgroundColor: '#3b82f6',
                      borderRadius: 4
                    }]
                  }} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Students by Year and Gender</h3>
                <p className="text-xs text-gray-500 mb-4">Year-wise gender distribution</p>
                <div style={{ height: '300px' }}>
                  <Bar data={gradeGenderData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


        </>
      )}
    </div>
  );
}
