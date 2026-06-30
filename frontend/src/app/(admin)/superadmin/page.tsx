'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Activity, Database, Server, Clock } from 'lucide-react';
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

interface SystemStatus {
  database: string;
  apiGateway: string;
  version: string;
  uptime: number;
  timestamp: string;
}

export default function SuperAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, statusData] = await Promise.all([
        apiClient.get<Payment[]>('/admin/payments?status=pending'),
        apiClient.get<SystemStatus>('/admin/status')
      ]);
      setPayments(paymentsData || []);
      setSysStatus(statusData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data (Are you a superadmin?)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      apiClient.get<SystemStatus>('/admin/status').then(setSysStatus).catch(() => {});
    }, 30000); // refresh status every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/admin/payments/${id}/${action}`, {});
      setPayments(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.message || `Failed to ${action} payment`);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Platform overview, system health, and pending actions.</p>
          </div>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <Database className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-sm">Database</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${sysStatus?.database === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xl font-semibold text-white capitalize">
              {sysStatus?.database || 'Checking...'}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <Server className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-sm">API Gateway</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${sysStatus?.apiGateway === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xl font-semibold text-white capitalize">
              {sysStatus?.apiGateway || 'Checking...'}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-sm">Uptime</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {sysStatus ? formatUptime(sysStatus.uptime) : '0d 0h 0m'}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-sm">Platform Version</span>
          </div>
          <div className="text-xl font-semibold text-white">
            v{sysStatus?.version || '0.0.0'}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Pending Manual Payments</h2>
          <p className="text-sm text-gray-400 mt-1">Review and approve bank transfers or crypto payments.</p>
        </div>
        
        {error ? (
          <div className="p-6 text-red-400">{error}</div>
        ) : loading ? (
          <div className="p-6 text-gray-400 flex items-center justify-center min-h-[200px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-lg">All caught up!</p>
            <p className="text-sm mt-1">No pending payments require your attention.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-950/50 text-xs uppercase text-gray-500 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">User & Tenant</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Method & TrxID</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Plan & Amount</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {payments.map(payment => (
                  <tr key={payment._id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold">{payment.userId?.name}</div>
                      <div className="text-xs text-indigo-400">{payment.tenantId?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-800 text-xs font-medium text-gray-300 capitalize mb-1">
                        {payment.method}
                      </span>
                      <div className="text-xs font-mono bg-black/20 p-1 rounded border border-gray-800/50">{payment.transactionId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white capitalize font-medium">{payment.planId}</div>
                      <div className="text-xs text-emerald-400 font-medium">{payment.amount} {payment.currency}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button 
                        onClick={() => handleAction(payment._id, 'approve')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 rounded-lg transition-all"
                        title="Approve & Upgrade Plan"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(payment._id, 'reject')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded-lg transition-all"
                        title="Reject Payment"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
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
