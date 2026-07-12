'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Activity, Database, Server, Clock, Cpu, MemoryStick, Users, Key, FolderKanban, Building2 } from 'lucide-react';
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
  cpuUsage: number;
  ramUsage: {
    total: number;
    used: number;
    percentage: number;
  };
}

interface DashboardStats {
  totalTenants: number;
  totalProjects: number;
  totalUsers: number;
  pendingPayments: number;
  totalLicenses: number;
  activeLicenses: number;
}

export default function SuperAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, statusData, statsData] = await Promise.all([
        apiClient.get<Payment[]>('/admin/payments'),
        apiClient.get<SystemStatus>('/admin/status'),
        apiClient.get<DashboardStats>('/admin/stats')
      ]);
      const allPayments = paymentsData || [];
      setPayments(allPayments.filter(p => p.status === 'pending'));
      setPaymentHistory(allPayments.filter(p => p.status !== 'pending'));
      setSysStatus(statusData);
      setStats(statsData);
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
      apiClient.get<DashboardStats>('/admin/stats').then(setStats).catch(() => {});
    }, 30000); // refresh status every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/admin/payments/${id}/${action}`, {});
      setPayments(prev => prev.filter(p => p._id !== id));
      fetchData(); // refresh stats after approval/rejection
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

  const handleBackup = async () => {
    try {
      const data = await apiClient.get('/admin/database/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devlock-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Backup failed');
    }
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  return (
    <div className="space-y-8 min-h-full rounded-2xl pb-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Platform overview, system health, and pending actions.</p>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50" />
            <div className="flex items-center gap-3 mb-2 text-gray-500">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-sm">Total Users</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50" />
            <div className="flex items-center gap-3 mb-2 text-gray-500">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-sm">Total Tenants</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalTenants || 0}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full opacity-50" />
            <div className="flex items-center gap-3 mb-2 text-gray-500">
              <FolderKanban className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-sm">Total Projects</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalProjects || 0}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50" />
            <div className="flex items-center gap-3 mb-2 text-gray-500">
              <Key className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-sm">Total Licenses</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900">{stats?.totalLicenses || 0}</div>
              <div className="text-sm font-medium text-emerald-600">({stats?.activeLicenses || 0} Active)</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">System Health</h2>
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Database className="w-4 h-4" />
            Backup Database
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-gray-500">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-sm">CPU Usage</span>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {sysStatus?.cpuUsage?.toFixed(1) || '0.0'}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (sysStatus?.cpuUsage || 0) > 80 ? 'bg-red-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(sysStatus?.cpuUsage || 0, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-gray-500">
              <MemoryStick className="w-5 h-5 text-teal-600" />
              <span className="font-medium text-sm">RAM Usage</span>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {sysStatus?.ramUsage?.percentage?.toFixed(1) || '0.0'}%
              </span>
              <span className="text-xs font-medium text-gray-400 mb-1">
                {sysStatus ? `${formatBytes(sysStatus.ramUsage.used)} / ${formatBytes(sysStatus.ramUsage.total)}` : ''}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (sysStatus?.ramUsage?.percentage || 0) > 85 ? 'bg-red-500' : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min(sysStatus?.ramUsage?.percentage || 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-gray-500">
                <Database className="w-5 h-5 text-sky-600" />
                <span className="font-medium text-sm">Database</span>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${sysStatus?.database === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 capitalize mt-4">
              {sysStatus?.database || 'Checking...'}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-gray-500">
                <Clock className="w-5 h-5 text-rose-600" />
                <span className="font-medium text-sm">Uptime</span>
              </div>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-4">
              {sysStatus ? formatUptime(sysStatus.uptime) : '0d 0h 0m'}
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Pending Manual Payments</h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve bank transfers or crypto payments.</p>
        </div>
        
        {error ? (
          <div className="p-6 text-red-600 bg-red-50">{error}</div>
        ) : loading ? (
          <div className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
            <p className="text-lg font-medium text-gray-900">All caught up!</p>
            <p className="text-sm mt-1">No pending payments require your attention.</p>
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
                  <th className="px-6 py-4 text-right font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(payment => (
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
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button 
                        onClick={() => handleAction(payment._id, 'approve')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all shadow-sm"
                        title="Approve & Upgrade Plan"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(payment._id, 'reject')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
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

      {/* Payment History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <p className="text-sm text-gray-500 mt-1">Past approved or rejected payments.</p>
        </div>
        
        {paymentHistory.length === 0 ? (
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
