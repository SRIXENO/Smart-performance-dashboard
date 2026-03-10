'use client';

import { useEffect, useMemo, useState } from 'react';
import { facultyAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CustomDropdown from '@/components/ui/CustomDropdown';
import ConfirmModal from '@/components/ConfirmModal';
import { hasPermission } from '@/lib/permissions';
import { getApiErrorMessage } from '@/lib/apiError';

type FacultyMember = {
  _id: string;
  userId: string;
  registerNumber?: string;
  name: string;
  email: string;
  status?: 'active' | 'blocked';
  department?: string;
  designation?: string;
  bio?: string;
  profilePhoto?: string;
  expertise?: string[];
};

type FacultyInsight = {
  facultyId: string;
  userId?: string;
  name: string;
  email?: string;
  department?: string;
  designation?: string;
  status?: string;
  scopeType: 'assigned_subjects' | 'department_fallback';
  assignedSubjects: number;
  totalRecords: number;
  failRate: number;
  averageImprovement: number;
  attendanceCorrelation: number;
  poorAttendanceCorrelationScore: number;
  atRiskStudents: number;
  averageAttendance: number;
};

type SubjectInsight = {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  facultyId?: string | null;
  department?: string;
  year?: string;
  semester?: string;
  totalRecords: number;
  failRate: number;
  averageImprovement: number;
  attendanceCorrelation: number;
  poorAttendanceCorrelationScore: number;
  atRiskStudents: number;
  averageAttendance: number;
};

type FacultyInsightsResponse = {
  facultyInsights: FacultyInsight[];
  subjectInsights: SubjectInsight[];
  leaders: {
    highestFailRateFaculty: FacultyInsight | null;
    bestStudentImprovementFaculty: FacultyInsight | null;
    poorAttendanceCorrelationFaculty: FacultyInsight | null;
    mostAtRiskStudentsFaculty: FacultyInsight | null;
    highestFailRateSubject: SubjectInsight | null;
    bestStudentImprovementSubject: SubjectInsight | null;
    poorAttendanceCorrelationSubject: SubjectInsight | null;
    mostAtRiskStudentsSubject: SubjectInsight | null;
  };
};

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electrical and Communication Engineering',
  'Electrical and Electronic Engineering',
  'Mechanical',
  'Civil',
  'Biotechnology',
];

