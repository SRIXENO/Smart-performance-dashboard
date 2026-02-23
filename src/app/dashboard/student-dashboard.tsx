'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { studentsAPI } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type StudentRow = {
  _id: string;
  studentId?: string;
  name: string;
  email?: string;
  gender?: string;
  year?: number;
  department?: string;
  cgpa?: string | number;
  attendance?: string | number;
  status?: string;
};

type SortKey = 'name' | 'year' | 'cgpa' | 'attendance';
type ViewMode = 'table' | 'cards';

export default function StudentDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [now, setNow] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<'All' | number>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentsAPI.getAll({ limit: 1000 });
      const studentData = response.data?.data?.students || [];
      setStudents(studentData);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    setIsRefreshing(false);
  };

  const years = useMemo(() => {
    return ['All', ...Array.from(new Set(students.map((s) => s.year).filter(Boolean))).sort()] as Array<'All' | number>;
  }, [students]);

  const statuses = useMemo(() => {
    return ['All', ...Array.from(new Set(students.map((s) => s.status).filter(Boolean)))] as Array<'All' | string>;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const filtered = students.filter((student) => {
      const matchesSearch =
        !normalized ||
        student.name?.toLowerCase().includes(normalized) ||
        student.studentId?.toLowerCase().includes(normalized) ||
        student.department?.toLowerCase().includes(normalized) ||
        student.email?.toLowerCase().includes(normalized);

      const matchesYear = selectedYear === 'All' || student.year === selectedYear;
      const matchesStatus = selectedStatus === 'All' || (student.status || '').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesYear && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortKey === 'year') {
        const aYear = a.year || 0;
        const bYear = b.year || 0;
        return sortOrder === 'asc' ? aYear - bYear : bYear - aYear;
      }
      if (sortKey === 'cgpa') {
        const aCgpa = Number(a.cgpa) || 0;
        const bCgpa = Number(b.cgpa) || 0;
        return sortOrder === 'asc' ? aCgpa - bCgpa : bCgpa - aCgpa;
      }
      const aAttendance = Number(a.attendance) || 0;
      const bAttendance = Number(b.attendance) || 0;
      return sortOrder === 'asc' ? aAttendance - bAttendance : bAttendance - aAttendance;
    });

    return sorted;
  }, [searchTerm, selectedYear, selectedStatus, sortKey, sortOrder, students]);

  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const active = filteredStudents.filter((s) => (s.status || '').toLowerCase() === 'active').length;
    const departments = new Set(filteredStudents.map((s) => s.department).filter(Boolean)).size;
    const cgpas = filteredStudents.map((s) => Number(s.cgpa)).filter((n) => !Number.isNaN(n) && n > 0);
    const attendance = filteredStudents.map((s) => Number(s.attendance)).filter((n) => !Number.isNaN(n) && n > 0);
    const avgCgpa = cgpas.length ? (cgpas.reduce((sum, n) => sum + n, 0) / cgpas.length).toFixed(2) : 'N/A';
    const avgAttendance = attendance.length ? `${(attendance.reduce((sum, n) => sum + n, 0) / attendance.length).toFixed(1)}%` : 'N/A';
    const atRisk = filteredStudents.filter((s) => {
      const lowAttendance = (Number(s.attendance) || 0) > 0 && (Number(s.attendance) || 0) < 75;
      const lowCgpa = (Number(s.cgpa) || 0) > 0 && (Number(s.cgpa) || 0) < 6;
      return lowAttendance || lowCgpa;
    }).length;
    return { total, active, departments, avgCgpa, avgAttendance, atRisk };
  }, [filteredStudents]);

  const departmentChartData = useMemo(() => {
    const labels = Array.from(new Set(filteredStudents.map((s) => s.department).filter(Boolean)));
    return {
      labels,
      datasets: [
        {
          label: 'Students',
          data: labels.map((dept) => filteredStudents.filter((s) => s.department === dept).length),
          backgroundColor: ['#22d3ee', '#34d399', '#a78bfa', '#f59e0b', '#f472b6', '#60a5fa'],
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    };
  }, [filteredStudents]);

  const yearGenderChartData = useMemo(() => {
    const yearLabels = [1, 2, 3, 4];
    return {
      labels: yearLabels.map((year) => `Year ${year}`),
      datasets: [
        {
          label: 'Male',
          data: yearLabels.map(
            (year) => filteredStudents.filter((s) => s.year === year && (s.gender || '').toLowerCase() === 'male').length,
          ),
          backgroundColor: '#38bdf8',
          borderRadius: 10,
          borderSkipped: false,
        },
        {
          label: 'Female',
          data: yearLabels.map(
            (year) => filteredStudents.filter((s) => s.year === year && (s.gender || '').toLowerCase() === 'female').length,
          ),
          backgroundColor: '#f472b6',
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    };
  }, [filteredStudents]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { enabled: true, backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 10 },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
      x: { grid: { display: false } },
    },
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortOrder('asc');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-cyan-200 border-t-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 px-6 py-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.35),_transparent_45%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-cyan-300 text-xs uppercase tracking-[0.2em] mb-2">Realtime Command Center</p>
            <h2 className="text-3xl font-black tracking-tight">Student Performance Dashboard</h2>
            <p className="text-slate-300 mt-2">
              {filteredStudents.length} records in view • Last refresh {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs">{now.toLocaleString()}</span>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-sm font-semibold transition"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={() => setViewMode((prev) => (prev === 'table' ? 'cards' : 'table'))}
              className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-sm font-semibold transition"
            >
              {viewMode === 'table' ? 'Card View' : 'Table View'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-xl bg-cyan-400 text-slate-900 hover:bg-cyan-300 px-4 py-2 text-sm font-bold transition disabled:opacity-70"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      {showFilters && (
        <section className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Search</label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, ID, email, department..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {years.map((year) => (
                  <option key={String(year)} value={String(year)}>
                    {year === 'All' ? 'All Years' : `Year ${year}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'All' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear('All');
                  setSelectedStatus('All');
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <Kpi title="Total Students" value={String(stats.total)} tone="cyan" />
        <Kpi title="Active" value={String(stats.active)} tone="emerald" />
        <Kpi title="Departments" value={String(stats.departments)} tone="violet" />
        <Kpi title="Avg CGPA" value={stats.avgCgpa} tone="amber" />
        <Kpi title="Avg Attendance" value={stats.avgAttendance} tone="rose" />
        <Kpi title="At Risk" value={String(stats.atRisk)} tone="slate" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Student Directory</h3>
          <div className="text-xs text-slate-500">Sorted by {sortKey} ({sortOrder})</div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <Th label="Student ID" />
                  <Th label="Student Name" onClick={() => toggleSort('name')} active={sortKey === 'name'} order={sortOrder} />
                  <Th label="Gender" />
                  <Th label="Year" onClick={() => toggleSort('year')} active={sortKey === 'year'} order={sortOrder} />
                  <Th label="Department" />
                  <Th label="CGPA" onClick={() => toggleSort('cgpa')} active={sortKey === 'cgpa'} order={sortOrder} />
                  <Th label="Attendance" onClick={() => toggleSort('attendance')} active={sortKey === 'attendance'} order={sortOrder} />
                  <Th label="Status" />
                  <Th label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-14 text-center text-slate-500">
                      No students found for the selected filters.
                    </td>
                  </tr>
                )}
                {filteredStudents.map((student, idx) => (
                  <tr key={student._id} className={`transition-colors hover:bg-cyan-50/40 ${idx % 2 ? 'bg-slate-50/50' : 'bg-white'}`}>
                    <td className="px-5 py-4 text-sm text-slate-700">{student.studentId || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{student.name}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{student.gender || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{student.year ? `Year ${student.year}` : 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{student.department || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{student.cgpa || 'N/A'}</td>
                    <td className="px-5 py-4 text-sm text-slate-900">{student.attendance ? `${student.attendance}%` : 'N/A'}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={student.status || 'unknown'} />
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <button
                        onClick={() => router.push(`/dashboard/student/${student._id}`)}
                        className="rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-black transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <article key={student._id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{student.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{student.studentId || 'No ID'}</p>
                  </div>
                  <StatusPill status={student.status || 'unknown'} />
                </div>
                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p>Department: {student.department || 'N/A'}</p>
                  <p>Year: {student.year ? `Year ${student.year}` : 'N/A'}</p>
                  <p>CGPA: {student.cgpa || 'N/A'}</p>
                  <p>Attendance: {student.attendance ? `${student.attendance}%` : 'N/A'}</p>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/student/${student._id}`)}
                  className="mt-4 w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-3 py-2 transition"
                >
                  Open Profile
                </button>
              </article>
            ))}
            {filteredStudents.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500">No students found for the selected filters.</div>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Students by Department</h3>
          <p className="text-sm text-slate-500 mb-4">Distribution based on active filters</p>
          <div className="h-[320px]">
            <Bar data={departmentChartData} options={chartOptions} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Year and Gender Mix</h3>
          <p className="text-sm text-slate-500 mb-4">Year-wise gender trend</p>
          <div className="h-[320px]">
            <Bar data={yearGenderChartData} options={chartOptions} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';
}) {
  const tones: Record<string, string> = {
    cyan: 'from-cyan-100 to-cyan-50 border-cyan-200 text-cyan-900',
    emerald: 'from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-900',
    violet: 'from-violet-100 to-violet-50 border-violet-200 text-violet-900',
    amber: 'from-amber-100 to-amber-50 border-amber-200 text-amber-900',
    rose: 'from-rose-100 to-rose-50 border-rose-200 text-rose-900',
    slate: 'from-slate-200 to-slate-50 border-slate-300 text-slate-900',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-transform hover:-translate-y-0.5 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.12em] opacity-80">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === 'active'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'inactive'
      ? 'bg-slate-100 text-slate-700'
      : normalized === 'graduated'
      ? 'bg-cyan-100 text-cyan-700'
      : 'bg-rose-100 text-rose-700';

  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${tone}`}>{status}</span>;
}

function Th({
  label,
  onClick,
  active,
  order,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  order?: 'asc' | 'desc';
}) {
  if (!onClick) {
    return <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</th>;
  }

  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-slate-700">
        {label}
        <span className={`text-[10px] ${active ? 'opacity-100' : 'opacity-40'}`}>{order === 'asc' ? '▲' : '▼'}</span>
      </button>
    </th>
  );
}
