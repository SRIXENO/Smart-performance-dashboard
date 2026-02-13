'use client';

import { useEffect, useState } from 'react';
import { subjectsAPI } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import SuccessToast from '@/components/SuccessToast';
import { useAuth } from '@/context/AuthContext';

interface Subject {
  code: string;
  name: string;
}

export default function SubjectManagement() {
  const { user } = useAuth();
  const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    department: '',
    year: 1,
    subjects: [] as Subject[]
  });
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger' as 'danger' | 'warning' | 'info'
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];

  useEffect(() => {
    fetchSubjectGroups();
  }, []);

  const fetchSubjectGroups = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjectGroups(response.data.data.subjectGroups);
    } catch (error) {
      console.error('Failed to fetch subject groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (subjectCode.trim() && subjectName.trim()) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, { code: subjectCode.trim().toUpperCase(), name: subjectName.trim() }]
      }));
      setSubjectCode('');
      setSubjectName('');
    } else {
      setErrorMessage('Please enter both subject code and name');
      setShowErrorToast(true);
    }
  };

  const handleRemoveSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.subjects.length === 0) {
      setErrorMessage('Please add at least one subject');
      setShowErrorToast(true);
      return;
    }

    try {
      if (editingId) {
        await subjectsAPI.update(editingId, { subjects: formData.subjects });
        setSuccessMessage('Subjects updated successfully!');
      } else {
        await subjectsAPI.assign(formData);
        setSuccessMessage('Subjects assigned successfully!');
      }
      
      setShowSuccessToast(true);
      setShowForm(false);
      setEditingId(null);
      setFormData({ department: '', year: 1, subjects: [] });
      fetchSubjectGroups();
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.response?.data?.message || 'Failed to save subjects');
    }
  };

  const handleEdit = (group: any) => {
    setEditingId(group._id);
    setFormData({
      department: group.department,
      year: group.year,
      subjects: [...group.subjects]
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, department: string, year: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Subject Group?',
      message: `Are you sure you want to delete subjects for ${department} Year ${year}? All students in this group will lose their assigned subjects. This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await subjectsAPI.delete(id);
          setConfirmModal({ ...confirmModal, isOpen: false });
          fetchSubjectGroups();
        } catch (error) {
          alert('Failed to delete subject group');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ department: '', year: 1, subjects: [] });
    setSubjectCode('');
    setSubjectName('');
  };

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subject Management</h1>
          <p className="text-gray-600 mt-2">Assign subjects by department and year - automatically applies to all matching students</p>
        </div>
        {!showForm && user?.role !== 'viewer' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Assign Subjects</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Subject Group' : 'Assign New Subject Group'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                <select
                  required
                  disabled={!!editingId}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                <select
                  required
                  disabled={!!editingId}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Subjects *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="Subject Code (e.g., CS301)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                  placeholder="Subject Name (e.g., Database Systems)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {formData.subjects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Subjects ({formData.subjects.length})
                </label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-4 border-b border-gray-200">
                    <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Code</div>
                    <div className="col-span-7 text-xs font-semibold text-gray-600 uppercase">Subject Name</div>
                    <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase text-right">Action</div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-blue-50 transition-colors">
                        <div className="col-span-3">
                          <span className="font-bold text-blue-900 text-sm">{subject.code}</span>
                        </div>
                        <div className="col-span-7">
                          <span className="text-gray-700 text-sm">{subject.name}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            title="Remove subject"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                {editingId ? 'Update & Apply to Students' : 'Assign to Students'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Subject Groups ({subjectGroups.length})</h2>
        </div>
        
        {subjectGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No subject groups assigned yet. Click "Assign Subjects" to create one.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {subjectGroups.map((group) => (
              <div key={group._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{group.department}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Year {group.year}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {group.subjects.length} Subjects
                      </span>
                    </div>
                    
                    <button
                      onClick={() => toggleExpand(group._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-3"
                    >
                      {expandedGroups.has(group._id) ? '▼ Hide Subjects' : '▶ Show Subjects'}
                    </button>

                    {expandedGroups.has(group._id) && (
                      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-4 border-b border-gray-200">
                          <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Code</div>
                          <div className="col-span-9 text-xs font-semibold text-gray-600 uppercase">Subject Name</div>
                        </div>
                        <div className="divide-y divide-gray-200 bg-white">
                          {group.subjects.map((subject: Subject, idx: number) => (
                            <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                              <div className="col-span-3">
                                <span className="font-bold text-blue-900 text-sm">{subject.code}</span>
                              </div>
                              <div className="col-span-9">
                                <span className="text-gray-700 text-sm truncate block">{subject.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(group.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  {user?.role !== 'viewer' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(group)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(group._id, group.department, group.year)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
