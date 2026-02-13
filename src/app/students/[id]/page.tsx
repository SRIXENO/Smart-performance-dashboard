'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { studentsAPI } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';

export default function StudentDetail() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await studentsAPI.getById(params.id as string);
        setStudent(response.data.data.student);
      } catch (error) {
        console.error('Failed to fetch student:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [params.id]);

  const handleDelete = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Student?',
      message: `Are you sure you want to delete ${student.name}? This will permanently remove all student data including performance records. This action cannot be undone.`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await studentsAPI.delete(params.id as string);
          router.push('/students');
        } catch (error) {
          console.error('Failed to delete student:', error);
          alert('Failed to delete student');
          setIsDeleting(false);
        }
      }
    });
  };

  const handleExport = () => {
    const data = JSON.stringify(student, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_${student.studentId}.json`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Student not found</h2>
        <button
          onClick={() => router.push('/students')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-gray-500 mt-1">Student ID: {student.studentId}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  student.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {student.status?.toUpperCase()}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Year {student.year}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/students/${student._id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>🖨️</span>
              <span>Print</span>
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Export</span>
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'personal', label: 'Personal Info', icon: '👤' },
              { id: 'academic', label: 'Academic Details', icon: '📚' },
              { id: 'contact', label: 'Contact & Address', icon: '📞' },
              { id: 'guardian', label: 'Guardian Info', icon: '👨‍👩‍👧' },
              { id: 'documents', label: 'Documents', icon: '📄' },
              { id: 'performance', label: 'Performance', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField label="Full Name" value={student.name} />
              <InfoField label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'} />
              <InfoField label="Gender" value={student.gender || 'N/A'} />
              <InfoField label="Blood Group" value={student.bloodGroup || 'N/A'} />
              <InfoField label="Nationality" value={student.nationality || 'N/A'} />
              <InfoField label="Religion" value={student.religion || 'N/A'} />
              <InfoField label="Category" value={student.category || 'N/A'} />
              <InfoField label="Marital Status" value={student.maritalStatus || 'N/A'} />
              <InfoField label="Languages Known" value={student.languages?.join(', ') || 'N/A'} />
            </div>
          )}

          {/* Academic Details Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoField label="Department" value={student.department} />
                <InfoField label="Program" value={student.program || 'B.Tech'} />
                <InfoField label="Current Year" value={`Year ${student.year}`} />
                <InfoField label="Semester" value={student.semester || 'N/A'} />
                <InfoField label="Section" value={student.section || 'N/A'} />
                <InfoField label="Roll Number" value={student.rollNumber || student.studentId} />
                <InfoField label="Enrollment Date" value={student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'} />
                <InfoField label="Expected Graduation" value={student.expectedGraduation || 'N/A'} />
                <InfoField label="Admission Type" value={student.admissionType || 'N/A'} />
                <InfoField label="Previous Education" value={student.previousEducation || 'N/A'} />
                <InfoField label="Previous Institution" value={student.previousInstitution || 'N/A'} />
                <InfoField label="Previous Percentage" value={student.previousPercentage ? `${student.previousPercentage}%` : 'N/A'} />
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Current Semester Subjects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.subjects?.length > 0 ? (
                    student.subjects.map((subject: string, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-md">
                        <span className="font-medium">{subject}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No subjects assigned</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Email" value={student.email} />
                  <InfoField label="Phone Number" value={student.phone || 'N/A'} />
                  <InfoField label="Alternate Phone" value={student.alternatePhone || 'N/A'} />
                  <InfoField label="Emergency Contact" value={student.emergencyContact || 'N/A'} />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Permanent Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Address Line 1" value={student.permanentAddress?.line1 || 'N/A'} />
                  <InfoField label="Address Line 2" value={student.permanentAddress?.line2 || 'N/A'} />
                  <InfoField label="City" value={student.permanentAddress?.city || 'N/A'} />
                  <InfoField label="State" value={student.permanentAddress?.state || 'N/A'} />
                  <InfoField label="PIN Code" value={student.permanentAddress?.pincode || 'N/A'} />
                  <InfoField label="Country" value={student.permanentAddress?.country || 'N/A'} />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Current Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Address Line 1" value={student.currentAddress?.line1 || 'N/A'} />
                  <InfoField label="Address Line 2" value={student.currentAddress?.line2 || 'N/A'} />
                  <InfoField label="City" value={student.currentAddress?.city || 'N/A'} />
                  <InfoField label="State" value={student.currentAddress?.state || 'N/A'} />
                  <InfoField label="PIN Code" value={student.currentAddress?.pincode || 'N/A'} />
                  <InfoField label="Country" value={student.currentAddress?.country || 'N/A'} />
                </div>
              </div>
            </div>
          )}

          {/* Guardian Info Tab */}
          {activeTab === 'guardian' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Father's Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Father's Name" value={student.fatherName || 'N/A'} />
                  <InfoField label="Occupation" value={student.fatherOccupation || 'N/A'} />
                  <InfoField label="Phone Number" value={student.fatherPhone || 'N/A'} />
                  <InfoField label="Email" value={student.fatherEmail || 'N/A'} />
                  <InfoField label="Annual Income" value={student.fatherIncome || 'N/A'} />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Mother's Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Mother's Name" value={student.motherName || 'N/A'} />
                  <InfoField label="Occupation" value={student.motherOccupation || 'N/A'} />
                  <InfoField label="Phone Number" value={student.motherPhone || 'N/A'} />
                  <InfoField label="Email" value={student.motherEmail || 'N/A'} />
                  <InfoField label="Annual Income" value={student.motherIncome || 'N/A'} />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Guardian Information (if different)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Guardian's Name" value={student.guardianName || 'N/A'} />
                  <InfoField label="Relationship" value={student.guardianRelation || 'N/A'} />
                  <InfoField label="Phone Number" value={student.guardianPhone || 'N/A'} />
                  <InfoField label="Email" value={student.guardianEmail || 'N/A'} />
                  <InfoField label="Occupation" value={student.guardianOccupation || 'N/A'} />
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Aadhar Card', status: student.aadharCard ? 'Uploaded' : 'Not Uploaded' },
                  { name: 'PAN Card', status: student.panCard ? 'Uploaded' : 'Not Uploaded' },
                  { name: '10th Marksheet', status: student.tenthMarksheet ? 'Uploaded' : 'Not Uploaded' },
                  { name: '12th Marksheet', status: student.twelfthMarksheet ? 'Uploaded' : 'Not Uploaded' },
                  { name: 'Transfer Certificate', status: student.transferCertificate ? 'Uploaded' : 'Not Uploaded' },
                  { name: 'Migration Certificate', status: student.migrationCertificate ? 'Uploaded' : 'Not Uploaded' },
                  { name: 'Passport Photo', status: student.photo ? 'Uploaded' : 'Not Uploaded' },
                  { name: 'Signature', status: student.signature ? 'Uploaded' : 'Not Uploaded' },
                ].map((doc, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-md flex justify-between items-center">
                    <span className="font-medium">{doc.name}</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      doc.status === 'Uploaded' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Current CGPA</p>
                  <p className="text-2xl font-bold text-blue-600">{student.cgpa || 'N/A'}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Attendance</p>
                  <p className="text-2xl font-bold text-green-600">{student.attendance || 'N/A'}%</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Credits Earned</p>
                  <p className="text-2xl font-bold text-purple-600">{student.creditsEarned || 'N/A'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Backlogs</p>
                  <p className="text-2xl font-bold text-orange-600">{student.backlogs || 0}</p>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Semester-wise Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SGPA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {student.semesterResults?.length > 0 ? (
                        student.semesterResults.map((result: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              Semester {result.semester}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.sgpa}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.credits}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.attendance}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                result.result === 'Pass' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.result}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No performance data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push('/students')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Students List
        </button>
        <p className="text-sm text-gray-500">
          Last updated: {student.updatedAt ? new Date(student.updatedAt).toLocaleString() : 'N/A'}
        </p>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
      />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}