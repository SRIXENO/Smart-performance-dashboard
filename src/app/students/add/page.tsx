'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentsAPI } from '@/lib/api';
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

export default function AddStudent() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    year: 1,
    phone: '',
    dateOfBirth: '',
    gender: '',
    rollNumber: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/students');
    }
  }, [authLoading, router, user?.role]);

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electrical and Communication Engineering',
    'Electrical and Electronic Engineering',
    'Mechanical',
    'Civil',
    'Biotechnology',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'year' ? parseInt(value) : value
      };

      if (name === 'rollNumber') {
        const detectedDepartment = detectDepartmentFromRegisterNumber(value);
        if (detectedDepartment) {
          next.department = detectedDepartment;
        }
      }

      return next;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone number must be 10 digits';
    if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Register number is required';

    // Check if student is at least 16 years old
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16) newErrors.dateOfBirth = 'Student must be at least 16 years old';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await studentsAPI.create(formData);
      router.push('/students');
    } catch (error: any) {
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('email')) {
          setErrors({ email: 'This email is already registered' });
        } else {
          setErrors({ general: error.response.data.error });
        }
      } else {
        setErrors({ general: 'Failed to create student' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Student</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Min 8 characters"
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <CustomDropdown
                value={formData.department}
                onChange={(value) => handleChange({ target: { name: 'department', value } } as React.ChangeEvent<HTMLSelectElement>)}
                placeholder="Select Department"
                options={[
                  { value: '', label: 'Select Department' },
                  ...departments.map((dept) => ({ value: dept, label: dept })),
                ]}
              />
              {errors.department && <p className="text-red-600 text-sm mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <CustomDropdown
                value={String(formData.year)}
                onChange={(value) => handleChange({ target: { name: 'year', value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: '1', label: 'Year 1' },
                  { value: '2', label: 'Year 2' },
                  { value: '3', label: 'Year 3' },
                  { value: '4', label: 'Year 4' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <CustomDropdown
                value={formData.gender}
                onChange={(value) => handleChange({ target: { name: 'gender', value } } as React.ChangeEvent<HTMLSelectElement>)}
                placeholder="Select Gender"
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10 digit phone number"
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register Number *
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rollNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter register number"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: <span className="font-mono">7376241CS515</span> → CS maps to Computer Science
              </p>
              {errors.rollNumber && <p className="text-red-600 text-sm mt-1">{errors.rollNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enrollment Date *
              </label>
              <input
                type="date"
                name="enrollmentDate"
                value={formData.enrollmentDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <CustomDropdown
                value={formData.status}
                onChange={(value) => handleChange({ target: { name: 'status', value } } as React.ChangeEvent<HTMLSelectElement>)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/students')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
