'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { viewersAPI } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { hasPermission } from '@/lib/permissions';
import type { User } from '@/types';

type Viewer = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  authProvider: 'local' | 'google';
  createdAt: string;
  status: 'active' | 'blocked';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  permissions?: User['permissions'];
};

const PERMISSION_FIELDS = [
  { key: 'studentsView', label: 'View Students' },
  { key: 'studentsManage', label: 'Manage Students' },
  { key: 'performanceView', label: 'View Performance' },
  { key: 'performanceEdit', label: 'Edit Performance' },
  { key: 'subjectsAssign', label: 'Assign Subjects' },
  { key: 'reportsExport', label: 'Export Reports' },
  { key: 'dashboardView', label: 'View Dashboard' },
  { key: 'importManage', label: 'Manage Imports' },
  { key: 'activitiesView', label: 'View Login History' },
] as const;

export default function AdminViewersPage() {
  const { user, loading } = useAuth();
  const canManageViewers = hasPermission(user, 'viewers.manage');
  const router = useRouter();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [permissionEditor, setPermissionEditor] = useState<{ userId: string; name: string; permissions: Record<string, boolean> } | null>(null);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmStyle: 'primary' as 'danger' | 'primary' | 'warning',
  });

  const fetchViewers = async () => {
    try {
      const response = await viewersAPI.getAll();
      setViewers(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load viewers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !canManageViewers) {
      router.push('/dashboard');
    }
  }, [canManageViewers, loading, router]);

  useEffect(() => {
    if (canManageViewers) {
      fetchViewers();
    }
  }, [canManageViewers]);

  const openStatusConfirm = (item: Viewer, nextStatus: 'active' | 'blocked') => {
    const isBlocking = nextStatus === 'blocked';
    setConfirmModal({
      isOpen: true,
      title: isBlocking ? 'Block Viewer?' : 'Unblock Viewer?',
      message: isBlocking
        ? `Block ${item.name}? They will not be able to access the system.`
        : `Unblock ${item.name}? They will be able to access the system again.`,
      confirmText: isBlocking ? 'Block' : 'Unblock',
      confirmStyle: isBlocking ? 'warning' : 'primary',
      onConfirm: async () => {
        setActioningId(item._id);
        setError('');
        try {
          await viewersAPI.updateStatus(item._id, nextStatus);
          setViewers((prev) =>
            prev.map((v) => (v._id === item._id ? { ...v, status: nextStatus, approvalStatus: 'approved' } : v))
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to update viewer status');
        } finally {
          setActioningId(null);
        }
      }
    });
  };

  const openDeleteConfirm = (item: Viewer) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Viewer?',
      message: `Delete ${item.name} permanently? This cannot be undone.`,
      confirmText: 'Delete',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setActioningId(item._id);
        setError('');
        try {
          await viewersAPI.delete(item._id);
          setViewers((prev) => prev.filter((v) => v._id !== item._id));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to delete viewer');
        } finally {
          setActioningId(null);
        }
      }
    });
  };

  const openPermissionEditor = (item: Viewer) => {
    setPermissionEditor({
      userId: item._id,
      name: item.name,
      permissions: Object.fromEntries(PERMISSION_FIELDS.map(({ key }) => [key, Boolean(item.permissions?.[key])])),
    });
  };

  const savePermissions = async () => {
    if (!permissionEditor) return;
    setActioningId(permissionEditor.userId);
    setError('');
    try {
      await viewersAPI.updatePermissions(permissionEditor.userId, permissionEditor.permissions);
      setViewers((prev) => prev.map((viewer) => (
        viewer._id === permissionEditor.userId
          ? { ...viewer, permissions: { ...permissionEditor.permissions } }
          : viewer
      )));
      setPermissionEditor(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update permissions');
    } finally {
      setActioningId(null);
    }
  };

  if (loading || isLoading) {
    return <div className="text-gray-700">Loading viewers...</div>;
  }

  if (!canManageViewers) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Viewers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage viewer accounts: block, unblock, and delete</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viewers.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.userId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{item.authProvider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.approvalStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.approvalStatus === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {item.status === 'active' ? (
                        <button
                          onClick={() => openStatusConfirm(item, 'blocked')}
                          disabled={actioningId === item._id}
                          className="px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          onClick={() => openStatusConfirm(item, 'active')}
                          disabled={actioningId === item._id}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Unblock
                        </button>
                      )}
                      <button
                        onClick={() => openPermissionEditor(item)}
                        disabled={actioningId === item._id}
                        className="px-3 py-1.5 rounded-md bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        Permissions
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(item)}
                        disabled={actioningId === item._id}
                        className="px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {viewers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No viewer accounts found.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmStyle={confirmModal.confirmStyle}
        cancelText="Cancel"
        loading={actioningId !== null}
      />

      {permissionEditor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Permission Matrix</h2>
              <p className="mt-1 text-sm text-slate-500">Update module access for {permissionEditor.name}.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 py-5">
              {PERMISSION_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm">
                  <span className="text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(permissionEditor.permissions[key])}
                    onChange={(e) => setPermissionEditor((prev) => prev ? {
                      ...prev,
                      permissions: { ...prev.permissions, [key]: e.target.checked },
                    } : prev)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setPermissionEditor(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                disabled={actioningId === permissionEditor.userId}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {actioningId === permissionEditor.userId ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
