'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { studentsAPI, subjectsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CustomDropdown from '@/components/ui/CustomDropdown';

const DEPARTMENT_CODE_MAP: Record<string, string> = {
  CS: 'Computer Science',
  IT: 'Information Technology',
  EC: 'Electrical and Communication Engineering',
  ECE: 'Electrical and Communication Engineering',
  EE: 'Electrical and Electronic Engineering',
  EEE: 'Electrical and Electronic Engineering',
  ME: 'Mechanical',
  CE: 'Civil',
  BT: 'Biotechnology',
};

const detectDepartmentFromRegisterNumber = (value: string) => {
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const found = upper.match(/[A-Z]{2}/);
  if (!found) return '';
  return DEPARTMENT_CODE_MAP[found[0]] || '';
};

export default function EditStudent() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [uploadingDoc, setUploadingDoc] = useState('');
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
    aadharCard: '',
    aadharCardName: '',
    aadharCardUploadedAt: '',
    panCard: '',
    panCardName: '',
    panCardUploadedAt: '',
    tenthMarksheet: '',
    tenthMarksheetName: '',
    tenthMarksheetUploadedAt: '',
    twelfthMarksheet: '',
    twelfthMarksheetName: '',
    twelfthMarksheetUploadedAt: '',
    transferCertificate: '',
    transferCertificateName: '',
    transferCertificateUploadedAt: '',
    migrationCertificate: '',
    migrationCertificateName: '',
    migrationCertificateUploadedAt: '',
    photo: '',
    photoName: '',
    photoUploadedAt: '',
    signature: '',
    signatureName: '',
    signatureUploadedAt: '',
    cgpa: '',
    attendance: '',
    creditsEarned: '',
    backlogs: 0,
    status: 'active',
    sgpa: {} as Record<number, string>
  });

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electrical and Communication Engineering',
    'Electrical and Electronic Engineering',
    'Mechanical',
    'Civil',
    'Biotechnology'
  ];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  const genders = ['Male', 'Female', 'Other'];
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
  const languageOptions = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati'];
  const documentFields = [
    { key: 'aadharCard', name: 'Aadhar Card' },
    { key: 'panCard', name: 'PAN Card' },
    { key: 'tenthMarksheet', name: '10th Marksheet' },
    { key: 'twelfthMarksheet', name: '12th Marksheet' },
    { key: 'transferCertificate', name: 'Transfer Certificate' },
    { key: 'migrationCertificate', name: 'Migration Certificate' },
    { key: 'photo', name: 'Passport Photo' },
    { key: 'signature', name: 'Signature' },
  ] as const;
  
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin' && user?.role !== 'faculty') {
      router.push(`/students/${params.id}`);
    }
  }, [authLoading, params.id, router, user?.role]);

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
          aadharCard: student.aadharCard || '',
          aadharCardName: student.aadharCardName || '',
          aadharCardUploadedAt: student.aadharCardUploadedAt || '',
          panCard: student.panCard || '',
          panCardName: student.panCardName || '',
          panCardUploadedAt: student.panCardUploadedAt || '',
          tenthMarksheet: student.tenthMarksheet || '',
          tenthMarksheetName: student.tenthMarksheetName || '',
          tenthMarksheetUploadedAt: student.tenthMarksheetUploadedAt || '',
          twelfthMarksheet: student.twelfthMarksheet || '',
          twelfthMarksheetName: student.twelfthMarksheetName || '',
          twelfthMarksheetUploadedAt: student.twelfthMarksheetUploadedAt || '',
          transferCertificate: student.transferCertificate || '',
          transferCertificateName: student.transferCertificateName || '',
          transferCertificateUploadedAt: student.transferCertificateUploadedAt || '',
          migrationCertificate: student.migrationCertificate || '',
          migrationCertificateName: student.migrationCertificateName || '',
          migrationCertificateUploadedAt: student.migrationCertificateUploadedAt || '',
          photo: student.photo || '',
          photoName: student.photoName || '',
          photoUploadedAt: student.photoUploadedAt || '',
          signature: student.signature || '',
          signatureName: student.signatureName || '',
          signatureUploadedAt: student.signatureUploadedAt || '',
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

  const handleDocumentUpload = async (field: (typeof documentFields)[number]['key'], file: File | null) => {
    if (!file) return;
    setUploadingDoc(field);

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileData = reader.result as string;
      setFormData((prev) => {
        const next = { ...prev } as any;
        next[field] = fileData;
        next[`${field}Name`] = file.name;
        next[`${field}UploadedAt`] = new Date().toISOString();
        return next;
      });
      setUploadingDoc('');
    };
    reader.onerror = () => {
      setUploadingDoc('');
      alert('Failed to read selected file');
    };
    reader.readAsDataURL(file);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Student Information</h1>
        <p className="text-gray-600 mt-2">Update comprehensive student details</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-6 px-4 sm:px-6 min-w-max" aria-label="Tabs">
            {[
              { id: 'personal', label: 'Personal Info' },
              { id: 'academic', label: 'Academic' },
              { id: 'contact', label: 'Contact & Address' },
              { id: 'guardian', label: 'Guardian' },
              { id: 'documents', label: 'Documents' },
              { id: 'performance', label: 'Performance' },
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
                    <CustomDropdown
                      value={formData.gender}
                      onChange={(value) => setFormData({ ...formData, gender: value })}
                      placeholder="Select Gender"
                      options={[
                        { value: '', label: 'Select Gender' },
                        ...genders.map((g) => ({ value: g, label: g })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                    <CustomDropdown
                      value={formData.bloodGroup}
                      onChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                      placeholder="Select Blood Group"
                      options={[
                        { value: '', label: 'Select Blood Group' },
                        ...bloodGroups.map((bg) => ({ value: bg, label: bg })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                    <CustomDropdown
                      value={formData.religion}
                      onChange={(value) => setFormData({ ...formData, religion: value })}
                      placeholder="Select Religion"
                      options={[
                        { value: '', label: 'Select Religion' },
                        ...religions.map((r) => ({ value: r, label: r })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <CustomDropdown
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value })}
                      placeholder="Select Category"
                      options={[
                        { value: '', label: 'Select Category' },
                        ...categories.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                    <CustomDropdown
                      value={formData.maritalStatus}
                      onChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                      options={[
                        { value: 'Single', label: 'Single' },
                        { value: 'Married', label: 'Married' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <CustomDropdown
                      value={formData.status}
                      onChange={(value) => setFormData({ ...formData, status: value })}
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'suspended', label: 'Suspended' },
                        { value: 'graduated', label: 'Graduated' },
                      ]}
                    />
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
                    <input
                      type="text"
                      required
                      value={formData.rollNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        const detectedDepartment = detectDepartmentFromRegisterNumber(value);
                        setFormData({
                          ...formData,
                          rollNumber: value,
                          department: detectedDepartment || formData.department
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: <span className="font-mono">7376241CS515</span> → CS maps to Computer Science
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <CustomDropdown
                      value={formData.department}
                      onChange={(value) => setFormData({ ...formData, department: value })}
                      placeholder="Select Department"
                      options={[
                        { value: '', label: 'Select Department' },
                        ...departments.map((dept) => ({ value: dept, label: dept })),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                    <CustomDropdown
                      value={formData.program}
                      onChange={(value) => setFormData({ ...formData, program: value })}
                      options={[
                        { value: 'BE', label: 'BE' },
                        { value: 'B.Tech', label: 'B.Tech' },
                        { value: 'M.Tech', label: 'M.Tech' },
                        { value: 'ME', label: 'ME' },
                        { value: 'BCA', label: 'BCA' },
                        { value: 'MCA', label: 'MCA' },
                        { value: 'B.Sc', label: 'B.Sc' },
                        { value: 'M.Sc', label: 'M.Sc' },
                        { value: 'MBA', label: 'MBA' },
                        { value: 'BBA', label: 'BBA' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                    <CustomDropdown
                      value={String(formData.year)}
                      onChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                      options={[
                        { value: '1', label: 'Year 1' },
                        { value: '2', label: 'Year 2' },
                        { value: '3', label: 'Year 3' },
                        { value: '4', label: 'Year 4' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                    <CustomDropdown
                      value={String(formData.semester)}
                      onChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}
                      options={[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({ value: String(sem), label: `Semester ${sem}` }))}
                    />
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
                    <CustomDropdown
                      value={formData.admissionType}
                      onChange={(value) => setFormData({ ...formData, admissionType: value })}
                      options={[
                        { value: 'Regular', label: 'Regular' },
                        { value: 'Lateral Entry', label: 'Lateral Entry' },
                        { value: 'Management Quota', label: 'Management Quota' },
                        { value: 'NRI Quota', label: 'NRI Quota' },
                      ]}
                    />
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

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Certificates & Documents</h3>
                  <p className="text-sm text-gray-600">Upload or replace student certificates. Files are saved when you click Update Student.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentFields.map((doc) => {
                    const isUploaded = Boolean(formData[doc.key as keyof typeof formData]);
                    const fileName = formData[`${doc.key}Name` as keyof typeof formData] as string;
                    const uploadedAt = formData[`${doc.key}UploadedAt` as keyof typeof formData] as string;
                    return (
                      <div key={doc.key} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isUploaded ? 'Uploaded' : 'Not uploaded'}
                          </span>
                        </div>
                        <input
                          type="file"
                          className="w-full text-sm"
                          onChange={(e) => handleDocumentUpload(doc.key, e.target.files?.[0] || null)}
                        />
                        {uploadingDoc === doc.key && <p className="text-xs text-blue-600">Reading file...</p>}
                        {fileName && <p className="text-xs text-gray-500 truncate">File: {fileName}</p>}
                        {uploadedAt && <p className="text-xs text-gray-500">Updated: {new Date(uploadedAt).toLocaleString()}</p>}
                        {isUploaded && (
                          <a
                            href={formData[doc.key as keyof typeof formData] as string}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-sm text-blue-600 hover:text-blue-700"
                          >
                            View file
                          </a>
                        )}
                      </div>
                    );
                  })}
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

          <div className="border-t px-4 sm:px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <button type="button" onClick={() => router.push('/students')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium">
              Cancel
            </button>
            <div className="flex flex-wrap gap-3">
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
                  <span>Update Student</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
