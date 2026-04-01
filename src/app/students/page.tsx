'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { studentsAPI } from '@/lib/api';
import { Student } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { logger } from '@/lib/logger';
import { hasPermission } from '@/lib/permissions';
import { getApiErrorMessage } from '@/lib/apiError';

export default function Students() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer' || user?.role === 'student';
  const isStudentRole = user?.role === 'student';
  const canManageStudents = hasPermission(user, 'students.manage');
  const canManageStudentAccess = canManageStudents;
  const canEditPerformance = hasPermission(user, 'performance.edit');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
    limit: 20
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmStyle: 'danger' as 'danger' | 'primary' | 'warning',
    action: 'general' as 'general' | 'delete' | 'block' | 'unblock',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electrical and Communication Engineering',
    'Electrical and Electronic Engineering',
    'Mechanical',
    'Civil',
    'Biotechnology'
  ];

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (department) params.department = department;
      if (year) params.year = year;
      if (semester) params.semester = semester;

      const response = await studentsAPI.getAll(params);
      setStudents(response.data.data.students);
      setPagination(response.data.data.pagination);
    } catch (error) {
      logger.error('Failed to fetch students:', error);
      setStudents([]);
      setError(getApiErrorMessage(error, 'Unable to load students right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudents(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, department, year, semester]);

  const handleDelete = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Student?',
      message: `Are you sure you want to delete ${name}? This will permanently remove all student data. This action cannot be undone.`,
      confirmText: 'Delete',
      confirmStyle: 'danger',
      action: 'delete',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await studentsAPI.delete(id);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchStudents(pagination.currentPage);
        } catch (error: any) {
          logger.error('Failed to delete student:', error);
          alert(getApiErrorMessage(error, 'Failed to delete student'));
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const isBlocked = (status?: string) =>
    ['inactive', 'suspended'].includes(String(status || '').toLowerCase());

  const handleToggleBlock = async (student: Student) => {
    const nextStatus = isBlocked(student.status) ? 'active' : 'suspended';
    const actionLabel = nextStatus === 'active' ? 'Unblock' : 'Block';

    setConfirmModal({
      isOpen: true,
      title: `${actionLabel} Student?`,
      message:
        nextStatus === 'active'
          ? `Unblock ${student.name}? They will be able to log in again.`
          : `Block ${student.name}? They will not be able to log in.`,
      confirmText: actionLabel,
      confirmStyle: nextStatus === 'active' ? 'primary' : 'warning',
      action: nextStatus === 'active' ? 'unblock' : 'block',
      onConfirm: async () => {
        setIsUpdatingStatus(student._id);
        try {
          await studentsAPI.update(student._id, { status: nextStatus });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchStudents(pagination.currentPage);
        } catch (error: any) {
          logger.error('Failed to update student status:', error);
          alert(getApiErrorMessage(error, 'Failed to update student status'));
        } finally {
          setIsUpdatingStatus(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        {canManageStudents && (
          <Link
            href="/students/add"
            className="app-primary-btn"
          >
            Add Student
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder={isViewer ? 'Search by name or department...' : 'Search by name, email, or student ID...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <CustomDropdown
            value={department}
            onChange={setDepartment}
            placeholder="All Departments"
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map((dept) => ({ value: dept, label: dept })),
            ]}
          />
          <CustomDropdown
            value={year}
            onChange={setYear}
            placeholder="All Years"
            options={[
              { value: '', label: 'All Years' },
              { value: '1', label: 'Year 1' },
              { value: '2', label: 'Year 2' },
              { value: '3', label: 'Year 3' },
              { value: '4', label: 'Year 4' },
            ]}
          />
          <CustomDropdown
            value={semester}
            onChange={setSemester}
            placeholder="All Semesters"
            options={[
              { value: '', label: 'All Semesters' },
              { value: '1', label: 'Semester 1' },
              { value: '2', label: 'Semester 2' },
              { value: '3', label: 'Semester 3' },
              { value: '4', label: 'Semester 4' },
              { value: '5', label: 'Semester 5' },
              { value: '6', label: 'Semester 6' },
              { value: '7', label: 'Semester 7' },
              { value: '8', label: 'Semester 8' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-slate-200" />
                <div className="h-3 w-56 rounded bg-slate-100" />
              </div>
              <div className="h-9 w-24 rounded bg-slate-100" />
            </div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 rounded-xl border border-slate-100 p-4 md:grid-cols-5">
                <div className="h-4 rounded bg-slate-100 md:col-span-2" />
                <div className="h-4 rounded bg-slate-100" />
                <div className="h-4 rounded bg-slate-100" />
                <div className="hidden h-4 rounded bg-slate-100 md:block" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-700">Load error</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Student records could not be loaded</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
              <button onClick={() => fetchStudents(pagination.currentPage)} className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className={`${isViewer ? 'min-w-[620px]' : 'min-w-[920px]'} w-full divide-y divide-gray-200`}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  {!isViewer && (
                    <>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="sticky right-0 z-10 bg-gray-50 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)] px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </>
                  )}
                  {isStudentRole && (
                    <th className="sticky right-0 z-10 bg-gray-50 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)] px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.department}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Year {student.year}
                    </td>
                    {!isViewer && (
                      <>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="sticky right-0 z-10 bg-white shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)] px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="inline-flex items-center gap-2 sm:gap-3">
                          <Link
                            href={`/students/${student._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          {canManageStudents && (
                            <>
                              <details className="relative sm:hidden">
                                <summary className="list-none cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
                                  More
                                </summary>
                                <div className="absolute right-0 mt-1 w-28 rounded-md border border-gray-200 bg-white shadow-lg p-1 z-20">
                                  <Link
                                    href={`/students/${student._id}/edit`}
                                    className="block rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50"
                                  >
                                    Edit
                                  </Link>
                                  {canEditPerformance && (
                                    <Link
                                      href={`/performance?studentId=${student._id}&openForm=1`}
                                      className="block rounded px-2 py-1 text-sky-700 hover:bg-sky-50"
                                    >
                                      Performance
                                    </Link>
                                  )}
                                  {canManageStudentAccess && (
                                    <button
                                      onClick={() => handleToggleBlock(student)}
                                      className={`block w-full text-left rounded px-2 py-1 hover:bg-slate-50 ${
                                        isBlocked(student.status) ? 'text-emerald-700' : 'text-amber-700'
                                      }`}
                                    >
                                      {isUpdatingStatus === student._id
                                        ? 'Saving...'
                                        : isBlocked(student.status)
                                          ? 'Unblock'
                                          : 'Block'}
                                    </button>
                                  )}
                                  {canManageStudents && (
                                    <button
                                      onClick={() => handleDelete(student._id, student.name)}
                                      className="block w-full text-left rounded px-2 py-1 text-red-600 hover:bg-red-50"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </details>
                              <Link
                                href={`/students/${student._id}/edit`}
                                className="hidden sm:inline text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </Link>
                              {canEditPerformance && (
                                <Link
                                  href={`/performance?studentId=${student._id}&openForm=1`}
                                  className="hidden sm:inline text-sky-600 hover:text-sky-900"
                                >
                                  Performance
                                </Link>
                              )}
                              {canManageStudentAccess && (
                                <button
                                  onClick={() => handleToggleBlock(student)}
                                  disabled={isUpdatingStatus === student._id}
                                  className={`hidden sm:inline disabled:opacity-50 ${
                                    isBlocked(student.status)
                                      ? 'text-emerald-600 hover:text-emerald-900'
                                      : 'text-amber-600 hover:text-amber-900'
                                  }`}
                                >
                                  {isUpdatingStatus === student._id
                                    ? 'Saving...'
                                    : isBlocked(student.status)
                                      ? 'Unblock'
                                      : 'Block'}
                                </button>
                              )}
                              {canManageStudents && (
                                <button
                                  onClick={() => handleDelete(student._id, student.name)}
                                  className="hidden sm:inline text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                          </div>
                        </td>
                      </>
                    )}
                    {isStudentRole && (
                      <td className="sticky right-0 z-10 bg-white shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)] px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {student.isSelf ? (
                          <Link
                            href={`/students/${student._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            My Profile
                          </Link>
                        ) : (
                          <span className="text-gray-400">Restricted</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {students.length === 0 && (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">No matching students</p>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">The current filters did not return any student records.</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Try a broader search, switch departments, or add a new student record to prepare the demo workspace.
                  </p>
                </div>
                {canManageStudents && (
                  <Link
                    href="/students/add"
                    className="app-primary-btn mt-5 inline-flex"
                  >
                    Add Student
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!loading && students.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalStudents} students)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => fetchStudents(pagination.currentPage - 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => fetchStudents(pagination.currentPage + 1)}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.message}
        confirmStyle={confirmModal.confirmStyle}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        loading={confirmModal.action === 'delete' ? isDeleting : isUpdatingStatus !== null}
      />
    </div>
  );
}
