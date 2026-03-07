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
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [loading, router, user]);

  useEffect(() => {
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

    fetchHistory();
  }, [user]);

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
