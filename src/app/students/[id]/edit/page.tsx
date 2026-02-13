'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { studentsAPI, subjectsAPI } from '@/lib/api';

export default function EditStudent() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    year: 1,
    semester: 1,
    rollNumber: '',
    phone: '',
    alternatePhone: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    nationality: 'Indian',
    religion: '',
    category: '',
    maritalStatus: 'Single',
    languages: [] as string[],
    program: 'B.Tech',
    enrollmentDate: '',
    expectedGraduation: '',
    admissionType: 'Regular',
    previousEducation: '',
    previousInstitution: '',
    previousPercentage: '',
    subjects: [] as string[],
    permanentAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    currentAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    sameAsPermanent: false,
    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherIncome: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    motherEmail: '',
    motherIncome: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianOccupation: '',
    cgpa: '',
    attendance: '',
    creditsEarned: '',
    backlogs: 0,
    status: 'active',
    sgpa: {} as Record<number, string>
  });

  const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  const genders = ['Male', 'Female', 'Other'];
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
  const languageOptions = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati'];
  
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    if (formData.department && formData.year) {
      fetchSubjectsForDeptYear(formData.department, formData.year);
    }
  }, [formData.department, formData.year]);

  const fetchSubjectsForDeptYear = async (department: string, year: number) => {
    setLoadingSubjects(true);
    try {
      const response = await subjectsAPI.getByDeptYear(department, year);
      const subjects = response.data.data.subjectGroup?.subjects || [];
      setAvailableSubjects(subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      setAvailableSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await studentsAPI.getById(params.id as string);
        const student = response.data.data.student;
        setFormData({
          name: student.name || '',
          email: student.email || '',
          department: student.department || '',
          year: student.year || 1,
          semester: student.semester || 1,
          rollNumber: student.rollNumber || student.studentId || '',
          phone: student.phone || '',
          alternatePhone: student.alternatePhone || '',
          emergencyContact: student.emergencyContact || '',
          dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
          gender: student.gender || '',
          bloodGroup: student.bloodGroup || '',
          nationality: student.nationality || 'Indian',
          religion: student.religion || '',
          category: student.category || '',
          maritalStatus: student.maritalStatus || 'Single',
          languages: student.languages || [],
          program: student.program || 'B.Tech',
          enrollmentDate: student.enrollmentDate?.split('T')[0] || '',
          expectedGraduation: student.expectedGraduation || '',
          admissionType: student.admissionType || 'Regular',
          previousEducation: student.previousEducation || '',
          previousInstitution: student.previousInstitution || '',
          previousPercentage: student.previousPercentage || '',
          subjects: student.subjects || [],
          permanentAddress: student.permanentAddress || { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
          currentAddress: student.currentAddress || { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
          sameAsPermanent: false,
          fatherName: student.fatherName || '',
          fatherOccupation: student.fatherOccupation || '',
          fatherPhone: student.fatherPhone || '',
          fatherEmail: student.fatherEmail || '',
          fatherIncome: student.fatherIncome || '',
          motherName: student.motherName || '',
          motherOccupation: student.motherOccupation || '',
          motherPhone: student.motherPhone || '',
          motherEmail: student.motherEmail || '',
          motherIncome: student.motherIncome || '',
          guardianName: student.guardianName || '',
          guardianRelation: student.guardianRelation || '',
          guardianPhone: student.guardianPhone || '',
          guardianEmail: student.guardianEmail || '',
          guardianOccupation: student.guardianOccupation || '',
          cgpa: student.cgpa || '',
          attendance: student.attendance || '',
          creditsEarned: student.creditsEarned || '',
          backlogs: student.backlogs || 0,
          status: student.status || 'active',
          sgpa: student.sgpa || {}
        });
      } catch (error) {
        console.error('Failed to fetch student:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('Submitting form data:', formData);
      await studentsAPI.update(params.id as string, formData);
      router.push('/students');
    } catch (error: any) {
      console.error('Failed to update student:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to update student: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handleSubjectToggle = (subjectName: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectName)
        ? prev.subjects.filter(s => s !== subjectName)
        : [...prev.subjects, subjectName]
    }));
  };

  const copySameAddress = () => {
    setFormData(prev => ({
      ...prev,
      currentAddress: { ...prev.permanentAddress },
      sameAsPermanent: true
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Student Information</h1>
        <p className="text-gray-600 mt-2">Update comprehensive student details</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'personal', label: 'Personal Info', icon: '👤' },
              { id: 'academic', label: 'Academic', icon: '📚' },
              { id: 'contact', label: 'Contact & Address', icon: '📍' },
              { id: 'guardian', label: 'Guardian', icon: '👨‍👩‍👧' },
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

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                    <input type="date" required value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                    <select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Gender</option>
                      {genders.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                    <select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                    <select value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Religion</option>
                      {religions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                    <select value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                  <div className="flex flex-wrap gap-2">
                    {languageOptions.map(lang => (
                      <button key={lang} type="button" onClick={() => handleLanguageToggle(lang)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.languages.includes(lang) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number *</label>
                    <input type="text" required value={formData.rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <select required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Department</option>
                      {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                    <select value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="BE">BE</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="ME">ME</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="M.Sc">M.Sc</option>
                      <option value="MBA">MBA</option>
                      <option value="BBA">BBA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                    <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                    <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Date</label>
                    <input type="date" value={formData.enrollmentDate} onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Graduation</label>
                    <input type="text" value={formData.expectedGraduation} onChange={(e) => setFormData({ ...formData, expectedGraduation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2025" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admission Type</label>
                    <select value={formData.admissionType} onChange={(e) => setFormData({ ...formData, admissionType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Regular">Regular</option>
                      <option value="Lateral Entry">Lateral Entry</option>
                      <option value="Management Quota">Management Quota</option>
                      <option value="NRI Quota">NRI Quota</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previous Education</label>
                    <input type="text" value={formData.previousEducation} onChange={(e) => setFormData({ ...formData, previousEducation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12th, Diploma..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previous Institution</label>
                    <input type="text" value={formData.previousInstitution} onChange={(e) => setFormData({ ...formData, previousInstitution: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previous Percentage</label>
                    <input type="number" step="0.01" value={formData.previousPercentage} onChange={(e) => setFormData({ ...formData, previousPercentage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="85.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Semester Subjects ({formData.department} - Year {formData.year})
                  </label>
                  {loadingSubjects ? (
                    <div className="text-center py-4 text-gray-500">Loading subjects...</div>
                  ) : availableSubjects.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {availableSubjects.map((subject: any) => (
                          <button 
                            key={subject.code} 
                            type="button" 
                            onClick={() => handleSubjectToggle(subject.name)} 
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              formData.subjects.includes(subject.name) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-bold">{subject.code}</span>
                              <span className="text-xs">{subject.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Subjects are assigned by admin for {formData.department} Year {formData.year}</p>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-sm text-yellow-800">
                        No subjects assigned for {formData.department} Year {formData.year}. 
                        <br />
                        Please contact admin to assign subjects via Subject Management.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
                      <input type="tel" value={formData.alternatePhone} onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                      <input type="tel" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Permanent Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                      <input type="text" value={formData.permanentAddress.line1} onChange={(e) => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, line1: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                      <input type="text" value={formData.permanentAddress.line2} onChange={(e) => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, line2: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input type="text" value={formData.permanentAddress.city} onChange={(e) => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, city: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input type="text" value={formData.permanentAddress.state} onChange={(e) => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, state: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                      <input type="text" value={formData.permanentAddress.pincode} onChange={(e) => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, pincode: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input type="text" value={formData.permanentAddress.country} onChange={(e) => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, country: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Current Address</h3>
                    <button type="button" onClick={copySameAddress} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Same as Permanent Address
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                      <input type="text" value={formData.currentAddress.line1} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, line1: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                      <input type="text" value={formData.currentAddress.line2} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, line2: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input type="text" value={formData.currentAddress.city} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, city: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input type="text" value={formData.currentAddress.state} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, state: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                      <input type="text" value={formData.currentAddress.pincode} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, pincode: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input type="text" value={formData.currentAddress.country} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, country: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'guardian' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Father's Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
                      <input type="text" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                      <input type="text" value={formData.fatherOccupation} onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input type="tel" value={formData.fatherPhone} onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" value={formData.fatherEmail} onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
                      <input type="text" value={formData.fatherIncome} onChange={(e) => setFormData({ ...formData, fatherIncome: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="₹5,00,000" />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Mother's Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name</label>
                      <input type="text" value={formData.motherName} onChange={(e) => setFormData({ ...formData, motherName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                      <input type="text" value={formData.motherOccupation} onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input type="tel" value={formData.motherPhone} onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" value={formData.motherEmail} onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
                      <input type="text" value={formData.motherIncome} onChange={(e) => setFormData({ ...formData, motherIncome: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="₹3,00,000" />
                    </div>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Guardian Information (if different)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Guardian's Name</label>
                      <input type="text" value={formData.guardianName} onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <input type="text" value={formData.guardianRelation} onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Uncle, Aunt..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input type="tel" value={formData.guardianPhone} onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" value={formData.guardianEmail} onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                      <input type="text" value={formData.guardianOccupation} onChange={(e) => setFormData({ ...formData, guardianOccupation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current CGPA</label>
                    <input type="number" step="0.01" min="0" max="10" value={formData.cgpa} onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="8.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attendance (%)</label>
                    <input type="number" min="0" max="100" value={formData.attendance} onChange={(e) => setFormData({ ...formData, attendance: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="85" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credits Earned</label>
                    <input type="number" value={formData.creditsEarned} onChange={(e) => setFormData({ ...formData, creditsEarned: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="120" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backlogs</label>
                    <input type="number" min="0" value={formData.backlogs} onChange={(e) => setFormData({ ...formData, backlogs: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">SGPA by Semester</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: formData.year * 2 }, (_, i) => i + 1).map(sem => (
                      <div key={sem}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Semester {sem}</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          max="10" 
                          value={formData.sgpa[sem] || ''} 
                          onChange={(e) => setFormData({ ...formData, sgpa: { ...formData.sgpa, [sem]: e.target.value } })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="8.5" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
            <button type="button" onClick={() => router.push('/students')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium">
              Cancel
            </button>
            <div className="flex space-x-3">
              <button type="button" onClick={() => router.push(`/students/${params.id}`)} className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium">
                View Details
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center space-x-2">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Update Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
