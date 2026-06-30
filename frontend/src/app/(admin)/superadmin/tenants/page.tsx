'use client';

import { useState, useEffect } from 'react';
import { Users, Edit3, Building, Search, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  owner: { _id: string; name: string; email: string };
  createdAt: string;
}

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'business', 'enterprise'];

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const tenantsData = await apiClient.get<Tenant[]>('/admin/tenants');
      setTenants(tenantsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleEditClick = (tenant: Tenant) => {
    setEditingId(tenant._id);
    setSelectedPlan(tenant.plan || 'free');
  };

  const handleUpdatePlan = async (id: string) => {
    try {
      setUpdating(true);
      await apiClient.post(`/admin/tenants/${id}/plan`, { plan: selectedPlan });
      setTenants((prev) =>
        prev.map((t) => (t._id === id ? { ...t, plan: selectedPlan } : t))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    } finally {
      setUpdating(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.owner?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Tenants & Subscriptions</h1>
            <p className="mt-1 text-sm text-gray-400">Manage all organizations and manually override their subscription plans.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search tenants..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 shadow-lg backdrop-blur-sm">
        <div className="border-b border-gray-800 p-6 flex justify-between items-center bg-gray-950/30">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">All Organizations ({filteredTenants.length})</h2>
          </div>
        </div>

        {error ? (
          <div className="p-6 text-red-400">{error}</div>
        ) : loading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Building className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-lg">No tenants found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-gray-800 bg-gray-950/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">Organization</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Owner</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Current Plan</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-right font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant._id} className="transition-colors hover:bg-gray-800/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{tenant.name}</div>
                      <div className="text-xs text-indigo-400">/{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{tenant.owner?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{tenant.owner?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === tenant._id ? (
                        <select
                          className="rounded-md border border-indigo-500/50 bg-gray-950 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={selectedPlan}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                        >
                          {PLAN_OPTIONS.map((plan) => (
                            <option key={plan} value={plan}>
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 capitalize text-xs font-semibold">
                          <Activity className="w-3 h-3" />
                          {tenant.plan || 'free'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(tenant.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="flex justify-end gap-2 px-6 py-4">
                      {editingId === tenant._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePlan(tenant._id)}
                            disabled={updating}
                            className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={updating}
                            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(tenant)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Change Plan
                        </button>
                      )}
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
