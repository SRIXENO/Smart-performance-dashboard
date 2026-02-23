'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { studentsAPI } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

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
  enrollmentDate?: string;
};

type SortKey = 'name' | 'year' | 'cgpa' | 'attendance';
type ViewMode = 'table' | 'cards';
type DeptMetric = 'count' | 'cgpa' | 'attendance';
type DeptChartType = 'bar' | 'line';
type GenderMode = 'grouped' | 'stacked' | 'male' | 'female';
type TimeRange = 'all' | '30d' | '90d' | '365d';

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
  const [selectedDepartment, setSelectedDepartment] = useState<'All' | string>('All');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(true);

  const [deptMetric, setDeptMetric] = useState<DeptMetric>('count');
  const [deptChartType, setDeptChartType] = useState<DeptChartType>('bar');
  const [genderMode, setGenderMode] = useState<GenderMode>('grouped');

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
      const response = await studentsAPI.getAll({ limit: 2000 });
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

  const departments = useMemo(() => {
    return ['All', ...Array.from(new Set(students.map((s) => s.department).filter(Boolean))).sort()] as Array<'All' | string>;
  }, [students]);

  const rangeFilteredStudents = useMemo(() => {
    if (timeRange === 'all') return students;
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const withDates = students.filter((s) => s.enrollmentDate);
    if (!withDates.length) return students;
    return students.filter((s) => {
      if (!s.enrollmentDate) return true;
      const dt = new Date(s.enrollmentDate);
      return !Number.isNaN(dt.getTime()) && dt >= cutoff;
    });
  }, [students, timeRange]);

  const filteredStudents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const filtered = rangeFilteredStudents.filter((student) => {
      const matchesSearch =
        !normalized ||
        student.name?.toLowerCase().includes(normalized) ||
        student.studentId?.toLowerCase().includes(normalized) ||
        student.department?.toLowerCase().includes(normalized) ||
        student.email?.toLowerCase().includes(normalized);

      const matchesYear = selectedYear === 'All' || student.year === selectedYear;
      const matchesStatus = selectedStatus === 'All' || (student.status || '').toLowerCase() === selectedStatus.toLowerCase();
      const matchesDepartment =
        selectedDepartment === 'All' || (student.department || '').toLowerCase() === selectedDepartment.toLowerCase();

      return matchesSearch && matchesYear && matchesStatus && matchesDepartment;
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortKey === 'year') {
        return sortOrder === 'asc' ? (a.year || 0) - (b.year || 0) : (b.year || 0) - (a.year || 0);
      }
      if (sortKey === 'cgpa') {
        return sortOrder === 'asc' ? (Number(a.cgpa) || 0) - (Number(b.cgpa) || 0) : (Number(b.cgpa) || 0) - (Number(a.cgpa) || 0);
      }
      return sortOrder === 'asc'
        ? (Number(a.attendance) || 0) - (Number(b.attendance) || 0)
        : (Number(b.attendance) || 0) - (Number(a.attendance) || 0);
    });
  }, [searchTerm, selectedYear, selectedStatus, selectedDepartment, sortKey, sortOrder, rangeFilteredStudents]);

  const baseStats = useMemo(() => computeStats(rangeFilteredStudents), [rangeFilteredStudents]);
  const stats = useMemo(() => computeStats(filteredStudents), [filteredStudents]);

  const departmentLabels = useMemo(
    () => Array.from(new Set(filteredStudents.map((s) => s.department).filter((dept): dept is string => Boolean(dept)))),
    [filteredStudents],
  );

  const departmentMetricData = useMemo(() => {
    if (deptMetric === 'count') return departmentLabels.map((dept) => filteredStudents.filter((s) => s.department === dept).length);
    if (deptMetric === 'cgpa') {
      return departmentLabels.map((dept) => avg(filteredStudents.filter((s) => s.department === dept).map((s) => Number(s.cgpa) || 0)));
    }
    return departmentLabels.map((dept) => avg(filteredStudents.filter((s) => s.department === dept).map((s) => Number(s.attendance) || 0)));
  }, [departmentLabels, deptMetric, filteredStudents]);

  const yearLabels = [1, 2, 3, 4];
  const maleData = yearLabels.map(
    (year) => filteredStudents.filter((s) => s.year === year && (s.gender || '').toLowerCase() === 'male').length,
  );
  const femaleData = yearLabels.map(
    (year) => filteredStudents.filter((s) => s.year === year && (s.gender || '').toLowerCase() === 'female').length,
  );

  const departmentChartData = useMemo(() => {
    const palette = ['#22d3ee', '#06b6d4', '#34d399', '#a78bfa', '#f59e0b', '#f472b6'];
    return {
      labels: departmentLabels,
      datasets: [
        {
          label: deptMetric === 'count' ? 'Students' : deptMetric === 'cgpa' ? 'Average CGPA' : 'Average Attendance (%)',
          data: departmentMetricData,
          backgroundColor: palette,
          borderColor: '#0f172a',
          borderWidth: deptChartType === 'line' ? 2 : 0,
          borderRadius: deptChartType === 'bar' ? 12 : 0,
          fill: deptChartType === 'line',
          tension: 0.35,
          pointRadius: deptChartType === 'line' ? 4 : 0,
          pointHoverRadius: deptChartType === 'line' ? 6 : 0,
        },
      ],
    };
  }, [departmentLabels, departmentMetricData, deptMetric, deptChartType]);

  const yearGenderChartData = useMemo(() => {
    const datasets = [];
    if (genderMode !== 'female') {
      datasets.push({
        label: 'Male',
        data: maleData,
        backgroundColor: '#38bdf8',
        borderRadius: 10,
        borderSkipped: false,
      });
    }
    if (genderMode !== 'male') {
      datasets.push({
        label: 'Female',
        data: femaleData,
        backgroundColor: '#f472b6',
        borderRadius: 10,
        borderSkipped: false,
      });
    }
    return { labels: yearLabels.map((year) => `Year ${year}`), datasets };
  }, [femaleData, genderMode, maleData]);

  const trendData = useMemo(() => {
    return {
      labels: yearLabels.map((year) => `Year ${year}`),
      datasets: [
        {
          label: 'Avg CGPA',
          data: yearLabels.map((year) => avg(filteredStudents.filter((s) => s.year === year).map((s) => Number(s.cgpa) || 0))),
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34,211,238,0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: 'Avg Attendance',
          data: yearLabels.map((year) => avg(filteredStudents.filter((s) => s.year === year).map((s) => Number(s.attendance) || 0))),
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167,139,250,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }, [filteredStudents]);

  const departmentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        padding: 12,
        cornerRadius: 10,
      },
    },
    onClick: (_event: unknown, elements: Array<{ index: number }>) => {
      if (!elements.length) return;
      const index = elements[0].index;
      const dept = departmentLabels[index];
      if (dept) setSelectedDepartment(dept);
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: deptMetric === 'cgpa' ? 10 : undefined,
        grid: { color: '#e2e8f0' },
      },
      x: { grid: { display: false } },
    },
  };

  const yearGenderChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.94)', padding: 12, cornerRadius: 10 },
    },
    scales: {
      x: { stacked: genderMode === 'stacked', grid: { display: false } },
      y: { beginAtZero: true, stacked: genderMode === 'stacked', grid: { color: '#e2e8f0' } },
    },
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.94)', padding: 12, cornerRadius: 10 },
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
            <p className="text-cyan-300 text-xs uppercase tracking-[0.2em] mb-2">Analytics Studio</p>
            <h2 className="text-3xl font-black tracking-tight">Student Intelligence Dashboard</h2>
            <p className="text-slate-300 mt-2">
              {filteredStudents.length} records in scope • Last refresh {lastRefreshed.toLocaleTimeString()}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <FilterLabel title="Search">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, ID, email..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </FilterLabel>

            <FilterLabel title="Year">
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
            </FilterLabel>

            <FilterLabel title="Status">
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
            </FilterLabel>

            <FilterLabel title="Department">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </FilterLabel>

            <FilterLabel title="Time Window">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all">All Time</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="365d">Last 12 Months</option>
              </select>
            </FilterLabel>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear('All');
                  setSelectedStatus('All');
                  setSelectedDepartment('All');
                  setTimeRange('all');
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <Kpi title="Total Students" value={String(stats.total)} baseValue={baseStats.total} tone="cyan" />
        <Kpi title="Active" value={String(stats.active)} baseValue={baseStats.active} tone="emerald" />
        <Kpi title="Departments" value={String(stats.activeDepartments)} baseValue={baseStats.activeDepartments} tone="violet" />
        <Kpi title="Avg CGPA" value={stats.avgCgpa} baseValue={baseStats.avgCgpa} tone="amber" />
        <Kpi title="Avg Attendance" value={stats.avgAttendance} baseValue={baseStats.avgAttendance} tone="rose" />
        <Kpi title="At Risk" value={String(stats.atRisk)} baseValue={baseStats.atRisk} tone="slate" />
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Department Analytics</h3>
              <p className="text-sm text-slate-500">Click chart bars or points to filter department</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={deptMetric}
                onChange={(e) => setDeptMetric(e.target.value as DeptMetric)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <option value="count">Students</option>
                <option value="cgpa">Avg CGPA</option>
                <option value="attendance">Avg Attendance</option>
              </select>
              <select
                value={deptChartType}
                onChange={(e) => setDeptChartType(e.target.value as DeptChartType)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
            </div>
          </div>

          <div className="h-[340px]">
            {deptChartType === 'bar' ? (
              <Bar key={`dept-bar-${deptMetric}-${selectedDepartment}`} data={departmentChartData} options={departmentChartOptions} />
            ) : (
              <Line key={`dept-line-${deptMetric}-${selectedDepartment}`} data={departmentChartData} options={departmentChartOptions} />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cohort & Trend Analytics</h3>
              <p className="text-sm text-slate-500">Gender mix and academic movement by year</p>
            </div>
            <select
              value={genderMode}
              onChange={(e) => setGenderMode(e.target.value as GenderMode)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option value="grouped">Grouped</option>
              <option value="stacked">Stacked</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>
          <div className="h-[160px] mb-4">
            <Bar key={`year-gender-${genderMode}`} data={yearGenderChartData} options={yearGenderChartOptions} />
          </div>
          <div className="h-[160px]">
            <Line key={`year-trend-${selectedDepartment}-${timeRange}`} data={trendData} options={trendOptions} />
          </div>
        </div>
      </section>
    </div>
  );
}

function computeStats(list: StudentRow[]) {
  const total = list.length;
  const active = list.filter((s) => (s.status || '').toLowerCase() === 'active').length;
  const activeDepartments = new Set(list.map((s) => s.department).filter(Boolean)).size;
  const avgCgpaValue = avg(list.map((s) => Number(s.cgpa) || 0));
  const avgAttendanceValue = avg(list.map((s) => Number(s.attendance) || 0));
  const atRisk = list.filter((s) => {
    const lowAttendance = (Number(s.attendance) || 0) > 0 && (Number(s.attendance) || 0) < 75;
    const lowCgpa = (Number(s.cgpa) || 0) > 0 && (Number(s.cgpa) || 0) < 6;
    return lowAttendance || lowCgpa;
  }).length;

  return {
    total,
    active,
    activeDepartments,
    avgCgpa: avgCgpaValue > 0 ? avgCgpaValue.toFixed(2) : 'N/A',
    avgAttendance: avgAttendanceValue > 0 ? `${avgAttendanceValue.toFixed(1)}%` : 'N/A',
    atRisk,
  };
}

function avg(values: number[]) {
  const clean = values.filter((n) => !Number.isNaN(n) && n > 0);
  if (!clean.length) return 0;
  return clean.reduce((sum, n) => sum + n, 0) / clean.length;
}

function FilterLabel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</label>
      {children}
    </div>
  );
}

function Kpi({
  title,
  value,
  baseValue,
  tone,
}: {
  title: string;
  value: string;
  baseValue: string | number;
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

  const delta = getDelta(value, String(baseValue));

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-transform hover:-translate-y-0.5 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.12em] opacity-80">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs font-semibold opacity-75">{delta}</p>
    </div>
  );
}

function getDelta(current: string, base: string) {
  const currentNum = Number(String(current).replace('%', ''));
  const baseNum = Number(String(base).replace('%', ''));
  if (Number.isNaN(currentNum) || Number.isNaN(baseNum) || baseNum === 0) return 'Scope adjusted';
  const percent = ((currentNum - baseNum) / baseNum) * 100;
  if (Math.abs(percent) < 0.1) return 'No material change';
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}% vs scope baseline`;
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
