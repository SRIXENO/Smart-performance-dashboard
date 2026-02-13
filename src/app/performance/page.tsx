'use client';

import { useEffect, useState } from 'react';
import { studentsAPI, subjectsAPI } from '@/lib/api';
import axios from 'axios';
import ConfirmModal from '@/components/ConfirmModal';
import SuccessToast from '@/components/SuccessToast';
import { useAuth } from '@/context/AuthContext';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

export default function Performance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    subjectName: '',
    attendancePercentage: '',
    marks: '',
    semester: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchStudents();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/performance');
      const populatedRecords = response.data.data.records.map((record: any) => ({
        ...record,
        studentName: record.studentId?.name || 'Unknown',
        studentCode: record.studentId?.studentId || 'N/A',
        department: record.studentId?.department || 'N/A',
        year: record.studentId?.year || 'N/A'
      }));
      setRecords(populatedRecords);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll({ limit: 1000 });
      setStudents(response.data.data.students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleStudentChange = async (studentId: string) => {
    setFormData({ ...formData, studentId });
    setLoading(true);
    
    try {
      const student = students.find(s => s._id === studentId);
      if (student) {
        setSelectedStudent(student);
        setFormData(prev => ({
          ...prev,
          semester: student.semester ? `Semester ${student.semester}` : ''
        }));
        
        // Fetch assigned subjects
        if (student.department && student.year) {
          try {
            const subjectsResponse = await subjectsAPI.getByDeptYear(student.department, student.year);
            const subjects = subjectsResponse.data.data.subjectGroup?.subjects || [];
            setAssignedSubjects(subjects);
          } catch (error) {
            setAssignedSubjects([]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.studentId) {
      setErrorMessage('Please select a student');
      setShowErrorToast(true);
      return;
    }
    
    // Check for duplicate
    const duplicate = records.find(r => 
      r.studentId === formData.studentId && 
      r.subjectName === formData.subjectName && 
      r.semester === formData.semester
    );
    
    if (duplicate) {
      setErrorMessage('Performance record already exists for this student, subject, and semester');
      setShowErrorToast(true);
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/performance', {
        ...formData,
        attendancePercentage: parseFloat(formData.attendancePercentage),
        marks: parseFloat(formData.marks)
      });
      
      // Optimistic UI update
      await fetchRecords();
      
      setSuccessMessage('Performance record created successfully!');
      setShowSuccessToast(true);
      setShowForm(false);
      setFormData({
        studentId: '',
        subjectName: '',
        attendancePercentage: '',
        marks: '',
        semester: ''
      });
      setSelectedStudent(null);
      setAssignedSubjects([]);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to create record');
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, studentName: string, subjectName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Performance Record?',
      message: `Are you sure you want to delete the performance record for ${studentName} in ${subjectName}? This action cannot be undone.`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await api.delete(`/performance/${id}`);
          await fetchRecords();
          setConfirmModal({ ...confirmModal, isOpen: false });
          setSuccessMessage('Performance record deleted successfully!');
          setShowSuccessToast(true);
        } catch (error) {
          setErrorMessage('Failed to delete record');
          setShowErrorToast(true);
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Performance Management</h1>
        {user?.role !== 'viewer' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Performance Record'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Performance Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="" className="text-gray-500">Select Student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.studentId}) - Year {student.year}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedStudent && (
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Student:</strong> {selectedStudent.name} | 
                    <strong> Department:</strong> {selectedStudent.department} | 
                    <strong> Year:</strong> {selectedStudent.year}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                {assignedSubjects.length > 0 ? (
                  <select
                    required
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {assignedSubjects.map((subject) => (
                      <option key={subject.code} value={subject.name}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendance %</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.attendancePercentage}
                  onChange={(e) => setFormData({ ...formData, attendancePercentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <input
                  type="text"
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Semester 1"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !formData.studentId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{loading ? 'Saving...' : 'Save Record'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.studentName}
                  <br />
                  <span className="text-xs text-gray-500">{record.studentCode}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.subjectName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.attendancePercentage}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.marks}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    record.grade === 'A' ? 'bg-green-100 text-green-800' :
                    record.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                    record.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    record.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.grade}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.semester}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user?.role !== 'viewer' && (
                    <button
                      onClick={() => handleDelete(record._id, students.find(s => s._id === record.studentId)?.name || 'Unknown', record.subjectName)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No performance records found. Click "Add Performance Record" to create one.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.message}
        confirmStyle="danger"
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />

      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{errorMessage}</span>
            <button onClick={() => setShowErrorToast(false)} className="ml-4 text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}