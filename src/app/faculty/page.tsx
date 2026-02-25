'use client';

import { useEffect, useMemo, useState } from 'react';
import { facultyAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CustomDropdown from '@/components/ui/CustomDropdown';

type FacultyMember = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  bio?: string;
  profilePhoto?: string;
  expertise?: string[];
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
  const isAdmin = user?.role === 'admin';
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
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
    department: '',
    designation: '',
    bio: '',
    profilePhoto: '',
    expertiseText: '',
  });

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const response = await facultyAPI.getAll({ department: departmentFilter || undefined, search: search || undefined });
      const list = response.data?.data?.faculty || [];
      setFaculty(list);
      if (!selected && list.length) setSelected(list[0]);
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

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', department: '', designation: '', bio: '', profilePhoto: '', expertiseText: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department,
        designation: form.designation,
        bio: form.bio,
        profilePhoto: form.profilePhoto,
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
      alert(error?.response?.data?.error || 'Failed to save faculty');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this faculty member?')) return;
    try {
      await facultyAPI.delete(id);
      await loadFaculty();
      if (selected?._id === id) setSelected(null);
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to delete faculty');
    }
  };

  const startEdit = (member: FacultyMember) => {
    setEditing(member);
    setForm({
      name: member.name || '',
      email: member.email || '',
      password: '',
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
          {isAdmin && (
            <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold">
              {showForm ? 'Close Form' : 'Add Faculty'}
            </button>
          )}
        </div>
      </section>

      {isAdmin && showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="px-3 py-2 border rounded-md" />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="px-3 py-2 border rounded-md" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Leave blank to keep password' : 'Password'} className="px-3 py-2 border rounded-md" />
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
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  </div>
                </div>
                {isAdmin && (
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
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Select a faculty member to view details.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