export default function FacultyPage() {
  const { user } = useAuth();
  const canManageFaculty = hasPermission(user, 'faculty.manage');
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [insights, setInsights] = useState<FacultyInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FacultyMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FacultyMember | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    registerNumber: '',
    status: 'active',
    department: '',
    designation: '',
    bio: '',
    profilePhoto: '',
    expertiseText: '',
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmStyle: 'danger' as 'danger' | 'primary' | 'warning',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const [facultyResponse, insightsResponse] = await Promise.all([
        facultyAPI.getAll({ department: departmentFilter || undefined, search: search || undefined }),
        facultyAPI.getInsights({ department: departmentFilter || undefined }),
      ]);
      const list = facultyResponse.data?.data?.faculty || [];
      const insightData = insightsResponse.data?.data || null;
      setFaculty(list);
      setInsights(insightData);
      if (!selected && list.length) setSelected(list[0]);
      if (selected && !list.some((item: FacultyMember) => item._id === selected._id)) {
        setSelected(list[0] || null);
      }
    } catch (error) {
      console.error('Failed to load faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [departmentFilter, search]);

  const departments = useMemo(() => {
    const fromData = Array.from(new Set(faculty.map((f) => f.department).filter((d): d is string => Boolean(d))));
    return Array.from(new Set([...DEPARTMENTS, ...fromData]));
  }, [faculty]);

  const selectedInsight = useMemo(
    () => insights?.facultyInsights?.find((item) => item.facultyId === selected?._id) || null,
    [insights, selected]
  );

  const selectedSubjectInsights = useMemo(() => {
    if (!selected || !insights?.subjectInsights) return [];
    return insights.subjectInsights
      .filter((item) => item.facultyId === selected._id)
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 6);
  }, [insights, selected]);

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', registerNumber: '', status: 'active', department: '', designation: '', bio: '', profilePhoto: '', expertiseText: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizeOptional = (value: string) => {
        const trimmed = String(value || '').trim();
        return trimmed ? trimmed : undefined;
      };
      const payload = {
        name: form.name,
        email: form.email,
        password: normalizeOptional(form.password),
        registerNumber: normalizeOptional(form.registerNumber),
        status: form.status,
        department: normalizeOptional(form.department),
        designation: normalizeOptional(form.designation),
        bio: normalizeOptional(form.bio),
        profilePhoto: normalizeOptional(form.profilePhoto),
        expertise: form.expertiseText.split(',').map((x) => x.trim()).filter(Boolean),
      };
      if (editing) {
        await facultyAPI.update(editing._id, payload);
      } else {
        await facultyAPI.create(payload);
      }
      resetForm();
      await loadFaculty();
    } catch (error: any) {
      alert(getApiErrorMessage(error, 'Failed to save faculty'));
    }
  };

  const handleDelete = async (id: string) => {
    const member = faculty.find((f) => f._id === id);
    const label = member?.name || 'this faculty member';

    setConfirmModal({
      isOpen: true,
      title: 'Delete Faculty?',
      message: `Delete ${label}? This will remove faculty access and linked references.`,
      confirmText: 'Delete',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await facultyAPI.delete(id);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          await loadFaculty();
          if (selected?._id === id) setSelected(null);
        } catch (error: any) {
          alert(getApiErrorMessage(error, 'Failed to delete faculty'));
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const startEdit = (member: FacultyMember) => {
    setEditing(member);
    setForm({
      name: member.name || '',
      email: member.email || '',
      password: '',
      registerNumber: member.registerNumber || '',
      status: member.status || 'active',
      department: member.department || '',
      designation: member.designation || '',
      bio: member.bio || '',
      profilePhoto: member.profilePhoto || '',
      expertiseText: (member.expertise || []).join(', '),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Faculty Members</h1>
            <p className="text-slate-500 text-sm mt-1">Admin can add/edit/delete. Faculty and students are view-only.</p>
          </div>
          {canManageFaculty && (
            <button onClick={() => setShowForm((v) => !v)} className="app-primary-btn">
              {showForm ? 'Close Form' : 'Add Faculty'}
            </button>
          )}
        </div>
      </section>

      {canManageFaculty && showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="px-3 py-2 border rounded-md" />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="px-3 py-2 border rounded-md" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Leave blank to keep password' : 'Password'} className="px-3 py-2 border rounded-md" />
            <input value={form.registerNumber} onChange={(e) => setForm({ ...form, registerNumber: e.target.value })} placeholder="Login ID / Register Number (optional)" className="px-3 py-2 border rounded-md" />
            <CustomDropdown
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value as 'active' | 'blocked' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
            <CustomDropdown
              value={form.department}
              onChange={(value) => setForm({ ...form, department: value })}
              placeholder="Select Department"
              options={[
                { value: '', label: 'Select Department' },
                ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
              ]}
            />
            <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Designation" className="px-3 py-2 border rounded-md" />
            <input value={form.profilePhoto} onChange={(e) => setForm({ ...form, profilePhoto: e.target.value })} placeholder="Profile Photo URL or base64" className="px-3 py-2 border rounded-md" />
            <input value={form.expertiseText} onChange={(e) => setForm({ ...form, expertiseText: e.target.value })} placeholder="Expertise (comma separated)" className="md:col-span-2 px-3 py-2 border rounded-md" />
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" className="md:col-span-2 px-3 py-2 border rounded-md min-h-[90px]" />
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-md border border-slate-300">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white">{editing ? 'Update Faculty' : 'Create Faculty'}</button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name/email/ID" className="px-3 py-2 border rounded-md" />
          <CustomDropdown
            value={departmentFilter}
            onChange={setDepartmentFilter}
            placeholder="All Departments"
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map((d) => ({ value: d, label: d })),
            ]}
          />
          <div className="text-sm text-slate-500 flex items-center">{faculty.length} faculty records</div>
        </div>
      </section>

      {insights && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <InsightLeaderCard
              title="Highest Fail Rate"
              value={insights.leaders.highestFailRateFaculty?.name || 'No data'}
              meta={insights.leaders.highestFailRateFaculty ? `${insights.leaders.highestFailRateFaculty.failRate}% fail rate` : 'Waiting for performance data'}
              accent="rose"
            />
            <InsightLeaderCard
              title="Best Improvement"
              value={insights.leaders.bestStudentImprovementFaculty?.name || 'No data'}
              meta={insights.leaders.bestStudentImprovementFaculty ? `${insights.leaders.bestStudentImprovementFaculty.averageImprovement} marks gained` : 'Waiting for performance data'}
              accent="emerald"
            />
            <InsightLeaderCard
              title="Poor Attendance Correlation"
              value={insights.leaders.poorAttendanceCorrelationFaculty?.name || 'No data'}
              meta={insights.leaders.poorAttendanceCorrelationFaculty ? `Score ${insights.leaders.poorAttendanceCorrelationFaculty.poorAttendanceCorrelationScore}` : 'Waiting for performance data'}
              accent="amber"
            />
            <InsightLeaderCard
              title="Most At-Risk Students"
              value={insights.leaders.mostAtRiskStudentsFaculty?.name || 'No data'}
              meta={insights.leaders.mostAtRiskStudentsFaculty ? `${insights.leaders.mostAtRiskStudentsFaculty.atRiskStudents} students flagged` : 'Waiting for performance data'}
              accent="slate"
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Subject Signals</h2>
                  <p className="text-sm text-slate-500">Subjects leading each faculty intelligence metric.</p>
                </div>
                <span className="text-xs text-slate-500">{insights.subjectInsights.length} analyzed</span>
              </div>
              <div className="mt-4 space-y-3">
                <SubjectLeaderRow
                  label="Highest Fail Rate"
                  item={insights.leaders.highestFailRateSubject}
                  meta={(item) => `${item.failRate}% fail rate`}
                />
                <SubjectLeaderRow
                  label="Best Improvement"
                  item={insights.leaders.bestStudentImprovementSubject}
                  meta={(item) => `${item.averageImprovement} marks gained`}
                />
                <SubjectLeaderRow
                  label="Poor Attendance Correlation"
                  item={insights.leaders.poorAttendanceCorrelationSubject}
                  meta={(item) => `Score ${item.poorAttendanceCorrelationScore}`}
                />
                <SubjectLeaderRow
                  label="Most At-Risk Students"
                  item={insights.leaders.mostAtRiskStudentsSubject}
                  meta={(item) => `${item.atRiskStudents} students flagged`}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Faculty Coverage</h2>
                  <p className="text-sm text-slate-500">Insight scope is based on assigned subjects or department fallback.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.facultyInsights.slice(0, 6).map((item) => (
                  <button
                    key={item.facultyId}
                    type="button"
                    onClick={() => {
                      const member = faculty.find((entry) => entry._id === item.facultyId);
                      if (member) setSelected(member);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-violet-300 hover:bg-violet-50/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">{item.department || 'Department not set'}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.scopeType === 'assigned_subjects' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.scopeType === 'assigned_subjects' ? 'Assigned subjects' : 'Dept fallback'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <MetricPill label="Fail" value={`${item.failRate}%`} tone="rose" />
                      <MetricPill label="Improve" value={`${item.averageImprovement}`} tone="emerald" />
                      <MetricPill label="At risk" value={`${item.atRiskStudents}`} tone="amber" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading faculty...</div>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {faculty.map((member) => (
              <article
                key={member._id}
                className={`rounded-2xl border p-4 cursor-pointer transition ${selected?._id === member._id ? 'border-violet-400 bg-violet-50/40' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                onClick={() => setSelected(member)}
              >
                <div className="flex items-start gap-3">
                  {member.profilePhoto ? (
                    <img src={member.profilePhoto} alt={member.name} className="h-16 w-16 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center text-xl font-bold">
                      {member.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{member.name}</h3>
                    <p className="text-sm text-violet-700">{member.designation || 'Faculty Member'}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{member.department || 'Department not set'}</p>
                    <p className={`text-xs mt-1 font-semibold ${member.status === 'blocked' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {member.status === 'blocked' ? 'Blocked' : 'Active'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  </div>
                </div>
                {canManageFaculty && (
                  <div className="mt-3 flex gap-3 text-sm">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(member); }} className="text-indigo-600 hover:text-indigo-800">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(member._id); }} className="text-red-600 hover:text-red-800">Delete</button>
                  </div>
                )}
              </article>
            ))}
            {faculty.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">No faculty found.</div>}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-violet-50/20 p-5">
                <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                <p className="text-violet-700 font-semibold mt-1">{selected.designation || 'Faculty Member'}</p>
                <p className="text-slate-600 mt-1">{selected.department || 'Department not set'}</p>
                <p className="text-slate-600">{selected.email}</p>

                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Areas of Expertise</h3>
                  {selected.expertise && selected.expertise.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selected.expertise.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full text-xs bg-violet-100 text-violet-800">{item}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No expertise added.</p>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Profile Summary</h3>
                  <p className="text-sm text-slate-600">{selected.bio || 'No bio provided yet.'}</p>
                </div>

                {selectedInsight && (
                  <>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">Faculty Intelligence</h3>
                          <p className="text-sm text-slate-500">
                            Based on {selectedInsight.scopeType === 'assigned_subjects' ? 'assigned subject ownership' : 'department-level fallback records'}.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {selectedInsight.assignedSubjects} assigned subjects
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <MetricPanel title="Fail Rate" value={`${selectedInsight.failRate}%`} hint={`${selectedInsight.totalRecords} records`} tone="rose" />
                        <MetricPanel title="Student Improvement" value={`${selectedInsight.averageImprovement}`} hint="avg marks delta" tone="emerald" />
                        <MetricPanel title="Attendance Correlation" value={`${selectedInsight.attendanceCorrelation}`} hint={`risk score ${selectedInsight.poorAttendanceCorrelationScore}`} tone="amber" />
                        <MetricPanel title="At-Risk Students" value={`${selectedInsight.atRiskStudents}`} hint="marks < 60 or attendance < 75" tone="slate" />
                        <MetricPanel title="Average Attendance" value={`${selectedInsight.averageAttendance}%`} hint="across tracked records" tone="blue" />
                        <MetricPanel title="Coverage Mode" value={selectedInsight.scopeType === 'assigned_subjects' ? 'Assigned' : 'Fallback'} hint={selectedInsight.department || 'No department'} tone="violet" />
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">Subject Weakness Map</h3>
                          <p className="text-sm text-slate-500">Top subjects under this faculty sorted by fail rate.</p>
                        </div>
                        <span className="text-xs text-slate-500">{selectedSubjectInsights.length} subjects shown</span>
                      </div>
                      {selectedSubjectInsights.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {selectedSubjectInsights.map((subject) => (
                            <div key={subject.subjectId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900">{subject.subjectName}</p>
                                  <p className="text-sm text-slate-500">
                                    {[subject.subjectCode, subject.year, subject.semester].filter(Boolean).join(' • ') || 'Subject metadata unavailable'}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <MetricPill label="Fail" value={`${subject.failRate}%`} tone="rose" />
                                  <MetricPill label="Improve" value={`${subject.averageImprovement}`} tone="emerald" />
                                  <MetricPill label="At risk" value={`${subject.atRiskStudents}`} tone="amber" />
                                  <MetricPill label="Attend" value={`${subject.averageAttendance}%`} tone="blue" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">No assigned-subject insight records yet for this faculty.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Select a faculty member to view details.</div>
            )}
          </div>
        </section>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmStyle={confirmModal.confirmStyle}
        cancelText="Cancel"
        loading={isDeleting}
      />
    </div>
  );
}

function InsightLeaderCard({
  title,
  value,
  meta,
  accent,
}: {
  title: string;
  value: string;
  meta: string;
  accent: 'rose' | 'emerald' | 'amber' | 'slate';
}) {
  const accentClasses = {
    rose: 'border-rose-200 bg-rose-50/70 text-rose-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border p-5 ${accentClasses[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{title}</p>
      <p className="mt-3 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{meta}</p>
    </div>
  );
}

function MetricPanel({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  tone: 'rose' | 'emerald' | 'amber' | 'slate' | 'blue' | 'violet';
}) {
  const toneClasses = {
    rose: 'border-rose-200 bg-rose-50/70',
    emerald: 'border-emerald-200 bg-emerald-50/70',
    amber: 'border-amber-200 bg-amber-50/70',
    slate: 'border-slate-200 bg-slate-50',
    blue: 'border-blue-200 bg-blue-50/70',
    violet: 'border-violet-200 bg-violet-50/70',
  };
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'rose' | 'emerald' | 'amber' | 'blue';
}) {
  const toneClasses = {
    rose: 'bg-rose-100 text-rose-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {label}: {value}
    </span>
  );
}

function SubjectLeaderRow({
  label,
  item,
  meta,
}: {
  label: string;
  item: SubjectInsight | null;
  meta: (item: SubjectInsight) => string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1 font-semibold text-slate-900">{item?.subjectName || 'No data'}</p>
          <p className="text-sm text-slate-500">
            {item ? [item.subjectCode, item.department, item.year, item.semester].filter(Boolean).join(' • ') : 'Waiting for performance data'}
          </p>
        </div>
        <p className="text-sm font-medium text-slate-700">{item ? meta(item) : '-'}</p>
      </div>
    </div>
  );
}
