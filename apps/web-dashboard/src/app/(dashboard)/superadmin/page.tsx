'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Payment {
  _id: string;
  tenantId: { _id: string; name: string };
  userId: { _id: string; name: string; email: string };
  method: string;
  transactionId: string;
  amount: number;
  currency: string;
  planId: string;
  status: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: Payment[] }>('/admin/payments?status=pending');
      setPayments(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments (Are you a superadmin?)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/admin/payments/${id}/${action}`, {});
      setPayments(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.message || `Failed to ${action} payment`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Super Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage manual payments and platform settings.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-medium text-white">Pending Payments</h2>
        </div>
        
        {error ? (
          <div className="p-6 text-red-400">{error}</div>
        ) : loading ? (
          <div className="p-6 text-gray-400">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="p-6 text-gray-400">No pending payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-800/50 text-xs uppercase text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">User & Tenant</th>
                  <th className="px-6 py-4">Method & TrxID</th>
                  <th className="px-6 py-4">Plan & Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {payments.map(payment => (
                  <tr key={payment._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{payment.userId?.name}</div>
                      <div className="text-xs">{payment.tenantId?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white capitalize">{payment.method}</div>
                      <div className="text-xs font-mono">{payment.transactionId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white capitalize">{payment.planId}</div>
                      <div className="text-xs">{payment.amount} {payment.currency}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button 
                        onClick={() => handleAction(payment._id, 'approve')}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Approve & Upgrade Plan"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAction(payment._id, 'reject')}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Reject Payment"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
