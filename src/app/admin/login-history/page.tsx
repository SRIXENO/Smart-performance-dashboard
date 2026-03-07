'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { activityAPI } from '@/lib/api';

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
  const router = useRouter();
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (user?.role !== 'admin') return;

    try {
      const response = await activityAPI.getLoginHistory();
      setHistory(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load login history');
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
    fetchHistory();
  }, [user]);

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

    const confirm = window.confirm('Clear login history for this date-time range?');
    if (!confirm) return;

    setIsClearing(true);
    try {
      const response = await activityAPI.clearLoginHistory(fromDateTime, toDateTime);
      const deletedCount = response.data?.data?.deletedCount ?? 0;
      setMessage(`Cleared ${deletedCount} login records.`);
      await fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear login history');
    } finally {
      setIsClearing(false);
    }
  };

  if (loading || isLoading) {
    return <div className="text-gray-700">Loading login history...</div>;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Login History</h1>
        <p className="text-sm text-gray-500 mt-1">Admin-only audit log of user sign-ins</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
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
    </div>
  );
}
