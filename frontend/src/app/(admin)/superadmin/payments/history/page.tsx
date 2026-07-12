'use client';

import { useState, useEffect } from 'react';
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

export default function PaymentHistoryPage() {
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Payment[]>('/admin/payments');
      setPaymentHistory((data || []).filter(p => p.status !== 'pending'));
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 min-h-full rounded-2xl pb-8">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <p className="text-sm text-gray-500 mt-1">Past approved or rejected payments.</p>
        </div>
        
        {error ? (
          <div className="p-6 text-red-600 bg-red-50">{error}</div>
        ) : loading ? (
          <div className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm mt-1">No payment history available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">User & Tenant</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Method & TrxID</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Plan & Amount</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right font-medium tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentHistory.map(payment => (
                  <tr key={payment._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-semibold">{payment.userId?.name}</div>
                      <div className="text-xs text-indigo-600 font-medium">{payment.tenantId?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-700 capitalize mb-1 border border-gray-200">
                        {payment.method}
                      </span>
                      <div className="text-xs font-mono bg-gray-50 text-gray-600 p-1.5 rounded border border-gray-200">{payment.transactionId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 capitalize font-bold">{payment.planId}</div>
                      <div className="text-xs text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded-full mt-1 border border-emerald-100">
                        {payment.amount} {payment.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {new Date(payment.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        payment.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
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
