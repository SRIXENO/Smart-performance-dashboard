'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { viewersAPI } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';

type Viewer = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  authProvider: 'local' | 'google';
  createdAt: string;
  status: 'active' | 'blocked';
  approvalStatus: 'pending' | 'approved' | 'rejected';
};

export default function AdminViewersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
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
    if (!loading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchViewers();
    }
  }, [user]);

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

  if (loading || isLoading) {
    return <div className="text-gray-700">Loading viewers...</div>;
  }

  if (user?.role !== 'admin') {
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
    </div>
  );
}
