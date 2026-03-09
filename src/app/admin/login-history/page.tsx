'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { activityAPI } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { hasPermission } from '@/lib/permissions';

type LoginHistoryItem = {
  id: string;
  userName: string;
  email: string;
  date: string;
  loginMethod: string;
  role: string;
};

export default function AdminLoginHistoryPage() {
  const { user, loading } = useAuth();
  const canViewActivities = hasPermission(user, 'activities.view');
  const router = useRouter();
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, limit: 50 });
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmStyle: 'danger' as 'danger' | 'primary' | 'warning',
  });

  const fetchHistory = async (nextPage = page) => {
    if (!canViewActivities) return;

    try {
      const response = await activityAPI.getLoginHistory({
        page: nextPage,
        limit: 50,
        search: search || undefined,
        role: roleFilter || undefined,
        loginMethod: methodFilter || undefined,
        from: fromDateTime || undefined,
        to: toDateTime || undefined,
      });
      setHistory(response.data.data?.items || []);
      setPagination(response.data.data?.pagination || { currentPage: 1, totalPages: 1, totalRecords: 0, limit: 50 });
      setPage(nextPage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load login history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !canViewActivities) {
      router.push('/dashboard');
    }
  }, [canViewActivities, loading, router]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchHistory(1);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [user, search, roleFilter, methodFilter, fromDateTime, toDateTime]);

  const executeClearByRange = async () => {
    setIsClearing(true);
    try {
      const response = await activityAPI.clearLoginHistory(fromDateTime, toDateTime);
      const deletedCount = response.data?.data?.deletedCount ?? 0;
      setMessage(`Cleared ${deletedCount} login records.`);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      await fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear login history');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearByRange = async () => {
    setError('');
    setMessage('');

    if (!fromDateTime || !toDateTime) {
      setError('Please select both From and To date-time');
      return;
    }

    if (new Date(fromDateTime) > new Date(toDateTime)) {
      setError('From date-time must be earlier than To date-time');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Clear Login History?',
      message: `Clear login history from ${new Date(fromDateTime).toLocaleString()} to ${new Date(toDateTime).toLocaleString()}?`,
      confirmText: 'Clear',
      confirmStyle: 'danger',
      onConfirm: executeClearByRange,
    });
  };

  if (loading || isLoading) {
    return <div className="text-gray-700">Loading login history...</div>;
  }

  if (!canViewActivities) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Login History</h1>
        <p className="text-sm text-gray-500 mt-1">Admin-only audit log of user sign-ins</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">All Methods</option>
              <option value="local">Local</option>
              <option value="google">Google</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              type="datetime-local"
              value={fromDateTime}
              onChange={(e) => setFromDateTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              type="datetime-local"
              value={toDateTime}
              onChange={(e) => setToDateTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleClearByRange}
            disabled={isClearing}
            className="px-4 py-2 rounded-md bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
          >
            {isClearing ? 'Clearing...' : 'Clear by Date-Time'}
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{item.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{item.loginMethod}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(item.date).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {history.length === 0 && (
          <div className="text-center py-12 text-gray-500">No login history found.</div>
        )}
      </div>

      {history.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} records)
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => fetchHistory(page - 1)} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Prev</button>
            <button disabled={page >= pagination.totalPages} onClick={() => fetchHistory(page + 1)} className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        </div>
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
        loading={isClearing}
      />
    </div>
  );
}
