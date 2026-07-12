'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Activity, Database, Server, Clock, Cpu, MemoryStick, Users, Key, FolderKanban, Building2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

// Interfaces removed as they are no longer used here

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
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusData, statsData] = await Promise.all([
        apiClient.get<SystemStatus>('/admin/status'),
        apiClient.get<DashboardStats>('/admin/stats')
      ]);
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

      {/* Analytics & Activity Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Snapshot */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue Analytics</h2>
              <p className="text-sm text-gray-500 mt-1">Monthly recurring revenue and growth</p>
            </div>
            <select className="text-sm border-gray-200 rounded-lg bg-gray-50 text-gray-600 px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex items-center gap-8 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">$12,450</span>
                <span className="text-sm font-medium text-emerald-600">+14%</span>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Subscriptions</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">342</span>
                <span className="text-sm font-medium text-emerald-600">+5%</span>
              </div>
            </div>
          </div>
          <div className="h-48 w-full flex items-end gap-2 mt-4 pt-4 border-t border-gray-100">
            {/* Simple CSS bar chart mock */}
            {[40, 60, 45, 80, 65, 90, 75, 100, 85, 110, 95, 120].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-50 hover:bg-indigo-100 rounded-t-md relative group transition-colors" style={{ height: `${(h / 120) * 100}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  ${h * 100}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Activity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">System Activity</h2>
            <p className="text-sm text-gray-500 mt-1">Recent events requiring attention</p>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New tenant registered</p>
                <p className="text-xs text-gray-500">Acme Corp signed up for Pro plan</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">Automated database snapshot successful</p>
                <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Tamper attempt blocked</p>
                <p className="text-xs text-gray-500">Suspicious license validation rejected</p>
                <p className="text-xs text-gray-400 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
            View All Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}
