'use client';

import { useState } from 'react';

interface FilterOptions {
  department?: string;
  year?: number;
  semester?: string;
  dateRange?: { start: string; end: string };
  performanceCategory?: string;
  subject?: string;
}

interface SmartFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  showDepartment?: boolean;
  showYear?: boolean;
  showSemester?: boolean;
  showDateRange?: boolean;
  showPerformanceCategory?: boolean;
  showSubject?: boolean;
}

export default function SmartFilter({
  onFilterChange,
  showDepartment = true,
  showYear = true,
  showSemester = true,
  showDateRange = false,
  showPerformanceCategory = false,
  showSubject = false
}: SmartFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil'
  ];

  const years = [1, 2, 3, 4];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const performanceCategories = ['Excellent', 'Good', 'Average', 'Poor', 'At Risk'];

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Filters</span>
          </button>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {showDepartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {showYear && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
          )}

          {showSemester && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                value={filters.semester || ''}
                onChange={(e) => handleFilterChange('semester', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          )}

          {showPerformanceCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performance
              </label>
              <select
                value={filters.performanceCategory || ''}
                onChange={(e) => handleFilterChange('performanceCategory', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {performanceCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {showDateRange && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
