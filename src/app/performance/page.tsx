'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { performanceAPI, studentsAPI } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import SuccessToast from '@/components/SuccessToast';
import { useAuth } from '@/context/AuthContext';
import CustomDropdown from '@/components/ui/CustomDropdown';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function Performance() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrefillApplied = useRef(false);
  const isMountedRef = useRef(true);
  const studentProfileRequestIdRef = useRef(0);
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
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({
    studentId: '',
    subjectId: '',
    attendancePercentage: '',
    marks: '',
    semester: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<'studentName' | 'subjectName' | 'attendancePercentage' | 'marks' | 'grade' | 'semester' | 'lastUpdated'>('lastUpdated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [serverPagination, setServerPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, limit: 10 });
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [isBootstrappingMissing, setIsBootstrappingMissing] = useState(false);
  const [missingSearch, setMissingSearch] = useState('');
  const [missingMeta, setMissingMeta] = useState({
    totalStudentsScanned: 0,
    totalMissing: 0,
    finalYearMissing: 0,
    noEligibleSubjects: 0,
  });
  const [missingDetailsById, setMissingDetailsById] = useState<Record<string, { eligibleSubjectCount: number; reasons: string[] }>>({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    subjectName: '',
    attendancePercentage: '',
    marks: '',
    semester: ''
  });

  const computedGrade = useMemo(() => {
    const marks = Number(formData.marks || 0);
    if (marks >= 90) return 'A';
    if (marks >= 80) return 'B';
    if (marks >= 70) return 'C';
    if (marks >= 60) return 'D';
    return 'F';
  }, [formData.marks]);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchMissingSummary();
  }, []);

  useEffect(() => {
    if (showForm) fetchStudents();
  }, [showForm]);

  useEffect(() => {
    fetchRecords();
  }, [page, searchQuery, departmentFilter, semesterFilter, subjectFilter, atRiskOnly, dateFrom, dateTo, sortKey, sortDir]);

  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return;
      fetchStudents();
      fetchRecords();
      fetchMissingSummary();
    };
    const intervalId = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    if (initialPrefillApplied.current) return;
    const studentIdFromQuery = String(searchParams.get('studentId') || '').trim();
    const openFormFromQuery = String(searchParams.get('openForm') || '').trim() === '1';
    if (!studentIdFromQuery) {
      initialPrefillApplied.current = true;
      return;
    }
    if (!students.length) return;

    const exists = students.some((student) => String(student._id) === studentIdFromQuery);
    if (!exists) {
      initialPrefillApplied.current = true;
      return;
    }

    if (openFormFromQuery) setShowForm(true);
    handleStudentChange(studentIdFromQuery);
    initialPrefillApplied.current = true;
  }, [searchParams, students]);

  const fetchRecords = async () => {
    try {
      const response = await performanceAPI.getAll({
        page,
        limit: 10,
        search: searchQuery || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        semester: semesterFilter !== 'all' ? semesterFilter : undefined,
        subject: subjectFilter !== 'all' ? subjectFilter : undefined,
        atRiskOnly: atRiskOnly || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        sortBy: sortKey,
        sortDir,
      });
      const populatedRecords = response.data.data.records.map((record: any) => ({
        ...record,
        studentName: record.studentId?.name || 'Unknown',
        studentCode: record.studentId?.studentId || 'N/A',
        department: record.studentId?.department || 'N/A',
        year: record.studentId?.year || 'N/A'
      }));
      if (!isMountedRef.current) return;
      setRecords(populatedRecords);
      setServerPagination(response.data.data.pagination || { currentPage: 1, totalPages: 1, totalRecords: populatedRecords.length, limit: 10 });
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll({ limit: 1000 });
      if (!isMountedRef.current) return;
      setStudents(response.data.data.students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchMissingSummary = async () => {
    try {
      const response = await performanceAPI.getMissingSummary({ limit: 400 });
      const data = response.data?.data;
      if (!isMountedRef.current || !data) return;
      setMissingMeta({
        totalStudentsScanned: Number(data.summary?.totalStudentsScanned || 0),
        totalMissing: Number(data.summary?.totalMissing || 0),
        finalYearMissing: Number(data.summary?.finalYearMissing || 0),
        noEligibleSubjects: Number(data.summary?.noEligibleSubjects || 0),
      });
      const detailMap: Record<string, { eligibleSubjectCount: number; reasons: string[] }> = {};
      for (const row of data.students || []) {
        detailMap[String(row._id)] = {
          eligibleSubjectCount: Number(row.eligibleSubjectCount || 0),
          reasons: Array.isArray(row.reasons) ? row.reasons : [],
        };
      }
      setMissingDetailsById(detailMap);
    } catch (error) {
      console.error('Failed to fetch missing performance summary:', error);
    }
  };

  const departmentOptions = useMemo(
    () => ['all', ...Array.from(new Set(students.map((s) => s.department).filter(Boolean))).sort()],
    [students]
  );

  const semesterFilterOptions = useMemo(
    () => ['all', ...Array.from(new Set(records.map((r) => r.semester).filter(Boolean))).sort()],
    [records]
  );

  const subjectOptions = useMemo(
    () => ['all', ...Array.from(new Set(records.map((r) => r.subjectName).filter(Boolean))).sort()],
    [records]
  );

  const filteredRecords = useMemo(() => records, [records]);
  const sortedRecords = useMemo(() => records, [records]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, departmentFilter, semesterFilter, subjectFilter, atRiskOnly, dateFrom, dateTo]);

  const totalPages = Math.max(1, serverPagination.totalPages || 1);
  const paginatedRecords = useMemo(() => records, [records]);

  const metrics = useMemo(() => {
    if (!filteredRecords.length) return { avgMarks: 0, avgAttendance: 0, atRiskPercent: 0, passRate: 0, topSubject: 'N/A', totalStudents: 0 };
    const totalMarks = filteredRecords.reduce((sum, r) => sum + Number(r.marks || 0), 0);
    const totalAttendance = filteredRecords.reduce((sum, r) => sum + Number(r.attendancePercentage || 0), 0);
    const atRisk = filteredRecords.filter((r) => Number(r.attendancePercentage) < 75 || Number(r.marks) < 60).length;
    const pass = filteredRecords.filter((r) => Number(r.marks) >= 60).length;
    const subjectAvg = new Map<string, { total: number; count: number }>();
    filteredRecords.forEach((r) => {
      const curr = subjectAvg.get(r.subjectName) || { total: 0, count: 0 };
      subjectAvg.set(r.subjectName, { total: curr.total + Number(r.marks || 0), count: curr.count + 1 });
    });
    let topSubject = 'N/A';
    let best = -1;
    subjectAvg.forEach((v, k) => {
      const avg = v.total / v.count;
      if (avg > best) {
        best = avg;
        topSubject = k;
      }
    });
    return {
      avgMarks: totalMarks / filteredRecords.length,
      avgAttendance: totalAttendance / filteredRecords.length,
      atRiskPercent: (atRisk / filteredRecords.length) * 100,
      passRate: (pass / filteredRecords.length) * 100,
      topSubject,
      totalStudents: new Set(filteredRecords.map((r) => r.studentObjectId || r.studentId?._id || r.studentId)).size
    };
  }, [filteredRecords]);

  const trendData = useMemo(() => {
    const grouped = new Map<string, { marks: number; attendance: number; count: number }>();
    filteredRecords.forEach((r) => {
      const key = new Date(r.lastUpdated || Date.now()).toISOString().slice(0, 10);
      const curr = grouped.get(key) || { marks: 0, attendance: 0, count: 0 };
      grouped.set(key, {
        marks: curr.marks + Number(r.marks || 0),
        attendance: curr.attendance + Number(r.attendancePercentage || 0),
        count: curr.count + 1
      });
    });
    const points = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
    return {
      labels: points.map(([d]) => new Date(d).toLocaleDateString()),
      datasets: [
        { label: 'Avg Marks', data: points.map(([, v]) => Number((v.marks / v.count).toFixed(2))), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)', tension: 0.35 },
        { label: 'Avg Attendance', data: points.map(([, v]) => Number((v.attendance / v.count).toFixed(2))), borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.2)', tension: 0.35 }
      ]
    };
  }, [filteredRecords]);

  const subjectBarData = useMemo(() => {
    const grouped = new Map<string, { marks: number; count: number }>();
    filteredRecords.forEach((r) => {
      const curr = grouped.get(r.subjectName) || { marks: 0, count: 0 };
      grouped.set(r.subjectName, { marks: curr.marks + Number(r.marks || 0), count: curr.count + 1 });
    });
    const top = Array.from(grouped.entries())
      .map(([name, v]) => ({ name, avg: v.marks / v.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
    return {
      labels: top.map((i) => i.name),
      datasets: [{ label: 'Avg Marks by Subject', data: top.map((i) => Number(i.avg.toFixed(2))), backgroundColor: 'rgba(234,88,12,0.75)' }]
    };
  }, [filteredRecords]);

  const weeklyRisk = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const recent = records.filter((r) => new Date(r.lastUpdated || Date.now()) >= weekStart);
    const byStudent = new Map<string, any[]>();
    recent.forEach((r) => {
      const key = String(r.studentObjectId || r.studentId?._id || r.studentId);
      byStudent.set(key, [...(byStudent.get(key) || []), r]);
    });
    return Array.from(byStudent.entries()).map(([id, arr]) => {
      const ordered = [...arr].sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());
      const latest = ordered[0];
      const prev = ordered[1];
      const reasons: string[] = [];
      if (Number(latest.attendancePercentage) < 75) reasons.push(`Low attendance (${Number(latest.attendancePercentage).toFixed(1)}%)`);
      if (Number(latest.marks) < 60) reasons.push(`Low marks (${Number(latest.marks).toFixed(1)})`);
      if (prev && Number(prev.marks) - Number(latest.marks) >= 10) reasons.push(`Marks dropped by ${(Number(prev.marks) - Number(latest.marks)).toFixed(1)} points`);
      return { id, studentName: latest.studentName, studentCode: latest.studentCode, reasons, marks: Number(latest.marks), attendance: Number(latest.attendancePercentage) };
    }).filter((x) => x.reasons.length).sort((a, b) => b.reasons.length - a.reasons.length || a.marks - b.marks).slice(0, 6);
  }, [records]);

  const studentsWithoutPerformance = useMemo(() => {
    const hasPerformance = new Set(
      records.map((record) => String(record.studentObjectId || record.studentId?._id || record.studentId))
    );
    return students.filter((student) => !hasPerformance.has(String(student._id)));
  }, [students, records]);

  const filteredMissingStudents = useMemo(() => {
    const q = missingSearch.trim().toLowerCase();
    if (!q) return studentsWithoutPerformance;
    return studentsWithoutPerformance.filter((student) =>
      String(student.name || '').toLowerCase().includes(q)
      || String(student.studentId || '').toLowerCase().includes(q)
      || String(student.department || '').toLowerCase().includes(q)
    );
  }, [missingSearch, studentsWithoutPerformance]);

  const missingByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    for (const student of studentsWithoutPerformance) {
      const key = String(student.department || 'Unknown');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [studentsWithoutPerformance]);

  const handleStudentChange = async (studentId: string, preferredSemester?: string, preferredSubjectId?: string) => {
    const requestId = studentProfileRequestIdRef.current + 1;
    studentProfileRequestIdRef.current = requestId;
    if (!studentId) {
      setSelectedStudent(null);
      setAssignedSubjects([]);
      setFormData((prev) => ({ ...prev, studentId: '', subjectId: '', subjectName: '', semester: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, studentId, subjectId: '', subjectName: '' }));
    setLoading(true);
    
    try {
      const [profileResponse, subjectResponse] = await Promise.all([
        studentsAPI.getProfile(studentId),
        studentsAPI.getSubjects(studentId),
      ]);
      const profile = profileResponse.data?.data;
      const student = profile?.student || students.find((s) => s._id === studentId);
      const subjects = subjectResponse.data?.data?.subjects || profile?.eligibleSubjects || [];

      if (!isMountedRef.current || studentProfileRequestIdRef.current !== requestId) return;
      if (student) {
        setSelectedStudent(student);
        setAssignedSubjects(subjects);
        const inferredSem = student?.semester ? `Semester ${student.semester}` : '';
        const preferredSem = String(preferredSemester || '').trim() || String(profile?.semester?.label || student.currentSemester || inferredSem).trim();
        const selectedSubject = subjects.find((s: any) => String(s._id) === String(preferredSubjectId || ''));
        setFormData((prev) => ({
          ...prev,
          semester: preferredSem || prev.semester,
          subjectId: selectedSubject ? String(selectedSubject._id) : '',
          subjectName: selectedSubject ? String(selectedSubject.subjectName || selectedSubject.name || '') : ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error);
    } finally {
      if (!isMountedRef.current || studentProfileRequestIdRef.current !== requestId) return;
      setLoading(false);
    }
  };

  const validateForm = () => {
    const next = { studentId: '', subjectId: '', attendancePercentage: '', marks: '', semester: '' };
    if (!formData.studentId) next.studentId = 'Please select a student';
    if (!formData.subjectId.trim()) next.subjectId = 'Subject is required';
    if (!formData.semester.trim()) next.semester = 'Semester is required';
    const attendance = Number(formData.attendancePercentage);
    const marks = Number(formData.marks);
    if (!Number.isFinite(attendance) || attendance < 0 || attendance > 100) next.attendancePercentage = 'Attendance must be 0-100';
    if (!Number.isFinite(marks) || marks < 0 || marks > 100) next.marks = 'Marks must be 0-100';
    setFormErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const resetForm = () => {
    setFormData({ studentId: '', subjectId: '', subjectName: '', attendancePercentage: '', marks: '', semester: '' });
    setFormErrors({ studentId: '', subjectId: '', attendancePercentage: '', marks: '', semester: '' });
    setSelectedStudent(null);
    setAssignedSubjects([]);
    setEditingRecordId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const duplicate = records.find((r) =>
      r._id !== editingRecordId &&
      String(r.studentObjectId || r.studentId?._id || r.studentId) === formData.studentId &&
      (String(r.subjectId?._id || r.subjectId || '') === formData.subjectId ||
        String(r.subjectName).toLowerCase() === formData.subjectName.trim().toLowerCase()) &&
      String(r.semester).toLowerCase() === formData.semester.trim().toLowerCase()
    );
    if (duplicate) {
      setErrorMessage('Performance record already exists for this student, subject, and semester');
      setShowErrorToast(true);
      return;
    }

    const payload = {
      studentId: formData.studentId,
      subjectId: formData.subjectId,
      subjectName: formData.subjectName.trim(),
      attendancePercentage: Number(formData.attendancePercentage),
      marks: Number(formData.marks)
    };

    setLoading(true);
    if (editingRecordId) {
      const backup = records;
      const optimistic = {
        _id: editingRecordId,
        studentObjectId: selectedStudent?._id || formData.studentId,
        studentName: selectedStudent?.name || 'Unknown',
        studentCode: selectedStudent?.studentId || 'N/A',
        department: selectedStudent?.department || 'N/A',
        year: selectedStudent?.year || 'N/A',
        subjectName: payload.subjectName,
        attendancePercentage: payload.attendancePercentage,
        marks: payload.marks,
        grade: computedGrade,
        semester: formData.semester,
        lastUpdated: new Date().toISOString()
      };
      setRecords((prev) => prev.map((r) => (r._id === editingRecordId ? optimistic : r)));
      try {
        const response = await performanceAPI.update(editingRecordId, payload);
        const updated = response.data?.data ? {
          ...optimistic,
          ...response.data.data,
          studentObjectId: optimistic.studentObjectId,
          studentName: optimistic.studentName,
          studentCode: optimistic.studentCode,
          department: optimistic.department,
          year: optimistic.year
        } : optimistic;
        setRecords((prev) => prev.map((r) => (r._id === editingRecordId ? updated : r)));
        setSuccessMessage('Performance record updated successfully!');
        setShowSuccessToast(true);
        setShowForm(false);
        resetForm();
      } catch (error: any) {
        setRecords(backup);
        setErrorMessage(error.response?.data?.error || 'Failed to update record');
        setShowErrorToast(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      studentObjectId: selectedStudent?._id || formData.studentId,
      studentName: selectedStudent?.name || 'Unknown',
      studentCode: selectedStudent?.studentId || 'N/A',
      department: selectedStudent?.department || 'N/A',
      year: selectedStudent?.year || 'N/A',
      subjectName: payload.subjectName,
      attendancePercentage: payload.attendancePercentage,
      marks: payload.marks,
      grade: computedGrade,
      semester: formData.semester,
      lastUpdated: new Date().toISOString()
    };
    setRecords((prev) => [optimistic, ...prev]);
    try {
      const response = await performanceAPI.create(payload);
      const created = response.data?.data ? {
        ...optimistic,
        ...response.data.data,
        studentObjectId: optimistic.studentObjectId,
        studentName: optimistic.studentName,
        studentCode: optimistic.studentCode,
        department: optimistic.department,
        year: optimistic.year
      } : optimistic;
      setRecords((prev) => prev.map((r) => (r._id === tempId ? created : r)));
      setSuccessMessage('Performance record created successfully!');
      setShowSuccessToast(true);
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      setRecords((prev) => prev.filter((r) => r._id !== tempId));
      setErrorMessage(error.response?.data?.error || 'Failed to create record');
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Performance Record?',
      message: `Are you sure you want to delete the performance record for ${record.studentName} in ${record.subjectName}? This action cannot be undone.`,
      onConfirm: async () => {
        const backup = records;
        setIsDeleting(true);
        setRecords((prev) => prev.filter((item) => item._id !== record._id));
        try {
          await performanceAPI.delete(record._id);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setSuccessMessage('Performance record deleted successfully!');
          setShowSuccessToast(true);
        } catch (error) {
          setRecords(backup);
          setErrorMessage('Failed to delete record');
          setShowErrorToast(true);
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleEdit = async (record: any) => {
    setEditingRecordId(record._id);
    setShowForm(true);
    setFormData({
      studentId: String(record.studentObjectId || record.studentId?._id || record.studentId),
      subjectId: String(record.subjectId?._id || record.subjectId || ''),
      subjectName: record.subjectName,
      attendancePercentage: String(record.attendancePercentage),
      marks: String(record.marks),
      semester: record.semester
    });
    await handleStudentChange(
      String(record.studentObjectId || record.studentId?._id || record.studentId),
      String(record.semester || ''),
      String(record.subjectId?._id || record.subjectId || '')
    );
  };

  const handleQuickAddForStudent = async (studentId: string) => {
    setShowForm(true);
    await handleStudentChange(studentId);
  };

  const generateSampleData = async () => {
    const candidates = studentsWithoutPerformance.length ? studentsWithoutPerformance : students;
    if (!candidates.length) {
      setErrorMessage('No students available for sample data');
      setShowErrorToast(true);
      return;
    }
    setIsGeneratingSamples(true);
    let created = 0;
    for (const student of candidates.slice(0, 5)) {
      let eligible: any[] = [];
      try {
        const resp = await studentsAPI.getSubjects(String(student._id));
        eligible = resp.data?.data?.subjects || [];
      } catch {}
      if (!eligible.length) continue;
      for (let i = 0; i < 2; i += 1) {
        const chosen = eligible[Math.floor(Math.random() * eligible.length)];
        try {
          await performanceAPI.create({
            studentId: student._id,
            subjectId: String(chosen._id),
            subjectName: String(chosen.subjectName || chosen.name || ''),
            attendancePercentage: 60 + Math.floor(Math.random() * 40),
            marks: 55 + Math.floor(Math.random() * 45)
          });
          created += 1;
        } catch {}
      }
    }
    await fetchRecords();
    await fetchMissingSummary();
    if (!isMountedRef.current) return;
    setIsGeneratingSamples(false);
    if (created > 0) {
      setSuccessMessage(`Added ${created} sample records`);
      setShowSuccessToast(true);
    } else {
      setErrorMessage('No sample records added (likely duplicates)');
      setShowErrorToast(true);
    }
  };

  const handleBootstrapMissing = async () => {
    const targetIds = filteredMissingStudents.slice(0, 30).map((student) => String(student._id));
    if (!targetIds.length) {
      setErrorMessage('No missing students found for current filter');
      setShowErrorToast(true);
      return;
    }
    setIsBootstrappingMissing(true);
    try {
      const response = await performanceAPI.bootstrapMissing({
        studentIds: targetIds,
        perStudentMaxSubjects: 1,
        marks: 70,
        attendancePercentage: 85,
      });
      const created = Number(response.data?.data?.recordsCreated || 0);
      const candidates = Number(response.data?.data?.candidates || targetIds.length);
      setSuccessMessage(`Baseline created for ${created} record(s) from ${candidates} missing student(s).`);
      setShowSuccessToast(true);
      await Promise.all([fetchRecords(), fetchStudents(), fetchMissingSummary()]);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to auto-create missing baseline records');
      setShowErrorToast(true);
    } finally {
      if (!isMountedRef.current) return;
      setIsBootstrappingMissing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Performance Management</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => {
            if (!sortedRecords.length) return;
            const head = ['Student', 'Code', 'Department', 'Subject', 'Attendance', 'Marks', 'Grade', 'Semester', 'Updated'];
            const rows = sortedRecords.map((r) => [r.studentName, r.studentCode, r.department, r.subjectName, r.attendancePercentage, r.marks, r.grade, r.semester, new Date(r.lastUpdated || Date.now()).toLocaleString()]);
            const csv = [head, ...rows].map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `performance-report-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50">Export CSV</button>
          <button onClick={() => {
            if (!sortedRecords.length) return;
            const win = window.open('', '_blank');
            if (!win) return;
            const body = sortedRecords.map((r) => `<tr><td>${r.studentName}</td><td>${r.subjectName}</td><td>${Number(r.attendancePercentage).toFixed(1)}%</td><td>${Number(r.marks).toFixed(1)}</td><td>${r.grade}</td><td>${r.semester}</td></tr>`).join('');
            win.document.write(`<html><head><title>Performance Report</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f3f4f6}</style></head><body><h1>SPID Performance Report</h1><p>${new Date().toLocaleString()}</p><table><thead><tr><th>Student</th><th>Subject</th><th>Attendance</th><th>Marks</th><th>Grade</th><th>Semester</th></tr></thead><tbody>${body}</tbody></table></body></html>`);
            win.document.close();
            win.print();
          }} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50">Export PDF</button>
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                if (showForm) resetForm();
                setShowForm(!showForm);
              }}
              className="app-primary-btn"
            >
              {showForm ? 'Cancel' : 'Add Performance Record'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs uppercase text-gray-500">Avg Marks</p><p className="text-2xl font-semibold mt-1">{metrics.avgMarks.toFixed(1)}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs uppercase text-gray-500">Avg Attendance</p><p className="text-2xl font-semibold mt-1">{metrics.avgAttendance.toFixed(1)}%</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs uppercase text-gray-500">% At-Risk</p><p className="text-2xl font-semibold mt-1 text-red-600">{metrics.atRiskPercent.toFixed(1)}%</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs uppercase text-gray-500">% Pass Rate</p><p className="text-2xl font-semibold mt-1 text-green-600">{metrics.passRate.toFixed(1)}%</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs uppercase text-gray-500">Top Subject</p><p className="text-2xl font-semibold mt-1">{metrics.topSubject}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-xs uppercase text-gray-500">Total Students</p><p className="text-2xl font-semibold mt-1">{metrics.totalStudents}</p></div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{editingRecordId ? 'Update Performance Record' : 'Add Performance Record'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <CustomDropdown
                  value={formData.studentId}
                  onChange={handleStudentChange}
                  disabled={loading}
                  placeholder="Select Student"
                  options={[
                    { value: '', label: 'Select Student' },
                    ...students.map((student) => ({
                      value: student._id,
                      label: `${student.name} (${student.studentId}) - Year ${student.year}`,
                    })),
                  ]}
                />
                {formErrors.studentId && <p className="mt-1 text-xs text-red-600">{formErrors.studentId}</p>}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <CustomDropdown
                  value={formData.subjectId}
                  onChange={(value) => {
                    const selected = assignedSubjects.find((subject) => String(subject._id) === String(value));
                    setFormData((prev) => ({
                      ...prev,
                      subjectId: value,
                      subjectName: selected ? String(selected.subjectName || selected.name || '') : ''
                    }));
                  }}
                  placeholder={formData.studentId ? 'Select Subject' : 'Select Student first'}
                  disabled={!formData.studentId || !assignedSubjects.length}
                  options={[
                    { value: '', label: assignedSubjects.length ? 'Select Subject' : 'No eligible subjects available' },
                    ...assignedSubjects.map((subject) => ({
                      value: String(subject._id),
                      label: `${subject.subjectCode || subject.code || ''} - ${subject.subjectName || subject.name || 'Subject'}`,
                    })),
                  ]}
                />
                {formErrors.subjectId && <p className="mt-1 text-xs text-red-600">{formErrors.subjectId}</p>}
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
                {formErrors.attendancePercentage && <p className="mt-1 text-xs text-red-600">{formErrors.attendancePercentage}</p>}
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
                {formErrors.marks && <p className="mt-1 text-xs text-red-600">{formErrors.marks}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester (Auto)</label>
                <input
                  type="text"
                  value={formData.semester}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900"
                  placeholder="Select Student first"
                />
                {formErrors.semester && <p className="mt-1 text-xs text-red-600">{formErrors.semester}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto Grade</label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 font-semibold text-gray-900">
                  {computedGrade}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !formData.studentId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{loading ? 'Saving...' : editingRecordId ? 'Update Record' : 'Save Record'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by student/subject" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">{departmentOptions.map((d) => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}</select>
          <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">{semesterFilterOptions.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Semesters' : s}</option>)}</select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">{subjectOptions.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}</select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={atRiskOnly} onChange={(e) => setAtRiskOnly(e.target.checked)} />At-risk only</label>
          <button onClick={() => { setSearchQuery(''); setDepartmentFilter('all'); setSemesterFilter('all'); setSubjectFilter('all'); setAtRiskOnly(false); setDateFrom(''); setDateTo(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-700">Clear Filters</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Marks & Attendance Trend</h3>
          <div className="h-72">
            <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Subject-wise Performance</h3>
          <div className="h-72">
            <Bar data={subjectBarData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Students Needing Attention This Week</h3>
          <span className="text-xs text-gray-500">Last 7 days</span>
        </div>
        {weeklyRisk.length === 0 ? (
          <p className="text-sm text-gray-500">No high-risk signals detected this week.</p>
        ) : (
          <div className="space-y-3">
            {weeklyRisk.map((item) => (
              <div key={item.id} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button onClick={() => router.push(`/students/${item.id}`)} className="text-sm font-semibold text-blue-700 hover:text-blue-800">{item.studentName} ({item.studentCode})</button>
                  <span className="text-xs text-gray-600">Marks: {item.marks.toFixed(1)} | Attendance: {item.attendance.toFixed(1)}%</span>
                </div>
                <p className="mt-1 text-sm text-amber-900">{item.reasons.join(' | ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {studentsWithoutPerformance.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/40">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-sm font-semibold text-blue-900">
                Students Without Performance Records ({studentsWithoutPerformance.length})
              </h3>
              <span className="text-xs text-blue-700">Newly created students appear here automatically</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
              <input
                value={missingSearch}
                onChange={(e) => setMissingSearch(e.target.value)}
                placeholder="Search missing students by name, ID, department"
                className="w-full lg:max-w-md px-3 py-2 border border-blue-200 rounded-md text-sm"
              />
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <span className="px-2 py-1 rounded-full bg-white border border-blue-200">Missing: {missingMeta.totalMissing}</span>
                <span className="px-2 py-1 rounded-full bg-white border border-blue-200">Final Year: {missingMeta.finalYearMissing}</span>
                <span className="px-2 py-1 rounded-full bg-white border border-blue-200">No Subjects: {missingMeta.noEligibleSubjects}</span>
                {missingByDepartment.map(([dept, count]) => (
                  <span key={dept} className="px-2 py-1 rounded-full bg-white border border-blue-200">{dept}: {count}</span>
                ))}
                {user?.role === 'admin' && (
                  <button
                    onClick={handleBootstrapMissing}
                    disabled={isBootstrappingMissing || filteredMissingStudents.length === 0}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isBootstrappingMissing ? 'Creating...' : 'Auto Create Baseline'}
                  </button>
                )}
                {filteredMissingStudents.length > 0 && (
                  <button
                    onClick={() => handleQuickAddForStudent(String(filteredMissingStudents[0]._id))}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Open Next Missing
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredMissingStudents.slice(0, 8).map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleQuickAddForStudent(String(student._id))}
                  className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                >
                  {student.name} ({student.studentId || 'N/A'}) | {student.department} | Sem {student.semester || '-'} | Eligible: {missingDetailsById[String(student._id)]?.eligibleSubjectCount ?? 0}
                </button>
              ))}
              {filteredMissingStudents.length > 8 && (
                <span className="text-xs text-gray-500 self-center">+{filteredMissingStudents.length - 8} more</span>
              )}
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><button onClick={() => { if (sortKey === 'studentName') setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey('studentName'); setSortDir('asc'); } }}>Student {sortKey === 'studentName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><button onClick={() => { if (sortKey === 'subjectName') setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey('subjectName'); setSortDir('asc'); } }}>Subject {sortKey === 'subjectName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><button onClick={() => { if (sortKey === 'attendancePercentage') setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey('attendancePercentage'); setSortDir('asc'); } }}>Attendance {sortKey === 'attendancePercentage' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><button onClick={() => { if (sortKey === 'marks') setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey('marks'); setSortDir('asc'); } }}>Marks {sortKey === 'marks' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><button onClick={() => { if (sortKey === 'grade') setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey('grade'); setSortDir('asc'); } }}>Grade {sortKey === 'grade' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"><button onClick={() => { if (sortKey === 'semester') setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey('semester'); setSortDir('asc'); } }}>Semester {sortKey === 'semester' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</button></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRecords.map((record) => (
              <tr key={record._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/students/${String(record.studentObjectId || record.studentId?._id || record.studentId)}`)}>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  {user?.role === 'admin' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-800">Edit</button>
                      <button onClick={() => handleDelete(record)} className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {sortedRecords.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No records found for current filters.</p>
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              <Link href="/import" className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100">Import CSV</Link>
              {user?.role === 'admin' && (
                <button onClick={generateSampleData} disabled={isGeneratingSamples || loading} className="bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
                  {isGeneratingSamples ? 'Adding...' : 'Add sample data'}
                </button>
              )}
              {user?.role === 'admin' && (
                <button onClick={() => setShowForm(true)} className="app-primary-btn">
                  Create first record
                </button>
              )}
            </div>
          </div>
        )}
        {sortedRecords.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <p className="text-gray-600">
              Showing {(page - 1) * serverPagination.limit + 1}-{Math.min(page * serverPagination.limit, serverPagination.totalRecords)} of {serverPagination.totalRecords}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="border border-gray-300 rounded px-3 py-1 disabled:opacity-40">Prev</button>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="border border-gray-300 rounded px-3 py-1 disabled:opacity-40">Next</button>
            </div>
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
