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
import CustomDropdown from '@/components/ui/CustomDropdown';
import MotionReveal from '@/components/ui/MotionReveal';
import TiltSurface from '@/components/ui/TiltSurface';

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
    const palette = ['#22d3ee', '#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];
    return {
      labels: departmentLabels,
      datasets: [
        {
          label: deptMetric === 'count' ? 'Students' : deptMetric === 'cgpa' ? 'Average CGPA' : 'Average Attendance (%)',
          data: departmentMetricData,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return '#22d3ee';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(14, 165, 233, 0.9)');
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0.25)');
            return deptChartType === 'line' ? 'rgba(14,165,233,0.18)' : gradient;
          },
          borderColor: deptChartType === 'line' ? '#0284c7' : palette,
          borderWidth: deptChartType === 'line' ? 3 : 1,
          borderRadius: deptChartType === 'bar' ? 12 : 0,
          maxBarThickness: 48,
          fill: deptChartType === 'line',
          tension: 0.35,
          pointRadius: deptChartType === 'line' ? 4 : 0,
          pointHoverRadius: deptChartType === 'line' ? 8 : 0,
          pointHoverBackgroundColor: '#0369a1',
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
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#38bdf8';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(56,189,248,0.95)');
          gradient.addColorStop(1, 'rgba(56,189,248,0.35)');
          return gradient;
        },
        borderRadius: 10,
        borderSkipped: false,
      });
    }
    if (genderMode !== 'male') {
      datasets.push({
        label: 'Female',
        data: femaleData,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#f472b6';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(244,114,182,0.95)');
          gradient.addColorStop(1, 'rgba(244,114,182,0.35)');
          return gradient;
        },
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
          yAxisID: 'yCgpa',
          data: yearLabels.map((year) => avg(filteredStudents.filter((s) => s.year === year).map((s) => Number(s.cgpa) || 0))),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.16)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
        },
        {
          label: 'Avg Attendance',
          yAxisID: 'yAttendance',
          data: yearLabels.map((year) => avg(filteredStudents.filter((s) => s.year === year).map((s) => Number(s.attendance) || 0))),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.14)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [filteredStudents]);

  const rankedDepartments = useMemo(() => {
    return departmentLabels
      .map((label, index) => ({ label, value: Number(departmentMetricData[index] || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [departmentLabels, departmentMetricData]);

  const maxRankValue = useMemo(() => Math.max(...rankedDepartments.map((item) => item.value), 1), [rankedDepartments]);

  const departmentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8, padding: 18 } },
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
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: {
          callback: (val: number | string) => (deptMetric === 'attendance' ? `${val}%` : val),
        },
      },
      x: { grid: { display: false } },
    },
  };

  const yearGenderChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.94)', padding: 12, cornerRadius: 10 },
    },
    scales: {
      x: { stacked: genderMode === 'stacked', grid: { display: false } },
      y: { beginAtZero: true, stacked: genderMode === 'stacked', grid: { color: 'rgba(148,163,184,0.2)' } },
    },
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.94)', padding: 12, cornerRadius: 10 },
    },
    scales: {
      yCgpa: { beginAtZero: true, max: 10, position: 'left' as const, grid: { color: 'rgba(148,163,184,0.2)' } },
      yAttendance: { beginAtZero: true, max: 100, position: 'right' as const, grid: { drawOnChartArea: false } },
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
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-cyan-100 border-t-cyan-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-violet-100 border-b-violet-400 animate-spin [animation-direction:reverse]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MotionReveal>
      <section className="interactive-card rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-blue-600 text-xs uppercase tracking-[0.2em] mb-2">Analytics Studio</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Student Intelligence Dashboard</h2>
            <p className="text-slate-500 mt-2">
              {filteredStudents.length} records in scope | Last refresh {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs text-slate-600">{now.toLocaleString()}</span>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="interactive-btn rounded-lg bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={() => setViewMode((prev) => (prev === 'table' ? 'cards' : 'table'))}
              className="interactive-btn rounded-lg bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition"
            >
              {viewMode === 'table' ? 'Card View' : 'Table View'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="interactive-btn rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 text-sm font-semibold transition disabled:opacity-70"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>
      </MotionReveal>

      {showFilters && (
        <MotionReveal delayMs={60}>
        <section className="interactive-card rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-sm">
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
              <CustomDropdown
                value={String(selectedYear)}
                onChange={(val) => setSelectedYear(val === 'All' ? 'All' : Number(val))}
                options={years.map((y) => ({
                  value: String(y),
                  label: y === 'All' ? 'All Years' : `Year ${y}`,
                }))}
              />
            </FilterLabel>

            <FilterLabel title="Status">
              <CustomDropdown
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                options={statuses.map((status) => ({
                  value: status,
                  label: status === 'All' ? 'All Statuses' : status,
                }))}
              />
            </FilterLabel>

            <FilterLabel title="Department">
              <CustomDropdown
                value={selectedDepartment}
                onChange={(val) => setSelectedDepartment(val)}
                options={departments.map((dept) => ({
                  value: dept,
                  label: dept === 'All' ? 'All Departments' : dept,
                }))}
              />
            </FilterLabel>

            <FilterLabel title="Time Window">
              <CustomDropdown
                value={timeRange}
                onChange={(val) => setTimeRange(val as TimeRange)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Days' },
                  { value: '365d', label: 'Last 12 Months' },
                ]}
              />
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
                className="interactive-btn w-full rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </section>
        </MotionReveal>
      )}

      <MotionReveal delayMs={100}>
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <Kpi title="Total Students" value={String(stats.total)} baseValue={baseStats.total} tone="cyan" />
        <Kpi title="Active" value={String(stats.active)} baseValue={baseStats.active} tone="emerald" />
        <Kpi title="Departments" value={String(stats.activeDepartments)} baseValue={baseStats.activeDepartments} tone="violet" />
        <Kpi title="Avg CGPA" value={stats.avgCgpa} baseValue={baseStats.avgCgpa} tone="amber" />
        <Kpi title="Avg Attendance" value={stats.avgAttendance} baseValue={baseStats.avgAttendance} tone="rose" />
        <Kpi title="At Risk" value={String(stats.atRisk)} baseValue={baseStats.atRisk} tone="slate" />
      </section>
      </MotionReveal>

      <MotionReveal delayMs={140}>
      <section className="interactive-card rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                  <tr key={student._id} className={`transition-all duration-200 hover:bg-cyan-50/40 hover:translate-x-[2px] ${idx % 2 ? 'bg-slate-50/50' : 'bg-white'}`}>
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
                        className="interactive-btn rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-black transition"
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
              <article key={student._id} className="interactive-card rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 hover:shadow-md transition">
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
                  className="interactive-btn mt-4 w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-3 py-2 transition"
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
      </MotionReveal>

      <MotionReveal delayMs={180}>
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TiltSurface className="interactive-card rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-sky-50/40 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Department Analytics</h3>
              <p className="text-sm text-slate-500">Interactive performance distribution by department</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['count', 'cgpa', 'attendance'] as DeptMetric[]).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setDeptMetric(metric)}
                  className={`interactive-btn px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    deptMetric === metric
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  {metric === 'count' ? 'Students' : metric === 'cgpa' ? 'Avg CGPA' : 'Avg Attendance'}
                </button>
              ))}
              <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-1">
                {(['bar', 'line'] as DeptChartType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDeptChartType(type)}
                    className={`interactive-btn px-3 py-1 rounded-full text-xs font-semibold transition ${
                      deptChartType === type ? 'bg-cyan-500 text-slate-950' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {type === 'bar' ? 'Bar' : 'Line'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3 text-xs">
            <div className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-slate-600">
              Focus: {selectedDepartment === 'All' ? 'All Departments' : selectedDepartment}
            </div>
            {selectedDepartment !== 'All' && (
              <button
                onClick={() => setSelectedDepartment('All')}
                className="interactive-btn rounded-full border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-600 hover:text-slate-900"
              >
                Clear focus
              </button>
            )}
          </div>

          <div className="h-[320px]">
            {deptChartType === 'bar' ? (
              <Bar key={`dept-bar-${deptMetric}-${selectedDepartment}`} data={departmentChartData} options={departmentChartOptions} />
            ) : (
              <Line key={`dept-line-${deptMetric}-${selectedDepartment}`} data={departmentChartData} options={departmentChartOptions} />
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rankedDepartments.map((item, index) => {
              const width = (item.value / maxRankValue) * 100;
              return (
                <button
                  key={item.label}
                  onClick={() => setSelectedDepartment(item.label)}
                  className="interactive-btn rounded-xl border border-slate-200 bg-white/90 p-3 text-left hover:shadow-sm transition"
                >
                  <p className="text-xs text-slate-500">#{index + 1}</p>
                  <p className="font-semibold text-sm text-slate-900 truncate">{item.label}</p>
                  <p className="text-xs text-slate-600 mt-1">{item.value.toFixed(deptMetric === 'count' ? 0 : 2)}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${width}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </TiltSurface>

        <TiltSurface className="interactive-card rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-violet-50/20 to-fuchsia-50/30 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cohort & Trend Analytics</h3>
              <p className="text-sm text-slate-500">Gender composition and academic progression by year</p>
            </div>
            <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-1">
              {([
                { id: 'grouped', label: 'Grouped' },
                { id: 'stacked', label: 'Stacked' },
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
              ] as Array<{ id: GenderMode; label: string }>).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setGenderMode(mode.id)}
                  className={`interactive-btn px-3 py-1 rounded-full text-xs font-semibold transition ${
                    genderMode === mode.id ? 'bg-violet-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[170px] mb-4">
            <Bar key={`year-gender-${genderMode}`} data={yearGenderChartData} options={yearGenderChartOptions} />
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/85 p-3">
            <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">Dual-Axis Trend (CGPA vs Attendance)</p>
            <div className="h-[165px]">
              <Line key={`year-trend-${selectedDepartment}-${timeRange}`} data={trendData} options={trendOptions} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3">
              <p className="text-cyan-700 font-semibold">Best Year (CGPA)</p>
              <p className="text-slate-900 mt-1">
                {(() => {
                  const scores = yearLabels.map((year) => ({
                    year,
                    score: avg(filteredStudents.filter((s) => s.year === year).map((s) => Number(s.cgpa) || 0)),
                  }));
                  const best = scores.reduce((acc, item) => (item.score > acc.score ? item : acc), { year: 1, score: 0 });
                  return `${best.year} (${best.score.toFixed(2)})`;
                })()}
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3">
              <p className="text-violet-700 font-semibold">Best Year (Attendance)</p>
              <p className="text-slate-900 mt-1">
                {(() => {
                  const scores = yearLabels.map((year) => ({
                    year,
                    score: avg(filteredStudents.filter((s) => s.year === year).map((s) => Number(s.attendance) || 0)),
                  }));
                  const best = scores.reduce((acc, item) => (item.score > acc.score ? item : acc), { year: 1, score: 0 });
                  return `${best.year} (${best.score.toFixed(1)}%)`;
                })()}
              </p>
            </div>
          </div>
        </TiltSurface>
      </section>
      </MotionReveal>
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
    cyan: 'border-cyan-200 text-cyan-900 bg-white',
    emerald: 'border-emerald-200 text-emerald-900 bg-white',
    violet: 'border-violet-200 text-violet-900 bg-white',
    amber: 'border-amber-200 text-amber-900 bg-white',
    rose: 'border-rose-200 text-rose-900 bg-white',
    slate: 'border-slate-200 text-slate-900 bg-white',
  };

  const delta = getDelta(value, String(baseValue));

  return (
    <TiltSurface className={`interactive-card rounded-xl border p-4 shadow-sm transition-colors hover:bg-slate-50 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.12em] opacity-80">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs font-semibold opacity-75">{delta}</p>
    </TiltSurface>
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
        <span className={`text-[10px] ${active ? 'opacity-100' : 'opacity-40'}`}>{order === 'asc' ? '^' : 'v'}</span>
      </button>
    </th>
  );
}
