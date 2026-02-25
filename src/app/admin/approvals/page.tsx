'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { approvalsAPI } from '@/lib/api';

type PendingUser = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  authProvider: 'local' | 'google';
  createdAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
};

export default function AdminApprovalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchPending = async () => {
    try {
      const response = await approvalsAPI.getPending();
      setPendingUsers(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pending approvals');
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
      fetchPending();
    }
  }, [user]);

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setUpdatingId(id);
    setError('');
    try {
      await approvalsAPI.updateDecision(id, decision);
      setPendingUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${decision} user`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || isLoading) {
    return <div className="text-gray-700">Loading approvals...</div>;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Approve or reject new viewer registrations (local + Google)</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.userId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{item.authProvider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision(item._id, 'approved')}
                        disabled={updatingId === item._id}
                        className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(item._id, 'rejected')}
                        disabled={updatingId === item._id}
                        className="px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No pending approvals.</div>
        )}
      </div>
    </div>
  );
}
